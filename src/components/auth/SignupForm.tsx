"use client";

import * as React from "react";
import Link from "next/link";
import {
  Mail,
  User,
  ArrowRight,
  CheckCircle2,
  Loader2,
  MailCheck,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

type Step = "details" | "check_email";

const STEPS: { key: Step; label: string }[] = [
  { key: "details", label: "Details" },
  { key: "check_email", label: "Check Inbox" },
];

function StepIndicator({ current }: { current: Step }) {
  const currentIdx = STEPS.findIndex((s) => s.key === current);

  return (
    <ol
      className="flex items-center justify-center gap-2 sm:gap-3"
      aria-label="Signup progress"
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
                  isDone && "bg-[var(--color-success)] text-white",
                  isActive &&
                    "bg-[var(--color-brand-500)] text-[var(--color-ink)] ring-4 ring-[var(--color-brand-100)]",
                  !isDone &&
                    !isActive &&
                    "bg-[var(--color-surface)] text-[var(--color-ink-subtle)] border border-[var(--color-border-strong)]",
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
                    : "text-[var(--color-ink-muted)]",
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
                    : "bg-[var(--color-border-strong)]",
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

function isValidEmail(s: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s.trim());
}

export function SignupForm() {
  const [step, setStep] = React.useState<Step>("details");
  const [name, setName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [sending, setSending] = React.useState(false);
  const [resending, setResending] = React.useState(false);
  const [resendOk, setResendOk] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const nameValid = name.trim().length >= 2;
  const emailValid = isValidEmail(email);

  async function sendMagicLink() {
    const supabase = createClient();
    // Name is captured into raw_user_meta_data → the on_auth_user_created
    // DB trigger copies it onto the profiles row.
    const { error: authError } = await supabase.auth.signInWithOtp({
      email: email.trim().toLowerCase(),
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback?next=/`,
        data: { name: name.trim() },
      },
    });
    return authError;
  }

  async function handleSendLink(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!nameValid) {
      setError("Please enter your name (at least 2 characters).");
      return;
    }
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

  return (
    <div className="w-full">
      <StepIndicator current={step} />

      <div className="mt-7 text-center">
        {step === "details" && (
          <>
            <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-[var(--color-ink)]">
              Create your account
            </h1>
            <p className="mt-2 text-[var(--color-ink-muted)]">
              Browse verified PGs free. Pay Rs 99 only to contact an owner.
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

      <div className="mt-7 rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-elevated)] p-6 sm:p-8 shadow-[var(--shadow-md)]">
        {error && (
          <div
            role="alert"
            className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"
          >
            {error}
          </div>
        )}

        {step === "details" && (
          <form onSubmit={handleSendLink} className="space-y-5" noValidate>
            <div>
              <label
                htmlFor="signup-name"
                className="block text-sm font-semibold mb-1.5 text-[var(--color-ink)]"
              >
                Your name
              </label>
              <div className="flex items-center gap-2 rounded-xl border border-[var(--color-border-strong)] bg-[var(--color-bg)] px-4 h-12 transition-colors focus-within:border-[var(--color-brand-500)] focus-within:ring-2 focus-within:ring-[var(--color-brand-100)]">
                <User
                  size={16}
                  className="text-[var(--color-ink-subtle)]"
                  aria-hidden="true"
                />
                <input
                  id="signup-name"
                  type="text"
                  autoComplete="name"
                  placeholder="Aditya Menon"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="flex-1 bg-transparent outline-none text-base"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="signup-email"
                className="block text-sm font-semibold mb-1.5 text-[var(--color-ink)]"
              >
                Email address
              </label>
              <div className="flex items-center gap-2 rounded-xl border border-[var(--color-border-strong)] bg-[var(--color-bg)] px-4 h-12 transition-colors focus-within:border-[var(--color-brand-500)] focus-within:ring-2 focus-within:ring-[var(--color-brand-100)]">
                <Mail
                  size={16}
                  className="text-[var(--color-ink-subtle)]"
                  aria-hidden="true"
                />
                <input
                  id="signup-email"
                  type="email"
                  inputMode="email"
                  autoComplete="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="flex-1 bg-transparent outline-none text-base"
                  aria-describedby="signup-email-help"
                />
              </div>
              <p
                id="signup-email-help"
                className="mt-1.5 text-xs text-[var(--color-ink-subtle)]"
              >
                We&apos;ll email you a one-click sign-in link. No password needed.
              </p>
            </div>

            <Button
              type="submit"
              variant="cta"
              size="lg"
              fullWidth
              disabled={sending || !nameValid || !emailValid}
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

            <p className="text-center text-xs text-[var(--color-ink-subtle)] pt-1">
              By signing up, you agree to our{" "}
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
                Click the link in your email to finish signing up.
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
                  setStep("details");
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

      <p className="mt-6 text-center text-sm text-[var(--color-ink-muted)]">
        Already have an account?{" "}
        <Link
          href="/login"
          className="font-semibold text-[var(--color-brand-700)] hover:underline"
        >
          Login
        </Link>
      </p>

      <div className="mt-3 text-center">
        <Link
          href="/owner/signup"
          className="text-xs text-[var(--color-ink-muted)] hover:text-[var(--color-brand-700)] hover:underline inline-flex items-center gap-1"
        >
          Are you a PG owner? List your property
          <ArrowRight size={12} />
        </Link>
      </div>
    </div>
  );
}
