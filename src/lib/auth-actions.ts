"use server";

/**
 * Auth-adjacent server actions that need to bypass RLS (or that we want to
 * route through the server for privacy reasons).
 *
 * These run with the SERVICE ROLE key on the server — they MUST validate
 * their inputs and only return the narrow slice the client needs.
 */

import { createAdminClient } from "@/lib/supabase/server";

/**
 * Look up the email address associated with a phone number, for the
 * "log in with phone + password" flow.
 *
 * Why server-side: the prior implementation queried `profiles` directly from
 * the anonymous client. The public RLS policy `profiles_select_public`
 * (`using (true)`) made that work but also let anyone enumerate phone →
 * email pairs by spamming the lookup. After migration 0005 tightens that
 * policy, the anon client can no longer read renter profiles at all — so we
 * route the lookup through this admin-keyed server action, which validates
 * the phone format first and only returns the single matching email (or
 * null).
 *
 * Returns `null` if no profile matches. NEVER throws on "not found" — that
 * would let the caller distinguish "valid phone, no account" from "invalid
 * phone", which leaks info to attackers.
 */
export async function findEmailByPhone(
  phone: string,
): Promise<string | null> {
  // Strict input validation: must be `+91` followed by a 10-digit Indian
  // mobile number starting with 6-9. Anything else returns null.
  const cleaned = String(phone ?? "").trim();
  if (!/^\+91[6-9]\d{9}$/.test(cleaned)) {
    return null;
  }

  try {
    const supabase = await createAdminClient();
    const { data, error } = await supabase
      .from("profiles")
      .select("email")
      .eq("phone", cleaned)
      .maybeSingle();

    if (error) {
      console.error("findEmailByPhone query failed:", error.message);
      return null;
    }
    return (data?.email as string | null) ?? null;
  } catch (err) {
    console.error(
      "findEmailByPhone unexpected error:",
      (err as Error).message,
    );
    return null;
  }
}
