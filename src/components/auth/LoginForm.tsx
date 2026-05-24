"use client";

import * as React from "react";
import Link from "next/link";
import {
  Mail,
  ArrowRight,
  CheckCircle2,
  Loader2,
  MailCheck,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

type Step = "email" | "check_email";

interface LoginFormProps {
  /** Where to send the owner-login link. Defaults to /owner/login for renter form. */
  ownerLoginHref?: string;
  /** Variant label appearing in headline copy + determines post-login redirect. */
  flavor?: "renter" | "owner";
}

const STEPS: { key: Step; label: string }[] = [
  { key: "email", label: "Email" },
  { key: "check_email", label: "Check Inbox" },
];

function StepIndicator({ current }: { current: Step }) {
  const currentIdx = STEPS.findIndex((s) => s.key === current);

  return (
    <ol
      className="flex items-center justify-center gap-2 sm:gap-3"
      aria-label="Login progress"
    >
      {STEPS.map((s, i) => {
        const isActive = i === currentIdx;
        const isDone = i < currentIdx;
        return (
          <React.Fragment key={s.key}>
            <li
              className="flex items-center gap-1.5 text-xs sm:text-sm"
              aria-current={isActive ? "step" : undefined}
            >
              <span
                className={cn(
                  "inline-flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-bold transition-colors",
                  isDone &&
                    "bg-[var(--color-success)] text-white",
                  isActive &&
                    "bg-[var(--color-brand-500)] text-[var(--color-ink)] ring-4 ring-[var(--color-brand-100)]",
                  !isDone &&
                    !isActive &&
                    "bg-[var(--color-surface)] text-[var(--color-ink-subtle)] border border-[var(--color-border-strong)]"
                )}
                aria-hidden="true"
              >
                {isDone ? <CheckCircle2 size={14} /> : i + 1}
              </span>
              <span
                className={cn(
                  "font-medium transition-colors",
                  isActive
                    ? "text-[var(--color-ink)]"
                    : "text-[var(--color-ink-muted)]"
                )}
              >
                {s.label}
              </span>
            </li>
            {i < STEPS.length - 1 && (
              <span
                className={cn(
                  "h-px w-4 sm:w-8 transition-colors",
                  isDone
                    ? "bg-[var(--color-success)]"
                    : "bg-[var(--color-border-strong)]"
                )}
                aria-hidden="true"
              />
            )}
          </React.Fragment>
        );
      })}
    </ol>
  );
}

function GoogleIcon({ size = 18 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 18 18"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M17.64 9.205c0-.639-.057-1.252-.164-1.841H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z"
        fill="#4285F4"
      />
      <path
        d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.71H.957v2.332A8.997 8.997 0 0 0 9 18z"
        fill="#34A853"
      />
      <path
        d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z"
        fill="#FBBC05"
      />
      <path
        d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z"
        fill="#EA4335"
      />
    </svg>
  );
}

// Basic email shape check — Supabase will do real validation server-side.
function isValidEmail(s: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s.trim());
}

export function LoginForm({
  ownerLoginHref = "/owner/login",
  flavor = "renter",
}: LoginFormProps) {
  const [step, setStep] = React.useState<Step>("email");
  const [email, setEmail] = React.useState("");
  const [sending, setSending] = React.useState(false);
  const [resending, setResending] = React.useState(false);
  const [resendOk, setResendOk] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const emailValid = isValidEmail(email);

  async function sendMagicLink() {
    const supabase = createClient();
    const next = flavor === "owner" ? "/owner/dashboard" : "/";
    const { error: authError } = await supabase.auth.signInWithOtp({
      email: email.trim().toLowerCase(),
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`,
      },
    });
    return authError;
  }

  async function handleSendLink(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!emailValid) {
      setError("Please enter a valid email address.");
      return;
    }
    setSending(true);
    const authError = await sendMagicLink();
    setSending(false);
    if (authError) {
      setError(authError.message);
      return;
    }
    setStep("check_email");
  }

  async function handleResend() {
    setError(null);
    setResendOk(false);
    setResending(true);
    const authError = await sendMagicLink();
    setResending(false);
    if (authError) {
      setError(authError.message);
      return;
    }
    setResendOk(true);
  }

  function handleGoogleSignIn() {
    // PENDING (Phase 1C): wire Supabase OAuth provider once Google OAuth
    // client is configured in Supabase Dashboard → Auth → Providers.
    setError("Google sign-in is coming soon. Please use the magic link for now.");
  }

  return (
    <div className="w-full">
      {/* Step indicator */}
      <StepIndicator current={step} />

      {/* Headline */}
      <div className="mt-7 text-center">
        {step === "email" && (
          <>
            <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-[var(--color-ink)]">
              {flavor === "owner" ? "Welcome back, owner" : "Welcome back to HostelPups"}
            </h1>
            <p className="mt-2 text-[var(--color-ink-muted)]">
              {flavor === "owner"
                ? "Enter your email — we'll send you a secure login link."
                : "Sign in with your email — it takes 10 seconds, no password."}
            </p>
          </>
        )}
        {step === "check_email" && (
          <>
            <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-[var(--color-ink)]">
              Check your inbox
            </h1>
            <p className="mt-2 text-[var(--color-ink-muted)]">
              We sent a magic link to{" "}
              <span className="font-semibold text-[var(--color-ink)]">{email}</span>.
            </p>
          </>
        )}
      </div>

      {/* Form card */}
      <div className="mt-7 rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-elevated)] p-6 sm:p-8 shadow-[var(--shadow-md)]">
        {error && (
          <div
            role="alert"
            className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"
          >
            {error}
          </div>
        )}

        {step === "email" && (
          <form onSubmit={handleSendLink} className="space-y-5" noValidate>
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-semibold mb-1.5 text-[var(--color-ink)]"
              >
                Email address
              </label>
              <div className="flex items-center gap-2 rounded-xl border border-[var(--color-border-strong)] bg-[var(--color-bg)] px-4 h-12 transition-colors focus-within:border-[var(--color-brand-500)] focus-within:ring-2 focus-within:ring-[var(--color-brand-100)]">
                <Mail size={16} className="text-[var(--color-ink-subtle)]" aria-hidden="true" />
                <input
                  id="email"
                  type="email"
                  inputMode="email"
                  autoComplete="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="flex-1 bg-transparent outline-none text-base"
                  aria-describedby="email-help"
                />
              </div>
              <p id="email-help" className="mt-1.5 text-xs text-[var(--color-ink-subtle)]">
                We&apos;ll email you a one-click sign-in link. No password needed.
              </p>
            </div>

            <Button
              type="submit"
              variant="cta"
              size="lg"
              fullWidth
              disabled={sending || !emailValid}
            >
              {sending ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  Sending link…
                </>
              ) : (
                <>
                  Send magic link
                  <ArrowRight size={18} />
                </>
              )}
            </Button>

            {/* OR divider */}
            <div className="relative my-1">
              <div className="absolute inset-0 flex items-center" aria-hidden="true">
                <div className="w-full border-t border-[var(--color-border)]" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-[var(--color-bg-elevated)] px-3 text-[var(--color-ink-subtle)] font-semibold tracking-wider">
                  Or
                </span>
              </div>
            </div>

            <Button
              type="button"
              variant="outline"
              size="lg"
              fullWidth
              onClick={handleGoogleSignIn}
            >
              <GoogleIcon />
              Continue with Google
            </Button>

            <p className="text-center text-xs text-[var(--color-ink-subtle)] pt-1">
              By continuing, you agree to our{" "}
              <Link
                href="/terms"
                className="text-[var(--color-brand-700)] hover:underline font-medium"
              >
                Terms
              </Link>{" "}
              and{" "}
              <Link
                href="/privacy"
                className="text-[var(--color-brand-700)] hover:underline font-medium"
              >
                Privacy Policy
              </Link>
              .
            </p>
          </form>
        )}

        {step === "check_email" && (
          <div className="text-center py-3 space-y-5">
            <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50">
              <MailCheck
                size={32}
                className="text-[var(--color-success)]"
                aria-hidden="true"
              />
            </div>
            <div className="space-y-1.5">
              <p className="text-base font-semibold text-[var(--color-ink)]">
                Click the link in your email to log in.
              </p>
              <p className="text-sm text-[var(--color-ink-muted)]">
                The link expires in 10 minutes. Check your spam folder if you
                don&apos;t see it within a minute.
              </p>
            </div>

            {resendOk && (
              <div
                role="status"
                className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700"
              >
                New link sent. Check your inbox.
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 pt-1">
              <Button
                type="button"
                variant="outline"
                size="md"
                fullWidth
                onClick={() => {
                  setStep("email");
                  setResendOk(false);
                  setError(null);
                }}
              >
                Wrong email? Try again
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="md"
                fullWidth
                onClick={handleResend}
                disabled={resending}
              >
                {resending ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    Resending…
                  </>
                ) : (
                  "Resend link"
                )}
              </Button>
            </div>
          </div>
        )}
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
