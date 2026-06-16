"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  AtSign,
  Lock,
  ArrowRight,
  Loader2,
  Eye,
  EyeOff,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { createClient } from "@/lib/supabase/client";
import { findEmailByPhone } from "@/lib/auth-actions";
import { cn, safeNext } from "@/lib/utils";

interface LoginFormProps {
  /** Cross-link target for the "Are you an owner? Owner login" footer link. */
  ownerLoginHref?: string;
  /** Visual flavor + determines post-login redirect (owner → dashboard, renter → /). */
  flavor?: "renter" | "owner";
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_REGEX = /^[6-9]\d{9}$/;

type IdentifierKind = "email" | "phone" | "unknown" | "empty";

/**
 * Classify the identifier on the fly so we can show the right inline hint
 * and pick the right login path (direct email vs phone-to-email lookup).
 */
function classifyIdentifier(raw: string): IdentifierKind {
  const trimmed = raw.trim();
  if (trimmed.length === 0) return "empty";
  if (trimmed.includes("@")) {
    return EMAIL_REGEX.test(trimmed.toLowerCase()) ? "email" : "unknown";
  }
  const digits = trimmed.replace(/\D/g, "");
  // Allow either 10-digit "9876543210" or "+91 98765 43210" / "91 98765 43210"
  // — we use the last 10 digits when present.
  if (digits.length >= 10) {
    const last10 = digits.slice(-10);
    return PHONE_REGEX.test(last10) ? "phone" : "unknown";
  }
  return "unknown";
}

function friendlyError(err: { message?: string } | null | undefined): string {
  const m = err?.message?.toLowerCase() ?? "";
  if (m.includes("invalid login credentials") || m.includes("invalid email or password")) {
    return "Email/phone or password is incorrect.";
  }
  if (m.includes("email not confirmed") || m.includes("email_not_confirmed")) {
    return "Please confirm your email first. Check your inbox for the confirmation link.";
  }
  if (m.includes("rate limit")) {
    return "Too many attempts. Wait a minute and try again.";
  }
  if (m.includes("password should be at least")) {
    return "Password must be at least 6 characters.";
  }
  return err?.message || "Something went wrong. Please try again.";
}

export function LoginForm({
  ownerLoginHref = "/owner/login",
  flavor = "renter",
}: LoginFormProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextPath = safeNext(searchParams.get("next"));
  const [identifier, setIdentifier] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [showPw, setShowPw] = React.useState(false);
  const [submitting, setSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const identifierRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    identifierRef.current?.focus();
  }, []);

  const kind = classifyIdentifier(identifier);
  const identifierValid = kind === "email" || kind === "phone";
  const passwordValid = password.length >= 6;
  const canSubmit = identifierValid && passwordValid && !submitting;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!identifierValid) {
      setError("Use your email address or a 10-digit Indian phone number.");
      return;
    }
    if (!passwordValid) {
      setError("Password must be at least 6 characters.");
      return;
    }

    setSubmitting(true);
    const supabase = createClient();

    let emailForLogin = identifier.trim().toLowerCase();

    if (kind === "phone") {
      // Phone-to-email lookup goes through a server action so we don't
      // expose the profiles table to anonymous enumeration via RLS.
      const digits = identifier.replace(/\D/g, "").slice(-10);
      const phoneFormatted = `+91${digits}`;

      let matchedEmail: string | null = null;
      try {
        matchedEmail = await findEmailByPhone(phoneFormatted);
      } catch {
        setSubmitting(false);
        setError("Couldn't look up that phone number. Try again or use email.");
        return;
      }
      if (!matchedEmail) {
        setSubmitting(false);
        setError("No account found with that phone number.");
        return;
      }
      emailForLogin = matchedEmail.toLowerCase();
    }

    const { data, error: authError } = await supabase.auth.signInWithPassword({
      email: emailForLogin,
      password,
    });

    if (authError) {
      setSubmitting(false);
      setError(friendlyError(authError));
      return;
    }

    // Look up the user's role + ban flag so admin lands at /admin,
    // owner at /owner/dashboard, user at /. Falls back gracefully if
    // is_banned doesn't exist yet (Expand-Contract: migration 0009
    // may not be applied yet when this code ships).
    let role: string | null = null;
    let isBanned = false;
    if (data.user) {
      try {
        const r = await supabase
          .from("profiles")
          .select("role, is_banned")
          .eq("id", data.user.id)
          .maybeSingle();
        if (r.error) throw r.error;
        role = (r.data?.role as string | undefined) ?? null;
        isBanned = Boolean(r.data?.is_banned);
      } catch {
        try {
          const r2 = await supabase
            .from("profiles")
            .select("role")
            .eq("id", data.user.id)
            .maybeSingle();
          role = (r2.data?.role as string | undefined) ?? null;
        } catch {
          // Fall through to intent-based redirect
        }
      }
    }

    if (isBanned) {
      await supabase.auth.signOut();
      setSubmitting(false);
      setError(
        "This account has been suspended. Contact support@hostelpups.in for help.",
      );
      return;
    }

    setSubmitting(false);

    // Redirect priority:
    //   1. role=admin → /admin (only honor ?next= if it's an /admin path)
    //   2. validated ?next= from the URL
    //   3. role=owner OR signup intent=owner → /owner/dashboard
    //   4. fallback → /
    if (role === "admin") {
      router.replace(nextPath?.startsWith("/admin") ? nextPath : "/admin");
      router.refresh();
      return;
    }

    const intent =
      (data.user?.user_metadata?.intent as string | undefined) ?? "renter";
    const dest =
      nextPath ??
      (role === "owner" || intent === "owner" ? "/owner/dashboard" : "/");
    router.replace(dest);
    router.refresh();
  }

  return (
    <div className="w-full">
      <div className="text-center">
        <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-[var(--color-ink)]">
          {flavor === "owner" ? "Welcome back, owner" : "Welcome back"}
        </h1>
        <p className="mt-2 text-[var(--color-ink-muted)]">
          Log in with your email or phone number.
        </p>
      </div>

      <div className="mt-7 rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-elevated)] p-6 sm:p-8 shadow-[var(--shadow-md)]">
        {error && (
          <div
            role="alert"
            className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"
          >
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          {/* Identifier — email or phone */}
          <div>
            <label
              htmlFor="login-identifier"
              className="block text-sm font-semibold mb-1.5 text-[var(--color-ink)]"
            >
              Email or phone number
            </label>
            <div className="flex items-center gap-2 rounded-xl border border-[var(--color-border-strong)] bg-[var(--color-bg)] px-4 h-12 transition-colors focus-within:border-[var(--color-brand-500)] focus-within:ring-2 focus-within:ring-[var(--color-brand-100)]">
              <AtSign size={16} className="text-[var(--color-ink-subtle)]" aria-hidden="true" />
              <input
                ref={identifierRef}
                id="login-identifier"
                type="text"
                inputMode="email"
                autoComplete="username"
                placeholder="aditya@example.com  or  9876543210"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                className="flex-1 bg-transparent outline-none text-base min-w-0"
                aria-describedby="login-identifier-help"
                aria-invalid={kind === "unknown"}
              />
            </div>
            <p
              id="login-identifier-help"
              className={cn(
                "mt-1.5 text-xs",
                kind === "unknown"
                  ? "text-red-600"
                  : "text-[var(--color-ink-subtle)]",
              )}
            >
              {kind === "unknown"
                ? "Use email or 10-digit phone."
                : kind === "phone"
                  ? "Looks like a phone number — we'll match it to your account."
                  : kind === "email"
                    ? "Looks good."
                    : "Use the same identifier you signed up with."}
            </p>
          </div>

          {/* Password */}
          <div>
            <label
              htmlFor="login-password"
              className="block text-sm font-semibold mb-1.5 text-[var(--color-ink)]"
            >
              Password
            </label>
            <div className="flex items-center gap-2 rounded-xl border border-[var(--color-border-strong)] bg-[var(--color-bg)] px-4 h-12 transition-colors focus-within:border-[var(--color-brand-500)] focus-within:ring-2 focus-within:ring-[var(--color-brand-100)]">
              <Lock size={16} className="text-[var(--color-ink-subtle)]" aria-hidden="true" />
              <input
                id="login-password"
                type={showPw ? "text" : "password"}
                autoComplete="current-password"
                placeholder="Your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="flex-1 bg-transparent outline-none text-base min-w-0"
              />
              <button
                type="button"
                onClick={() => setShowPw((v) => !v)}
                aria-label={showPw ? "Hide password" : "Show password"}
                className="text-[var(--color-ink-subtle)] hover:text-[var(--color-ink)] p-1"
              >
                {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            <div className="mt-1.5 text-right">
              <Link
                href="/forgot-password"
                className="text-xs font-medium text-[var(--color-brand-700)] hover:underline"
              >
                Forgot password?
              </Link>
            </div>
          </div>

          <Button
            type="submit"
            variant="cta"
            size="lg"
            fullWidth
            disabled={!canSubmit}
          >
            {submitting ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                Logging in…
              </>
            ) : (
              <>
                Log in
                <ArrowRight size={18} />
              </>
            )}
          </Button>
        </form>
      </div>

      {/* Footer links */}
      <p className="mt-6 text-center text-sm text-[var(--color-ink-muted)]">
        {flavor === "owner" ? (
          <>
            New owner?{" "}
            <Link
              href="/owner/signup"
              className="font-semibold text-[var(--color-brand-700)] hover:underline"
            >
              Sign up to list your property
            </Link>
          </>
        ) : (
          <>
            Don&apos;t have an account?{" "}
            <Link
              href="/signup"
              className="font-semibold text-[var(--color-brand-700)] hover:underline"
            >
              Sign up free
            </Link>
          </>
        )}
      </p>

      <div className="mt-3 text-center">
        <Link
          href={ownerLoginHref}
          className="text-xs text-[var(--color-ink-muted)] hover:text-[var(--color-brand-700)] hover:underline inline-flex items-center gap-1"
        >
          {flavor === "owner" ? "Renter login" : "Are you a PG owner? Owner login"}
          <ArrowRight size={12} />
        </Link>
      </div>
    </div>
  );
}
