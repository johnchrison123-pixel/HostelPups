"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { Call, CallEndReason } from "@/lib/types";

/**
 * Initiate a voice call from the current user to a listing's owner.
 *
 * - Verifies the listing exists and is live.
 * - Prevents the owner from calling themselves.
 * - Ensures an inquiry row exists for (user, listing) — calls are always
 *   scoped to an inquiry (anti-disintermediation: same surface as chat).
 * - Inserts a `calls` row in `ringing` state and returns it; the client then
 *   redirects to /call/[id]?role=caller and waits for callee acceptance via
 *   the realtime channel `call:{id}`.
 *
 * Throws on any failure — the caller (CallButton) will surface the message.
 */
export async function initiateCall(input: {
  listing_id: string;
}): Promise<Call> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  // Lookup listing — must be live, must not be owned by caller.
  const { data: listing, error: listingError } = await supabase
    .from("listings")
    .select("id, owner_id, status")
    .eq("id", input.listing_id)
    .maybeSingle();

  if (listingError) {
    throw new Error("Could not load listing");
  }
  if (!listing) throw new Error("Listing not found");
  if (listing.status !== "live") throw new Error("Listing is not available for calls");
  if (listing.owner_id === user.id) throw new Error("You cannot call yourself");

  // Get or create the inquiry row.
  // Using upsert with onConflict("user_id,listing_id") because there's a UNIQUE
  // constraint on those columns (see 0001_initial_schema.sql line 154).
  const { data: inquiry, error: inquiryError } = await supabase
    .from("inquiries")
    .upsert(
      { user_id: user.id, listing_id: input.listing_id },
      { onConflict: "user_id,listing_id", ignoreDuplicates: false },
    )
    .select("id")
    .single();

  if (inquiryError || !inquiry) {
    throw new Error("Could not create inquiry");
  }

  // Create the call row.
  const { data: call, error: callError } = await supabase
    .from("calls")
    .insert({
      inquiry_id: inquiry.id,
      caller_id: user.id,
      callee_id: listing.owner_id,
      status: "ringing",
    })
    .select("*")
    .single();

  if (callError || !call) {
    throw new Error(callError?.message ?? "Could not create call");
  }

  return call as Call;
}

/**
 * Callee accepts the ringing call. RLS + the WHERE clause both restrict this
 * to the actual callee, and only when the call is still in `ringing` state
 * (prevents double-accept / race vs. auto-miss).
 */
export async function acceptCall(callId: string): Promise<void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { error } = await supabase
    .from("calls")
    .update({
      status: "accepted",
      accepted_at: new Date().toISOString(),
    })
    .eq("id", callId)
    .eq("callee_id", user.id)
    .eq("status", "ringing");

  if (error) throw new Error(error.message);
}

/**
 * Callee rejects the ringing call. Sets end_reason='rejected' and ended_at
 * (the DB trigger calls_finalize_duration will then compute duration=0
 * since accepted_at is null and ended_at ≈ started_at).
 */
export async function rejectCall(callId: string): Promise<void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { error } = await supabase
    .from("calls")
    .update({
      status: "rejected",
      end_reason: "rejected",
      ended_at: new Date().toISOString(),
    })
    .eq("id", callId)
    .eq("callee_id", user.id)
    .eq("status", "ringing");

  if (error) throw new Error(error.message);
}

/**
 * Caller cancels a call that they themselves started, before the callee picks up.
 */
export async function cancelCall(callId: string): Promise<void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { error } = await supabase
    .from("calls")
    .update({
      status: "cancelled",
      end_reason: "user_cancelled",
      ended_at: new Date().toISOString(),
    })
    .eq("id", callId)
    .eq("caller_id", user.id)
    .eq("status", "ringing");

  if (error) throw new Error(error.message);
}

/**
 * End an active call (either side). Sets ended_at; the trigger fills in
 * duration_seconds. `reason` is one of the values from CallEndReason.
 *
 * The .neq("status", "ended") prevents double-ending if both peers hangup
 * simultaneously (idempotent, network-jitter safe).
 */
export async function endCall(
  callId: string,
  reason: CallEndReason,
): Promise<void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { error } = await supabase
    .from("calls")
    .update({
      status: "ended",
      end_reason: reason,
      ended_at: new Date().toISOString(),
    })
    .eq("id", callId)
    .or(`caller_id.eq.${user.id},callee_id.eq.${user.id}`)
    .neq("status", "ended");

  if (error) throw new Error(error.message);

  revalidatePath("/calls");
  revalidatePath("/owner/calls");
}

/**
 * Mark a call as missed (callee never answered). Typically invoked client-side
 * after a ringing timeout (e.g. 60s in IncomingCallModal).
 */
export async function markCallMissed(callId: string): Promise<void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { error } = await supabase
    .from("calls")
    .update({
      status: "missed",
      end_reason: "no_answer",
      ended_at: new Date().toISOString(),
    })
    .eq("id", callId)
    .or(`caller_id.eq.${user.id},callee_id.eq.${user.id}`)
    .eq("status", "ringing");

  if (error) throw new Error(error.message);
}

/**
 * Record an unrecoverable connection failure (ICE-fail, getUserMedia denied,
 * SDP exchange timeout, etc.) so the row reflects what actually happened in
 * the WebRTC layer instead of being orphaned in 'ringing'.
 */
export async function failCall(callId: string): Promise<void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { error } = await supabase
    .from("calls")
    .update({
      status: "failed",
      end_reason: "network_error",
      ended_at: new Date().toISOString(),
    })
    .eq("id", callId)
    .or(`caller_id.eq.${user.id},callee_id.eq.${user.id}`)
    .neq("status", "ended");

  if (error) throw new Error(error.message);
}

/**
 * Persist mute toggle so call history shows whether either party muted.
 * Best-effort — failures are logged server-side but never thrown to the UI
 * (mute state is a nice-to-have, not load-bearing).
 */
export async function recordMuteState(
  callId: string,
  side: "caller" | "callee",
  muted: boolean,
): Promise<void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  const field = side === "caller" ? "caller_muted" : "callee_muted";
  await supabase
    .from("calls")
    .update({ [field]: muted })
    .eq("id", callId)
    .or(`caller_id.eq.${user.id},callee_id.eq.${user.id}`);
}
