"use client";

import * as React from "react";
import Link from "next/link";
import {
  Phone,
  User,
  ArrowRight,
  CheckCircle2,
  Loader2,
  KeyRound,
  PartyPopper,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";

type Step = "details" | "verify" | "welcome";

const STEPS: { key: Step; label: string }[] = [
  { key: "details", label: "Details" },
  { key: "verify", label: "Verify OTP" },
  { key: "welcome", label: "Welcome" },
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

export function SignupForm() {
  const [step, setStep] = React.useState<Step>("details");
  const [name, setName] = React.useState("");
  const [phone, setPhone] = React.useState("");
  const [otp, setOtp] = React.useState("");
  const [sending, setSending] = React.useState(false);
  const [verifying, setVerifying] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const nameValid = name.trim().length >= 2;
  const phoneValid = /^[6-9]\d{9}$/.test(phone);
  const otpValid = /^\d{6}$/.test(otp);

  function handleSendOtp(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!nameValid) {
      setError("Please enter your name (at least 2 characters).");
      return;
    }
    if (!phoneValid) {
      setError("Enter a 10-digit Indian mobile number starting with 6-9.");
      return;
    }
    setSending(true);
    // PENDING: wire to Supabase phone OTP — sb.auth.signInWithOtp({ phone: '+91' + phone })
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
    // PENDING: wire to Supabase sb.auth.verifyOtp({ phone, token: otp, type: 'sms' })
    // then INSERT into profiles { name, phone, role: 'user' }
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
        {step === "verify" && (
          <>
            <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-[var(--color-ink)]">
              Verify your phone
            </h1>
            <p className="mt-2 text-[var(--color-ink-muted)]">
              We sent a 6-digit code to{" "}
              <span className="font-semibold text-[var(--color-ink)]">
                +91 {phone}
              </span>
              .
            </p>
          </>
        )}
        {step === "welcome" && (
          <>
            <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-[var(--color-ink)]">
              Welcome to HostelPups
            </h1>
            <p className="mt-2 text-[var(--color-ink-muted)]">
              {name ? `${name.split(" ")[0]}, you're ` : "You're "}all set. Start
              browsing verified PGs.
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
          <form onSubmit={handleSendOtp} className="space-y-5" noValidate>
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
                htmlFor="signup-phone"
                className="block text-sm font-semibold mb-1.5 text-[var(--color-ink)]"
              >
                Phone number
              </label>
              <div className="flex items-center gap-2 rounded-xl border border-[var(--color-border-strong)] bg-[var(--color-bg)] px-4 h-12 transition-colors focus-within:border-[var(--color-brand-500)] focus-within:ring-2 focus-within:ring-[var(--color-brand-100)]">
                <Phone
                  size={16}
                  className="text-[var(--color-ink-subtle)]"
                  aria-hidden="true"
                />
                <span className="text-sm text-[var(--color-ink-muted)] font-medium">
                  +91
                </span>
                <input
                  id="signup-phone"
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
                  aria-describedby="signup-phone-help"
                />
              </div>
              <p
                id="signup-phone-help"
                className="mt-1.5 text-xs text-[var(--color-ink-subtle)]"
              >
                We&apos;ll send a one-time code via SMS. Standard rates apply.
              </p>
            </div>

            <Button
              type="submit"
              variant="cta"
              size="lg"
              fullWidth
              disabled={sending || !nameValid || !phoneValid}
            >
              {sending ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  Sending OTP…
                </>
              ) : (
                <>
                  Send OTP &amp; Sign Up
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

        {step === "verify" && (
          <form onSubmit={handleVerifyOtp} className="space-y-5" noValidate>
            <div>
              <label
                htmlFor="signup-otp"
                className="block text-sm font-semibold mb-1.5 text-[var(--color-ink)]"
              >
                6-digit verification code
              </label>
              <div className="flex items-center gap-2 rounded-xl border border-[var(--color-border-strong)] bg-[var(--color-bg)] px-4 h-14 transition-colors focus-within:border-[var(--color-brand-500)] focus-within:ring-2 focus-within:ring-[var(--color-brand-100)]">
                <KeyRound
                  size={16}
                  className="text-[var(--color-ink-subtle)]"
                  aria-hidden="true"
                />
                <input
                  id="signup-otp"
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
                  Verify &amp; create account
                  <ArrowRight size={18} />
                </>
              )}
            </Button>

            <div className="flex items-center justify-between text-sm">
              <button
                type="button"
                onClick={() => {
                  setStep("details");
                  setOtp("");
                  setError(null);
                }}
                className="text-[var(--color-ink-muted)] hover:text-[var(--color-ink)] hover:underline font-medium"
              >
                Change details
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
              <PartyPopper
                size={32}
                className="text-[var(--color-success)]"
                aria-hidden="true"
              />
            </div>
            <p className="text-[var(--color-ink-muted)] mb-5">
              Loading verified listings for you...
            </p>
            <Button href="/search" variant="cta" fullWidth>
              Start browsing PGs
              <ArrowRight size={16} />
            </Button>
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
