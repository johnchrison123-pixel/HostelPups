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
/**
 * DEV-MODE signup that bypasses Supabase's normal validation.
 *
 * Uses `auth.admin.createUser()` server-side with the SERVICE ROLE key.
 * This skips:
 *  - "Confirm email" requirement (we set email_confirm:true)
 *  - Email-domain validation (Supabase rejects @test.com etc. on regular signUp)
 *  - Disposable-email blocklists
 *  - Captcha / rate-limit checks that hit on the normal signUp endpoint
 *
 * The trade-off: ANYONE who can call this can create unlimited accounts.
 * Fine for the current "not public yet, testing only" phase. Before public
 * launch, replace with normal supabase.auth.signUp() OR add rate-limiting
 * + a captcha here.
 *
 * Returns `{ ok: true }` on success — the client then signs in with the
 * same email+password to establish the browser session.
 * Returns `{ ok: false, error: "..." }` on failure.
 */
export async function createAccount(input: {
  email: string;
  password: string;
  name: string;
  phone: string; // 10-digit, no +91 prefix
  city: string;
  intent: "renter" | "owner";
  business_name?: string;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  // Basic validation
  const email = String(input.email ?? "").trim().toLowerCase();
  const password = String(input.password ?? "");
  const name = String(input.name ?? "").trim();
  const phone = String(input.phone ?? "").replace(/\D/g, "").slice(-10);
  const city = String(input.city ?? "").trim();
  const intent = input.intent === "owner" ? "owner" : "renter";
  const business_name = input.business_name?.trim();

  if (!email || !email.includes("@")) {
    return { ok: false, error: "Please enter a valid email" };
  }
  if (password.length < 6) {
    return { ok: false, error: "Password must be at least 6 characters" };
  }
  if (name.length < 2) {
    return { ok: false, error: "Please enter your name" };
  }
  if (!/^[6-9]\d{9}$/.test(phone)) {
    return { ok: false, error: "Phone must be a 10-digit Indian mobile" };
  }
  if (!city) {
    return { ok: false, error: "Please select a city" };
  }
  if (intent === "owner" && !business_name) {
    return { ok: false, error: "Please enter your business / property name" };
  }

  try {
    const supabase = await createAdminClient();

    // Check if email already exists (avoid confusing "email already exists" errors)
    const { data: existing } = await supabase
      .from("profiles")
      .select("id")
      .eq("email", email)
      .maybeSingle();
    if (existing) {
      return { ok: false, error: "An account with this email already exists. Try logging in." };
    }

    // Use admin API — this bypasses email-domain validation, disposable
    // email blocks, captcha, and "Confirm email" requirements.
    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        name,
        phone: `+91${phone}`,
        city,
        intent,
        ...(business_name ? { business_name } : {}),
      },
    });

    if (error) {
      console.error("admin.createUser failed:", error.message);
      // Map known errors to friendlier copy
      const m = error.message.toLowerCase();
      if (m.includes("already") || m.includes("registered")) {
        return { ok: false, error: "An account with this email already exists. Try logging in." };
      }
      return { ok: false, error: error.message };
    }

    if (!data?.user) {
      return { ok: false, error: "Could not create account. Please try again." };
    }

    // The on_auth_user_created trigger will populate public.profiles
    // automatically. We don't need to do it here.

    return { ok: true };
  } catch (err) {
    console.error("createAccount unexpected error:", (err as Error).message);
    return { ok: false, error: "Something went wrong. Please try again." };
  }
}

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
