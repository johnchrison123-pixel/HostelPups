import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { safeNext } from "@/lib/utils";

/**
 * Magic-link / OAuth callback handler.
 *
 * When a user clicks the magic link in their email (or completes an OAuth
 * flow), Supabase redirects them here with a `code` query parameter. We
 * exchange that code for a session and redirect to the intended destination.
 *
 * Test by:
 *   1. Click the magic-link button on /signup or /login
 *   2. Open the email Supabase sent
 *   3. Click the link inside — it routes here with ?code=...
 *   4. Session is established, user is redirected to /next param (or home)
 */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  // C1 — validate ?next= through the shared safeNext() helper. Only same-
  // origin paths beginning with a single `/` survive; anything else (full
  // URLs, protocol-relative `//evil.com`, `/\\evil.com`) is rejected and
  // we fall back to the home page. Without this, /auth/callback would
  // happily forward a freshly-authenticated session to a phishing site.
  const next = safeNext(searchParams.get("next")) ?? "/";

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      // Successful auth — redirect to intended destination
      const forwardedHost = request.headers.get("x-forwarded-host");
      const isLocalEnv = process.env.NODE_ENV === "development";

      if (isLocalEnv) {
        return NextResponse.redirect(`${origin}${next}`);
      }
      if (forwardedHost) {
        return NextResponse.redirect(`https://${forwardedHost}${next}`);
      }
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  // Auth failed — bounce back to login with error param, preserving the
  // user's intended destination so the next attempt sends them through.
  const errorUrl = new URL(`${origin}/login`);
  errorUrl.searchParams.set("error", "auth_callback_failed");
  if (next && next !== "/") {
    errorUrl.searchParams.set("next", next);
  }
  return NextResponse.redirect(errorUrl.toString());
}
