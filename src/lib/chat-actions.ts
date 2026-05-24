"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { redactContactInfo } from "@/lib/utils";

/**
 * Server actions for the chat module.
 *
 * Every outgoing message — including the first message attached to an
 * inquiry — passes through `redactContactInfo()` so phone numbers, emails,
 * UPI handles, and social links are stripped before they hit the DB.
 *
 * `was_redacted` is persisted on the message row so admins can audit
 * disintermediation attempts and so the bubble can render a small notice.
 */

export interface CreateInquiryInput {
  listing_id: string;
  first_message?: string;
}

export interface CreateInquiryResult {
  inquiry_id: string;
  was_redacted: boolean;
  reasons: string[];
}

/**
 * Create an inquiry on a listing (or fetch the existing one, since a UNIQUE
 * constraint on (user_id, listing_id) means each user gets ONE inquiry per
 * listing). If `first_message` is provided, redact + insert it too.
 *
 * Throws on: not-authenticated, listing-not-found, listing-not-live, or
 * owner-inquiring-on-own-listing. Caller (a client component / form action)
 * should catch + surface a friendly error.
 */
export async function createInquiry(
  input: CreateInquiryInput,
): Promise<CreateInquiryResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { data: listing, error: listingErr } = await supabase
    .from("listings")
    .select("id, status, owner_id")
    .eq("id", input.listing_id)
    .maybeSingle();

  if (listingErr) throw listingErr;
  if (!listing) throw new Error("Listing not found");
  if (listing.status !== "live") throw new Error("Listing not available");
  if (listing.owner_id === user.id) {
    throw new Error("Cannot inquire on your own listing");
  }

  // Upsert keeps things idempotent: a renter who clicks "Send inquiry" twice
  // doesn't get an error — they're routed back to the same conversation.
  const { data: inquiry, error: inqErr } = await supabase
    .from("inquiries")
    .upsert(
      { user_id: user.id, listing_id: input.listing_id },
      { onConflict: "user_id,listing_id", ignoreDuplicates: false },
    )
    .select("id")
    .single();

  if (inqErr) throw inqErr;
  if (!inquiry) throw new Error("Failed to create inquiry");

  let was_redacted = false;
  let reasons: string[] = [];

  // Insert first message if provided. Always run through redactContactInfo.
  const firstMsg = input.first_message?.trim();
  if (firstMsg) {
    const result = redactContactInfo(firstMsg);
    was_redacted = result.hadContact;
    reasons = result.reasons;
    const { error: msgErr } = await supabase.from("messages").insert({
      inquiry_id: inquiry.id,
      sender_id: user.id,
      content: result.redacted,
      was_redacted: result.hadContact,
    });
    if (msgErr) throw msgErr;
  }

  revalidatePath("/messages");
  revalidatePath(`/messages/${inquiry.id}`);
  revalidatePath("/owner/inquiries");

  return {
    inquiry_id: inquiry.id,
    was_redacted,
    reasons,
  };
}

export interface SendMessageInput {
  inquiry_id: string;
  content: string;
}

export interface SendMessageResult {
  message: {
    id: string;
    inquiry_id: string;
    sender_id: string;
    content: string;
    was_redacted: boolean;
    created_at: string;
  };
  was_redacted: boolean;
  reasons: string[];
}

/**
 * Send a message on an existing inquiry.
 *
 * IMPORTANT: every outgoing message passes through redactContactInfo first.
 * The DB stores the redacted text + a `was_redacted` boolean. The realtime
 * channel will fan this out to the other participant's MessageThread.
 */
export async function sendMessage(
  input: SendMessageInput,
): Promise<SendMessageResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const trimmed = input.content.trim();
  if (!trimmed) throw new Error("Empty message");
  if (trimmed.length > 5000) {
    throw new Error("Message too long (max 5000 characters)");
  }

  const result = redactContactInfo(trimmed);

  const { data, error } = await supabase
    .from("messages")
    .insert({
      inquiry_id: input.inquiry_id,
      sender_id: user.id,
      content: result.redacted,
      was_redacted: result.hadContact,
    })
    .select("id, inquiry_id, sender_id, content, was_redacted, created_at")
    .single();

  if (error) throw error;
  if (!data) throw new Error("Failed to send message");

  revalidatePath(`/messages/${input.inquiry_id}`);
  revalidatePath(`/owner/inquiries/${input.inquiry_id}`);
  revalidatePath("/messages");
  revalidatePath("/owner/inquiries");

  return {
    message: data as SendMessageResult["message"],
    was_redacted: result.hadContact,
    reasons: result.reasons,
  };
}

/**
 * Mark a conversation as "responded" (owner replies trigger this via a DB
 * trigger automatically, but renters can call this explicitly to flip an
 * "open" inquiry back to "responded" after they re-engage).
 *
 * No-op if the inquiry doesn't exist or the user isn't a participant — RLS
 * blocks the update either way.
 */
export async function markConversationRead(inquiryId: string): Promise<void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  try {
    await supabase
      .from("inquiries")
      .update({ status: "responded" })
      .eq("id", inquiryId)
      .eq("status", "open");
  } catch {
    // Best-effort — read state is non-critical
  }
  revalidatePath(`/messages/${inquiryId}`);
  revalidatePath(`/owner/inquiries/${inquiryId}`);
}
