"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient, createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/admin-auth";
import { logAdminAction } from "@/lib/admin-audit";

/**
 * Every action here follows the same shape:
 *   1. requireAdmin()                 → guard
 *   2. fetch the "before" row         → for audit trail
 *   3. mutate via admin client        → bypasses RLS safely (we already
 *                                       proved admin role in step 1)
 *   4. logAdminAction()               → audit row written to admin_actions
 *   5. revalidatePath(...)            → invalidate the relevant pages
 *   6. return { ok: true } | { ok: false, error }
 *
 * Errors are returned, not thrown, so the calling client form can render
 * a friendly message instead of a Next.js error overlay.
 */

type ActionResult = { ok: true } | { ok: false; error: string };

async function fetchRow<T = Record<string, unknown>>(
  table: string,
  id: string,
): Promise<T | null> {
  try {
    const admin = await createAdminClient();
    const { data } = await admin.from(table).select("*").eq("id", id).maybeSingle();
    return (data ?? null) as T | null;
  } catch {
    return null;
  }
}

/* ============================================================
   Users — ban / unban / edit / delete / set role / force logout
   ============================================================ */

export async function banUser(input: {
  userId: string;
  reason: string;
}): Promise<ActionResult> {
  const me = await requireAdmin();
  if (input.userId === me.id) {
    return { ok: false, error: "You can't ban yourself." };
  }
  if (!input.reason || input.reason.trim().length < 3) {
    return { ok: false, error: "Please provide a ban reason (min 3 chars)." };
  }
  const before = await fetchRow("profiles", input.userId);
  if (!before) return { ok: false, error: "User not found." };

  try {
    const admin = await createAdminClient();
    const { error } = await admin
      .from("profiles")
      .update({
        is_banned: true,
        banned_at: new Date().toISOString(),
        banned_reason: input.reason.trim(),
        banned_by: me.id,
      })
      .eq("id", input.userId);
    if (error) return { ok: false, error: error.message };

    // Best-effort: sign the user out everywhere
    try {
      await admin.auth.admin.signOut(input.userId, "global");
    } catch {
      // ignore — ban still in effect
    }

    const after = await fetchRow("profiles", input.userId);
    await logAdminAction({
      adminId: me.id,
      action: "ban_user",
      targetTable: "profiles",
      targetId: input.userId,
      before,
      after,
      reason: input.reason.trim(),
    });
    revalidatePath("/admin/users");
    revalidatePath(`/admin/users/${input.userId}`);
    return { ok: true };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}

export async function unbanUser(input: { userId: string }): Promise<ActionResult> {
  const me = await requireAdmin();
  const before = await fetchRow("profiles", input.userId);
  if (!before) return { ok: false, error: "User not found." };

  try {
    const admin = await createAdminClient();
    const { error } = await admin
      .from("profiles")
      .update({
        is_banned: false,
        banned_at: null,
        banned_reason: null,
        banned_by: null,
      })
      .eq("id", input.userId);
    if (error) return { ok: false, error: error.message };

    const after = await fetchRow("profiles", input.userId);
    await logAdminAction({
      adminId: me.id,
      action: "unban_user",
      targetTable: "profiles",
      targetId: input.userId,
      before,
      after,
    });
    revalidatePath("/admin/users");
    revalidatePath(`/admin/users/${input.userId}`);
    return { ok: true };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}

export async function editProfile(input: {
  userId: string;
  name?: string;
  email?: string;
  phone?: string;
  city?: string;
}): Promise<ActionResult> {
  const me = await requireAdmin();
  const before = await fetchRow("profiles", input.userId);
  if (!before) return { ok: false, error: "User not found." };

  const patch: Record<string, unknown> = {};
  if (typeof input.name === "string") patch.name = input.name.trim() || null;
  if (typeof input.email === "string") patch.email = input.email.trim().toLowerCase() || null;
  if (typeof input.phone === "string") patch.phone = input.phone.trim() || null;
  if (typeof input.city === "string") patch.city = input.city.trim() || null;
  if (Object.keys(patch).length === 0) return { ok: false, error: "Nothing to update." };

  try {
    const admin = await createAdminClient();
    const { error } = await admin.from("profiles").update(patch).eq("id", input.userId);
    if (error) return { ok: false, error: error.message };

    // Keep auth.users in sync for email/phone
    if (typeof patch.email === "string" || typeof patch.phone === "string") {
      try {
        await admin.auth.admin.updateUserById(input.userId, {
          email: (patch.email as string | undefined) ?? undefined,
          phone: (patch.phone as string | undefined) ?? undefined,
        });
      } catch {
        // Non-fatal — the profile row is what we display in admin tools.
      }
    }

    const after = await fetchRow("profiles", input.userId);
    await logAdminAction({
      adminId: me.id,
      action: "edit_profile",
      targetTable: "profiles",
      targetId: input.userId,
      before,
      after,
    });
    revalidatePath("/admin/users");
    revalidatePath(`/admin/users/${input.userId}`);
    return { ok: true };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}

export async function setUserRole(input: {
  userId: string;
  role: "user" | "owner" | "admin";
}): Promise<ActionResult> {
  const me = await requireAdmin();
  if (input.userId === me.id && input.role !== "admin") {
    return { ok: false, error: "You can't remove your own admin role." };
  }
  const before = await fetchRow("profiles", input.userId);
  if (!before) return { ok: false, error: "User not found." };

  try {
    const admin = await createAdminClient();
    const { error } = await admin
      .from("profiles")
      .update({ role: input.role })
      .eq("id", input.userId);
    if (error) return { ok: false, error: error.message };

    const after = await fetchRow("profiles", input.userId);
    await logAdminAction({
      adminId: me.id,
      action: "set_role",
      targetTable: "profiles",
      targetId: input.userId,
      before,
      after,
      reason: `role → ${input.role}`,
    });
    revalidatePath("/admin/users");
    revalidatePath(`/admin/users/${input.userId}`);
    return { ok: true };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}

export async function deleteUser(input: {
  userId: string;
  reason?: string;
}): Promise<ActionResult> {
  const me = await requireAdmin();
  if (input.userId === me.id) {
    return { ok: false, error: "You can't delete yourself." };
  }
  const before = await fetchRow("profiles", input.userId);
  if (!before) return { ok: false, error: "User not found." };

  try {
    const admin = await createAdminClient();
    // Delete auth.users — profiles cascades via the FK in 0001.
    const { error } = await admin.auth.admin.deleteUser(input.userId);
    if (error) return { ok: false, error: error.message };

    await logAdminAction({
      adminId: me.id,
      action: "delete_user",
      targetTable: "profiles",
      targetId: input.userId,
      before,
      after: null,
      reason: input.reason?.trim(),
    });
    revalidatePath("/admin/users");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}

export async function forceLogoutUser(input: {
  userId: string;
}): Promise<ActionResult> {
  const me = await requireAdmin();
  try {
    const admin = await createAdminClient();
    await admin.auth.admin.signOut(input.userId, "global");
    await logAdminAction({
      adminId: me.id,
      action: "force_logout",
      targetTable: "profiles",
      targetId: input.userId,
    });
    return { ok: true };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}

/* ============================================================
   Owners — KYC, suspend, edit, tier
   ============================================================ */

export async function approveOwnerKyc(input: {
  ownerId: string;
}): Promise<ActionResult> {
  const me = await requireAdmin();
  const before = await fetchRow("owners", input.ownerId);
  if (!before) return { ok: false, error: "Owner not found." };
  try {
    const admin = await createAdminClient();
    const { error } = await admin
      .from("owners")
      .update({ kyc_status: "verified", has_verification_badge: true })
      .eq("id", input.ownerId);
    if (error) return { ok: false, error: error.message };
    const after = await fetchRow("owners", input.ownerId);
    await logAdminAction({
      adminId: me.id,
      action: "approve_kyc",
      targetTable: "owners",
      targetId: input.ownerId,
      before,
      after,
    });
    revalidatePath("/admin/owners");
    revalidatePath(`/admin/owners/${input.ownerId}`);
    return { ok: true };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}

export async function rejectOwnerKyc(input: {
  ownerId: string;
  reason: string;
}): Promise<ActionResult> {
  const me = await requireAdmin();
  if (!input.reason || input.reason.trim().length < 3) {
    return { ok: false, error: "Please provide a rejection reason." };
  }
  const before = await fetchRow("owners", input.ownerId);
  if (!before) return { ok: false, error: "Owner not found." };
  try {
    const admin = await createAdminClient();
    const { error } = await admin
      .from("owners")
      .update({ kyc_status: "rejected", has_verification_badge: false })
      .eq("id", input.ownerId);
    if (error) return { ok: false, error: error.message };
    const after = await fetchRow("owners", input.ownerId);
    await logAdminAction({
      adminId: me.id,
      action: "reject_kyc",
      targetTable: "owners",
      targetId: input.ownerId,
      before,
      after,
      reason: input.reason.trim(),
    });
    revalidatePath("/admin/owners");
    revalidatePath(`/admin/owners/${input.ownerId}`);
    return { ok: true };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}

export async function editOwner(input: {
  ownerId: string;
  business_name?: string;
  contact_phone?: string;
  tier?: string;
}): Promise<ActionResult> {
  const me = await requireAdmin();
  const before = await fetchRow("owners", input.ownerId);
  if (!before) return { ok: false, error: "Owner not found." };
  const patch: Record<string, unknown> = {};
  if (typeof input.business_name === "string")
    patch.business_name = input.business_name.trim();
  if (typeof input.contact_phone === "string")
    patch.contact_phone = input.contact_phone.trim();
  if (typeof input.tier === "string") patch.tier = input.tier;
  if (Object.keys(patch).length === 0) return { ok: false, error: "Nothing to update." };
  try {
    const admin = await createAdminClient();
    const { error } = await admin.from("owners").update(patch).eq("id", input.ownerId);
    if (error) return { ok: false, error: error.message };
    const after = await fetchRow("owners", input.ownerId);
    await logAdminAction({
      adminId: me.id,
      action: "edit_owner",
      targetTable: "owners",
      targetId: input.ownerId,
      before,
      after,
    });
    revalidatePath(`/admin/owners/${input.ownerId}`);
    return { ok: true };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}

export async function suspendAllOwnerListings(input: {
  ownerId: string;
  reason: string;
}): Promise<ActionResult> {
  const me = await requireAdmin();
  if (!input.reason || input.reason.trim().length < 3) {
    return { ok: false, error: "Please provide a suspension reason." };
  }
  try {
    const admin = await createAdminClient();
    const { error } = await admin
      .from("listings")
      .update({ status: "paused" })
      .eq("owner_id", input.ownerId);
    if (error) return { ok: false, error: error.message };
    await logAdminAction({
      adminId: me.id,
      action: "suspend_owner",
      targetTable: "owners",
      targetId: input.ownerId,
      reason: input.reason.trim(),
    });
    revalidatePath("/admin/listings");
    revalidatePath(`/admin/owners/${input.ownerId}`);
    return { ok: true };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}

/* ============================================================
   Listings — suspend / restore / feature / delete
   ============================================================ */

async function setListingStatus(
  meId: string,
  listingId: string,
  newStatus: string,
  action: "suspend_listing" | "restore_listing",
  reason?: string,
): Promise<ActionResult> {
  const before = await fetchRow("listings", listingId);
  if (!before) return { ok: false, error: "Listing not found." };
  try {
    const admin = await createAdminClient();
    const { error } = await admin
      .from("listings")
      .update({ status: newStatus })
      .eq("id", listingId);
    if (error) return { ok: false, error: error.message };
    const after = await fetchRow("listings", listingId);
    await logAdminAction({
      adminId: meId,
      action,
      targetTable: "listings",
      targetId: listingId,
      before,
      after,
      reason,
    });
    revalidatePath("/admin/listings");
    revalidatePath(`/admin/listings/${listingId}`);
    return { ok: true };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}

export async function suspendListing(input: {
  listingId: string;
  reason: string;
}): Promise<ActionResult> {
  const me = await requireAdmin();
  if (!input.reason || input.reason.trim().length < 3) {
    return { ok: false, error: "Please provide a suspension reason." };
  }
  return setListingStatus(
    me.id,
    input.listingId,
    "paused",
    "suspend_listing",
    input.reason.trim(),
  );
}

export async function restoreListing(input: {
  listingId: string;
}): Promise<ActionResult> {
  const me = await requireAdmin();
  return setListingStatus(
    me.id,
    input.listingId,
    "live",
    "restore_listing",
  );
}

export async function featureListing(input: {
  listingId: string;
  daysAhead: number;
}): Promise<ActionResult> {
  const me = await requireAdmin();
  const days = Math.max(1, Math.min(90, Math.round(input.daysAhead)));
  const until = new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString();
  const before = await fetchRow("listings", input.listingId);
  if (!before) return { ok: false, error: "Listing not found." };
  try {
    const admin = await createAdminClient();
    const { error } = await admin
      .from("listings")
      .update({ is_boosted_until: until })
      .eq("id", input.listingId);
    if (error) return { ok: false, error: error.message };
    const after = await fetchRow("listings", input.listingId);
    await logAdminAction({
      adminId: me.id,
      action: "feature_listing",
      targetTable: "listings",
      targetId: input.listingId,
      before,
      after,
      reason: `featured for ${days} days`,
    });
    revalidatePath("/admin/listings");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}

export async function unfeatureListing(input: {
  listingId: string;
}): Promise<ActionResult> {
  const me = await requireAdmin();
  const before = await fetchRow("listings", input.listingId);
  if (!before) return { ok: false, error: "Listing not found." };
  try {
    const admin = await createAdminClient();
    const { error } = await admin
      .from("listings")
      .update({ is_boosted_until: null })
      .eq("id", input.listingId);
    if (error) return { ok: false, error: error.message };
    const after = await fetchRow("listings", input.listingId);
    await logAdminAction({
      adminId: me.id,
      action: "unfeature_listing",
      targetTable: "listings",
      targetId: input.listingId,
      before,
      after,
    });
    revalidatePath("/admin/listings");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}

export async function deleteListing(input: {
  listingId: string;
  reason: string;
}): Promise<ActionResult> {
  const me = await requireAdmin();
  if (!input.reason || input.reason.trim().length < 3) {
    return { ok: false, error: "Please provide a takedown reason." };
  }
  const before = await fetchRow("listings", input.listingId);
  if (!before) return { ok: false, error: "Listing not found." };
  try {
    const admin = await createAdminClient();
    const { error } = await admin.from("listings").delete().eq("id", input.listingId);
    if (error) return { ok: false, error: error.message };
    await logAdminAction({
      adminId: me.id,
      action: "delete_listing",
      targetTable: "listings",
      targetId: input.listingId,
      before,
      after: null,
      reason: input.reason.trim(),
    });
    revalidatePath("/admin/listings");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}

/* ============================================================
   Inquiries — close / reopen
   ============================================================ */

export async function closeInquiry(input: {
  inquiryId: string;
  reason?: string;
}): Promise<ActionResult> {
  const me = await requireAdmin();
  const before = await fetchRow("inquiries", input.inquiryId);
  if (!before) return { ok: false, error: "Inquiry not found." };
  try {
    const admin = await createAdminClient();
    const { error } = await admin
      .from("inquiries")
      .update({ status: "closed" })
      .eq("id", input.inquiryId);
    if (error) return { ok: false, error: error.message };
    const after = await fetchRow("inquiries", input.inquiryId);
    await logAdminAction({
      adminId: me.id,
      action: "close_inquiry",
      targetTable: "inquiries",
      targetId: input.inquiryId,
      before,
      after,
      reason: input.reason?.trim(),
    });
    revalidatePath("/admin/inquiries");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}

export async function reopenInquiry(input: {
  inquiryId: string;
}): Promise<ActionResult> {
  const me = await requireAdmin();
  const before = await fetchRow("inquiries", input.inquiryId);
  if (!before) return { ok: false, error: "Inquiry not found." };
  try {
    const admin = await createAdminClient();
    const { error } = await admin
      .from("inquiries")
      .update({ status: "open" })
      .eq("id", input.inquiryId);
    if (error) return { ok: false, error: error.message };
    const after = await fetchRow("inquiries", input.inquiryId);
    await logAdminAction({
      adminId: me.id,
      action: "reopen_inquiry",
      targetTable: "inquiries",
      targetId: input.inquiryId,
      before,
      after,
    });
    revalidatePath("/admin/inquiries");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}

/* ============================================================
   Content moderation
   ============================================================ */

export async function deleteMessage(input: {
  messageId: string;
  reason: string;
}): Promise<ActionResult> {
  const me = await requireAdmin();
  if (!input.reason || input.reason.trim().length < 3) {
    return { ok: false, error: "Please provide a reason." };
  }
  const before = await fetchRow("messages", input.messageId);
  if (!before) return { ok: false, error: "Message not found." };
  try {
    const admin = await createAdminClient();
    const { error } = await admin.from("messages").delete().eq("id", input.messageId);
    if (error) return { ok: false, error: error.message };
    await logAdminAction({
      adminId: me.id,
      action: "delete_message",
      targetTable: "messages",
      targetId: input.messageId,
      before,
      after: null,
      reason: input.reason.trim(),
    });
    revalidatePath("/admin/inquiries");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}

export async function deleteReview(input: {
  reviewId: string;
  reason: string;
}): Promise<ActionResult> {
  const me = await requireAdmin();
  if (!input.reason || input.reason.trim().length < 3) {
    return { ok: false, error: "Please provide a reason." };
  }
  const before = await fetchRow("reviews", input.reviewId);
  if (!before) return { ok: false, error: "Review not found." };
  try {
    const admin = await createAdminClient();
    const { error } = await admin.from("reviews").delete().eq("id", input.reviewId);
    if (error) return { ok: false, error: error.message };
    await logAdminAction({
      adminId: me.id,
      action: "delete_review",
      targetTable: "reviews",
      targetId: input.reviewId,
      before,
      after: null,
      reason: input.reason.trim(),
    });
    return { ok: true };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}

/* ============================================================
   Payments — refund / mark failed
   (Razorpay refund call wires in once you have an account)
   ============================================================ */

export async function refundPayment(input: {
  paymentId: string;
  reason: string;
}): Promise<ActionResult> {
  const me = await requireAdmin();
  if (!input.reason || input.reason.trim().length < 3) {
    return { ok: false, error: "Please provide a refund reason." };
  }
  const before = (await fetchRow("payments", input.paymentId)) as
    | { razorpay_payment_id?: string; amount?: number; status?: string }
    | null;
  if (!before) return { ok: false, error: "Payment not found." };
  if (before.status === "refunded") {
    return { ok: false, error: "Payment is already refunded." };
  }

  // TODO(Razorpay): once RAZORPAY_KEY_ID + RAZORPAY_KEY_SECRET are set,
  // call POST https://api.razorpay.com/v1/payments/{id}/refund here
  // with amount + reason in notes, and only flip status to 'refunded'
  // on a 200 response.
  // For now we mark refunded in DB so the founder can keep a ledger.

  try {
    const admin = await createAdminClient();
    const { error } = await admin
      .from("payments")
      .update({ status: "refunded" })
      .eq("id", input.paymentId);
    if (error) return { ok: false, error: error.message };
    const after = await fetchRow("payments", input.paymentId);
    await logAdminAction({
      adminId: me.id,
      action: "refund_payment",
      targetTable: "payments",
      targetId: input.paymentId,
      before,
      after,
      reason: input.reason.trim(),
    });
    revalidatePath("/admin/payments");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}

export async function markPaymentFailed(input: {
  paymentId: string;
  reason: string;
}): Promise<ActionResult> {
  const me = await requireAdmin();
  const before = await fetchRow("payments", input.paymentId);
  if (!before) return { ok: false, error: "Payment not found." };
  try {
    const admin = await createAdminClient();
    const { error } = await admin
      .from("payments")
      .update({ status: "failed" })
      .eq("id", input.paymentId);
    if (error) return { ok: false, error: error.message };
    const after = await fetchRow("payments", input.paymentId);
    await logAdminAction({
      adminId: me.id,
      action: "mark_payment_failed",
      targetTable: "payments",
      targetId: input.paymentId,
      before,
      after,
      reason: input.reason?.trim(),
    });
    revalidatePath("/admin/payments");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}

/* ============================================================
   Reports — resolve / dismiss
   ============================================================ */

export async function resolveReport(input: {
  reportId: string;
  note: string;
}): Promise<ActionResult> {
  const me = await requireAdmin();
  if (!input.note || input.note.trim().length < 3) {
    return { ok: false, error: "Please add a resolution note." };
  }
  const before = await fetchRow("reports", input.reportId);
  if (!before) return { ok: false, error: "Report not found." };
  try {
    const admin = await createAdminClient();
    const { error } = await admin
      .from("reports")
      .update({
        status: "resolved",
        resolved_by: me.id,
        resolved_at: new Date().toISOString(),
        resolution_note: input.note.trim(),
      })
      .eq("id", input.reportId);
    if (error) return { ok: false, error: error.message };
    const after = await fetchRow("reports", input.reportId);
    await logAdminAction({
      adminId: me.id,
      action: "resolve_report",
      targetTable: "reports",
      targetId: input.reportId,
      before,
      after,
      reason: input.note.trim(),
    });
    revalidatePath("/admin/reports");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}

export async function dismissReport(input: {
  reportId: string;
  note?: string;
}): Promise<ActionResult> {
  const me = await requireAdmin();
  const before = await fetchRow("reports", input.reportId);
  if (!before) return { ok: false, error: "Report not found." };
  try {
    const admin = await createAdminClient();
    const { error } = await admin
      .from("reports")
      .update({
        status: "dismissed",
        resolved_by: me.id,
        resolved_at: new Date().toISOString(),
        resolution_note: input.note?.trim() ?? null,
      })
      .eq("id", input.reportId);
    if (error) return { ok: false, error: error.message };
    const after = await fetchRow("reports", input.reportId);
    await logAdminAction({
      adminId: me.id,
      action: "dismiss_report",
      targetTable: "reports",
      targetId: input.reportId,
      before,
      after,
      reason: input.note?.trim(),
    });
    revalidatePath("/admin/reports");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}

/* ============================================================
   Bonus: search for the resolver — look up target rows by type+id
   so the reports page can preview what was reported.
   ============================================================ */

export async function fetchReportTarget(
  targetType: string,
  targetId: string,
): Promise<{ ok: true; data: Record<string, unknown> } | { ok: false; error: string }> {
  await requireAdmin();
  const tableMap: Record<string, string> = {
    listing: "listings",
    user: "profiles",
    message: "messages",
    review: "reviews",
    owner: "owners",
    inquiry: "inquiries",
  };
  const table = tableMap[targetType];
  if (!table) return { ok: false, error: "Unknown target type." };
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from(table)
      .select("*")
      .eq("id", targetId)
      .maybeSingle();
    if (error || !data) return { ok: false, error: "Target not found." };
    return { ok: true, data };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}
