"use client";

import * as React from "react";
import Link from "next/link";
import { Phone, ArrowRight, CheckCircle2, Loader2, KeyRound } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";

type Step = "phone" | "verify" | "welcome";

interface LoginFormProps {
  /** Where to send the owner-login link. Defaults to /owner/login for renter form. */
  ownerLoginHref?: string;
  /** Variant label appearing in headline copy. */
  flavor?: "renter" | "owner";
}

const STEPS: { key: Step; label: string }[] = [
  { key: "phone", label: "Phone" },
  { key: "verify", label: "Verify" },
  { key: "welcome", label: "Welcome" },
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

export function LoginForm({ ownerLoginHref = "/owner/login", flavor = "renter" }: LoginFormProps) {
  const [step, setStep] = React.useState<Step>("phone");
  const [phone, setPhone] = React.useState("");
  const [otp, setOtp] = React.useState("");
  const [sending, setSending] = React.useState(false);
  const [verifying, setVerifying] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const phoneValid = /^[6-9]\d{9}$/.test(phone);
  const otpValid = /^\d{6}$/.test(otp);

  function handleSendOtp(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!phoneValid) {
      setError("Enter a 10-digit Indian mobile number starting with 6-9.");
      return;
    }
    setSending(true);
    // PENDING: wire to Supabase phone OTP — `sb.auth.signInWithOtp({ phone: '+91' + phone })`
    window.setTimeout(() => {
      setSending(false);
      setStep("verify");
    }, 700);
  }

  function handleVerifyOtp(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!otpValid) {
      setError("Enter the 6-digit code we just sent you.");
      return;
    }
    setVerifying(true);
    // PENDING: wire to Supabase `sb.auth.verifyOtp({ phone, token: otp, type: 'sms' })`
    window.setTimeout(() => {
      setVerifying(false);
      setStep("welcome");
    }, 700);
  }

  function handleResend() {
    setError(null);
    setOtp("");
    // PENDING: re-trigger Supabase OTP resend
  }

  function handleGoogleSignIn() {
    // PENDING: Supabase OAuth not yet wired — see lib/supabase.ts.
    // Owner asked to flag this; UI is functional placeholder only.
    setError("Google sign-in is coming soon. Please use phone OTP for now.");
  }

  return (
    <div className="w-full">
      {/* Step indicator */}
      <StepIndicator current={step} />

      {/* Headline */}
      <div className="mt-7 text-center">
        {step === "phone" && (
          <>
            <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-[var(--color-ink)]">
              {flavor === "owner" ? "Welcome back, owner" : "Welcome back to HostelPups"}
            </h1>
            <p className="mt-2 text-[var(--color-ink-muted)]">
              {flavor === "owner"
                ? "Sign in to manage listings, inquiries and boost performance."
                : "Sign in with your phone — it takes 10 seconds."}
            </p>
          </>
        )}
        {step === "verify" && (
          <>
            <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-[var(--color-ink)]">
              Enter your code
            </h1>
            <p className="mt-2 text-[var(--color-ink-muted)]">
              We sent a 6-digit code to{" "}
              <span className="font-semibold text-[var(--color-ink)]">+91 {phone}</span>.
            </p>
          </>
        )}
        {step === "welcome" && (
          <>
            <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-[var(--color-ink)]">
              You&apos;re in
            </h1>
            <p className="mt-2 text-[var(--color-ink-muted)]">
              Redirecting you to your dashboard...
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

        {step === "phone" && (
          <form onSubmit={handleSendOtp} className="space-y-5" noValidate>
            <div>
              <label
                htmlFor="phone"
                className="block text-sm font-semibold mb-1.5 text-[var(--color-ink)]"
              >
                Phone number
              </label>
              <div className="flex items-center gap-2 rounded-xl border border-[var(--color-border-strong)] bg-[var(--color-bg)] px-4 h-12 transition-colors focus-within:border-[var(--color-brand-500)] focus-within:ring-2 focus-within:ring-[var(--color-brand-100)]">
                <Phone size={16} className="text-[var(--color-ink-subtle)]" aria-hidden="true" />
                <span className="text-sm text-[var(--color-ink-muted)] font-medium">+91</span>
                <input
                  id="phone"
                  type="tel"
                  inputMode="numeric"
                  pattern="[6-9][0-9]{9}"
                  maxLength={10}
                  autoComplete="tel-national"
                  placeholder="9876543210"
                  value={phone}
                  onChange={(e) =>
                    setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))
                  }
                  className="flex-1 bg-transparent outline-none text-base"
                  aria-describedby="phone-help"
                />
              </div>
              <p id="phone-help" className="mt-1.5 text-xs text-[var(--color-ink-subtle)]">
                We&apos;ll send a one-time code via SMS. Standard rates apply.
              </p>
            </div>

            <Button
              type="submit"
              variant="cta"
              size="lg"
              fullWidth
              disabled={sending || !phoneValid}
            >
              {sending ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  Sending OTP…
                </>
              ) : (
                <>
                  Send OTP
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

        {step === "verify" && (
          <form onSubmit={handleVerifyOtp} className="space-y-5" noValidate>
            <div>
              <label
                htmlFor="otp"
                className="block text-sm font-semibold mb-1.5 text-[var(--color-ink)]"
              >
                6-digit verification code
              </label>
              <div className="flex items-center gap-2 rounded-xl border border-[var(--color-border-strong)] bg-[var(--color-bg)] px-4 h-14 transition-colors focus-within:border-[var(--color-brand-500)] focus-within:ring-2 focus-within:ring-[var(--color-brand-100)]">
                <KeyRound size={16} className="text-[var(--color-ink-subtle)]" aria-hidden="true" />
                <input
                  id="otp"
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]{6}"
                  maxLength={6}
                  autoComplete="one-time-code"
                  placeholder="000000"
                  value={otp}
                  onChange={(e) =>
                    setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))
                  }
                  className="flex-1 bg-transparent outline-none text-xl tracking-[0.5em] font-bold text-center placeholder:font-medium placeholder:text-[var(--color-ink-subtle)]"
                  autoFocus
                />
              </div>
            </div>

            <Button
              type="submit"
              variant="cta"
              size="lg"
              fullWidth
              disabled={verifying || !otpValid}
            >
              {verifying ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  Verifying…
                </>
              ) : (
                <>
                  Verify &amp; continue
                  <ArrowRight size={18} />
                </>
              )}
            </Button>

            <div className="flex items-center justify-between text-sm">
              <button
                type="button"
                onClick={() => {
                  setStep("phone");
                  setOtp("");
                  setError(null);
                }}
                className="text-[var(--color-ink-muted)] hover:text-[var(--color-ink)] hover:underline font-medium"
              >
                Change number
              </button>
              <button
                type="button"
                onClick={handleResend}
                className="text-[var(--color-brand-700)] hover:underline font-semibold"
              >
                Resend code
              </button>
            </div>
          </form>
        )}

        {step === "welcome" && (
          <div className="text-center py-6">
            <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50 mb-4">
              <CheckCircle2 size={32} className="text-[var(--color-success)]" aria-hidden="true" />
            </div>
            <p className="text-[var(--color-ink-muted)]">
              {flavor === "owner"
                ? "Loading your owner dashboard..."
                : "Loading your saved searches..."}
            </p>
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
