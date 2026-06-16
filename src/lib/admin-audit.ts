import { headers } from "next/headers";
import { createAdminClient } from "@/lib/supabase/server";

export type AdminActionName =
  | "ban_user"
  | "unban_user"
  | "edit_profile"
  | "delete_user"
  | "force_logout"
  | "set_role"
  | "approve_kyc"
  | "reject_kyc"
  | "suspend_owner"
  | "edit_owner"
  | "set_owner_tier"
  | "suspend_listing"
  | "restore_listing"
  | "feature_listing"
  | "unfeature_listing"
  | "delete_listing"
  | "edit_listing"
  | "close_inquiry"
  | "reopen_inquiry"
  | "delete_message"
  | "delete_review"
  | "refund_payment"
  | "mark_payment_failed"
  | "resolve_report"
  | "dismiss_report";

export interface LogAdminActionInput {
  adminId: string;
  action: AdminActionName;
  targetTable?: string;
  targetId?: string;
  before?: unknown;
  after?: unknown;
  reason?: string;
}

/**
 * Append an entry to public.admin_actions.
 *
 * Always uses the SERVICE ROLE client so the audit log is written
 * even if the admin's RLS context wouldn't normally allow it
 * (e.g. before the migration's policies finished propagating to
 * a read replica).
 *
 * The IP is best-effort — Vercel sets x-forwarded-for. Behind a
 * proxy the first IP in the list is the client.
 */
export async function logAdminAction(input: LogAdminActionInput): Promise<void> {
  try {
    const hdrs = await headers();
    const xff = hdrs.get("x-forwarded-for") ?? "";
    const ip = xff.split(",")[0]?.trim() || hdrs.get("x-real-ip") || null;

    const admin = await createAdminClient();
    await admin.from("admin_actions").insert({
      admin_id: input.adminId,
      action: input.action,
      target_table: input.targetTable ?? null,
      target_id: input.targetId ?? null,
      before: input.before ?? null,
      after: input.after ?? null,
      reason: input.reason ?? null,
      ip_address: ip,
    });
  } catch (e) {
    // Audit log MUST NOT block the mutation it's recording.
    // Surface to Vercel logs but don't throw.
    console.error("[admin-audit] failed to write audit row:", e);
  }
}
