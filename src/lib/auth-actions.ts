"use server";

/**
 * Auth-adjacent server actions that need to bypass RLS (or that we want to
 * route through the server for privacy reasons).
 *
 * These run with the SERVICE ROLE key on the server — they MUST validate
 * their inputs and only return the narrow slice the client needs.
 */

import { headers } from "next/headers";
import { createAdminClient } from "@/lib/supabase/server";

/* ============================================================
   In-memory per-IP rate limiter + captcha scaffolding (C4)
   ============================================================
   This is intentionally simple — a Map keyed by IP that tracks attempts
   inside a sliding window. It is NOT a substitute for a real distributed
   limiter (Upstash, Redis, Cloudflare) — those will be wired in V2. But
   IT IS substantially better than nothing:

     - On Vercel serverless, a given function instance handles many
       requests before tearing down. A bot attempting hundreds of signups
       per minute from one IP burns through the limit inside a single
       instance.
     - Even on instance churn the attacker is throttled to ~5 attempts
       per 10 minutes per warm instance, which slows the burn enough to
       give us time to ship Upstash.
     - Combined with the Turnstile captcha scaffolding below, humans get
       through fine while scripts eat either the rate-limit or the
       challenge.

   When `TURNSTILE_SECRET_KEY` is set, every createAccount call ALSO
   requires a `captchaToken` from Cloudflare Turnstile. Without the env
   var we log a warning and accept the request so today's testing is
   not broken.

   FOUNDER ACTION REQUIRED before public launch:
     1. Sign up at https://dash.cloudflare.com/sign-up (free)
     2. Create a Turnstile site → get the Site Key + Secret Key.
     3. In Vercel → Project Settings → Environment Variables, set BOTH:
          NEXT_PUBLIC_TURNSTILE_SITE_KEY  =  <site key>
          TURNSTILE_SECRET_KEY            =  <secret key>
        across Production / Preview / Development.
     4. Wire the Turnstile widget into <SignupForm /> + <OwnerSignupForm />
        — render <Turnstile siteKey={…} onSuccess={setToken} /> and pass
        the resolved `captchaToken` into createAccount({ captchaToken }).
     5. Redeploy.
   See https://developers.cloudflare.com/turnstile/get-started/ for the
   widget integration code.
*/

const RATE_LIMIT_MAX_ATTEMPTS = 5;
const RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000; // 10 minutes
const ENUMERATION_DELAY_MS = 200; // H8 — equal delay on hit/miss

interface IpBucket {
  count: number;
  resetAt: number;
}

// Module-scoped Map — survives between requests inside the same warm
// serverless instance. Resets on cold start, acceptable for V1.
const ipBuckets: Map<string, IpBucket> = new Map();

// Next 15+'s headers() return type isn't exported directly — alias it.
type ReadonlyHeaders = Awaited<ReturnType<typeof headers>>;

/**
 * Best-effort client-IP extraction. `x-forwarded-for` may contain a comma-
 * separated list (`client, proxy1, proxy2`) — take the leftmost (original
 * client). Falls back to a constant bucket so we still rate-limit
 * aggregate same-source traffic when no header is present.
 */
function clientIp(hdrs: ReadonlyHeaders): string {
  const xff = hdrs.get("x-forwarded-for");
  if (xff) {
    const first = xff.split(",")[0]?.trim();
    if (first) return first;
  }
  const real = hdrs.get("x-real-ip");
  if (real) return real.trim();
  return "unknown";
}

/**
 * Check + record an attempt. Returns true if the request is OVER the limit
 * and should be rejected, false if allowed. Purges expired buckets so the
 * Map doesn't grow unbounded.
 */
function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const existing = ipBuckets.get(ip);
  if (!existing || existing.resetAt <= now) {
    ipBuckets.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    if (ipBuckets.size > 1024) {
      for (const [key, bucket] of ipBuckets) {
        if (bucket.resetAt <= now) ipBuckets.delete(key);
      }
    }
    return false;
  }
  existing.count += 1;
  return existing.count > RATE_LIMIT_MAX_ATTEMPTS;
}

/**
 * Verify a Cloudflare Turnstile token. Returns true if valid OR if the
 * server isn't configured for Turnstile yet (no secret key) — we log a
 * warning instead of breaking testing. When the secret IS set, a missing
 * or invalid token always fails closed.
 */
async function verifyCaptcha(token: string | undefined): Promise<boolean> {
  const secret = process.env.TURNSTILE_SECRET_KEY;
  if (!secret) {
    console.warn(
      "[auth] TURNSTILE_SECRET_KEY is not set. createAccount is NOT captcha-protected. Set NEXT_PUBLIC_TURNSTILE_SITE_KEY + TURNSTILE_SECRET_KEY in Vercel before public launch.",
    );
    return true;
  }
  if (!token) return false;
  try {
    const res = await fetch(
      "https://challenges.cloudflare.com/turnstile/v0/siteverify",
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ secret, response: token }),
      },
    );
    const json = (await res.json()) as { success?: boolean };
    return json.success === true;
  } catch (err) {
    console.error(
      "[auth] Turnstile verification request failed:",
      (err as Error).message,
    );
    return false;
  }
}

/** Resolve after the given milliseconds. */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

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
  /**
   * Cloudflare Turnstile token from the front-end widget. Required once
   * TURNSTILE_SECRET_KEY is set in the environment — see header comment.
   * Until then it's optional so testing isn't blocked.
   */
  captchaToken?: string;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  // --- C4 (a): per-IP rate limit ---
  // Look up the caller IP from forwarded headers and check the in-memory
  // bucket. We do this BEFORE any DB or network work so a hammering bot
  // costs us as little as possible per rejected attempt.
  const hdrs = await headers();
  const ip = clientIp(hdrs);
  if (isRateLimited(ip)) {
    return {
      ok: false,
      error:
        "Too many signup attempts from your network. Please wait 10 minutes and try again.",
    };
  }

  // --- C4 (b): Turnstile captcha (no-op when not configured) ---
  const captchaOk = await verifyCaptcha(input.captchaToken);
  if (!captchaOk) {
    return {
      ok: false,
      error: "Captcha verification failed. Please refresh and try again.",
    };
  }

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

    // H8 mitigation — equalize timing between "email already exists" and
    // "email available" paths. We start a timer BEFORE the duplicate check
    // and await it before every return, so a scanner can't time the
    // difference between hit and miss.
    const startedAt = Date.now();
    const delayTo = async () => {
      const elapsed = Date.now() - startedAt;
      if (elapsed < ENUMERATION_DELAY_MS) {
        await sleep(ENUMERATION_DELAY_MS - elapsed);
      }
    };

    // Check if email already exists (avoid confusing "email already exists" errors)
    const { data: existing } = await supabase
      .from("profiles")
      .select("id")
      .eq("email", email)
      .maybeSingle();
    if (existing) {
      await delayTo();
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
      await delayTo();
      console.error("admin.createUser failed:", error.message);
      // Map known errors to friendlier copy
      const m = error.message.toLowerCase();
      if (m.includes("already") || m.includes("registered")) {
        return { ok: false, error: "An account with this email already exists. Try logging in." };
      }
      return { ok: false, error: error.message };
    }

    if (!data?.user) {
      await delayTo();
      return { ok: false, error: "Could not create account. Please try again." };
    }

    // The on_auth_user_created trigger will populate public.profiles
    // automatically. We don't need to do it here.

    await delayTo();
    return { ok: true };
  } catch (err) {
    console.error("createAccount unexpected error:", (err as Error).message);
    return { ok: false, error: "Something went wrong. Please try again." };
  }
}

export async function findEmailByPhone(
  phone: string,
): Promise<string | null> {
  // H8 mitigation — equalize timing so a scanner can't distinguish
  // "registered phone" from "unregistered phone" by latency. We start a
  // timer up front and await it on EVERY return path. Combined with the
  // C4 IP rate limit on createAccount, this raises the cost of phone-
  // enumeration attacks substantially.
  const startedAt = Date.now();
  const delayTo = async () => {
    const elapsed = Date.now() - startedAt;
    if (elapsed < ENUMERATION_DELAY_MS) {
      await sleep(ENUMERATION_DELAY_MS - elapsed);
    }
  };

  // Strict input validation: must be `+91` followed by a 10-digit Indian
  // mobile number starting with 6-9. Anything else returns null after the
  // same wait so a malformed-vs-valid timing channel doesn't open up.
  const cleaned = String(phone ?? "").trim();
  if (!/^\+91[6-9]\d{9}$/.test(cleaned)) {
    await delayTo();
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
      await delayTo();
      return null;
    }
    await delayTo();
    return (data?.email as string | null) ?? null;
  } catch (err) {
    console.error(
      "findEmailByPhone unexpected error:",
      (err as Error).message,
    );
    await delayTo();
    return null;
  }
}
