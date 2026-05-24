"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Phone,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  Loader2,
  KeyRound,
  ShieldCheck,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

type Step = "phone" | "verify";

interface LoginFormProps {
  /** Where to send the owner-login link. Defaults to /owner/login for renter form. */
  ownerLoginHref?: string;
  /** Variant label appearing in headline copy + determines post-login redirect. */
  flavor?: "renter" | "owner";
}

const STEPS: { key: Step; label: string }[] = [
  { key: "phone", label: "Phone" },
  { key: "verify", label: "Verify" },
];

const RESEND_COOLDOWN_S = 30;

// 10 digits, must start with 6/7/8/9 — Indian mobile format.
const PHONE_REGEX = /^[6-9]\d{9}$/;
const OTP_REGEX = /^\d{6}$/;

/** Strip spaces, dashes, parentheses, plus signs from pasted input. */
function normalisePhoneInput(raw: string) {
  return raw.replace(/[^0-9]/g, "").slice(0, 10);
}

/** Map raw Supabase errors to user-friendly copy. Falls back to the raw message. */
function friendlyAuthError(message: string): string {
  const m = message.toLowerCase();
  if (m.includes("rate limit")) {
    return "Too many attempts. Please wait a minute and try again.";
  }
  if (m.includes("provider") && m.includes("phone")) {
    return "Phone sign-in isn't enabled yet. The team is wiring SMS — please try email login or check back soon.";
  }
  if (m.includes("invalid") && m.includes("phone")) {
    return "That phone number doesn't look valid. Please use a 10-digit Indian mobile number.";
  }
  if (m.includes("token") || m.includes("otp") || m.includes("code")) {
    return "That OTP didn't match. Please re-enter the 6-digit code or resend.";
  }
  if (m.includes("expired")) {
    return "Your OTP has expired. Tap Resend to get a new one.";
  }
  return message || "Something went wrong. Please try again.";
}

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

export function LoginForm({
  ownerLoginHref = "/owner/login",
  flavor = "renter",
}: LoginFormProps) {
  const router = useRouter();
  const [step, setStep] = React.useState<Step>("phone");
  const [phone, setPhone] = React.useState("");
  const [otp, setOtp] = React.useState("");
  const [sending, setSending] = React.useState(false);
  const [verifying, setVerifying] = React.useState(false);
  const [resendCooldown, setResendCooldown] = React.useState(0);
  const [resendOk, setResendOk] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const phoneInputRef = React.useRef<HTMLInputElement>(null);
  const otpInputRef = React.useRef<HTMLInputElement>(null);

  const phoneValid = PHONE_REGEX.test(phone);
  const otpValid = OTP_REGEX.test(otp);
  const fullPhone = `+91${phone}`;

  // Auto-focus input on step change.
  React.useEffect(() => {
    if (step === "phone") {
      phoneInputRef.current?.focus();
    } else if (step === "verify") {
      otpInputRef.current?.focus();
    }
  }, [step]);

  // Resend cooldown ticker.
  React.useEffect(() => {
    if (resendCooldown <= 0) return;
    const t = setTimeout(() => setResendCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [resendCooldown]);

  async function sendOtp() {
    const supabase = createClient();
    const { error: authError } = await supabase.auth.signInWithOtp({
      phone: fullPhone,
      options: {
        shouldCreateUser: true,
      },
    });
    return authError;
  }

  async function handleSendOtp(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!phoneValid) {
      setError("Enter a 10-digit Indian mobile number starting with 6, 7, 8, or 9.");
      return;
    }
    setSending(true);
    const authError = await sendOtp();
    setSending(false);
    if (authError) {
      setError(friendlyAuthError(authError.message));
      return;
    }
    setStep("verify");
    setResendCooldown(RESEND_COOLDOWN_S);
  }

  async function handleVerifyOtp(e?: React.FormEvent) {
    e?.preventDefault();
    setError(null);
    if (!otpValid) {
      setError("Please enter the 6-digit code we sent you.");
      return;
    }
    setVerifying(true);
    const supabase = createClient();
    const { error: authError } = await supabase.auth.verifyOtp({
      phone: fullPhone,
      token: otp,
      type: "sms",
    });
    setVerifying(false);
    if (authError) {
      setError(friendlyAuthError(authError.message));
      return;
    }
    // Success — session cookies are populated.
    const next = flavor === "owner" ? "/owner/dashboard" : "/";
    router.replace(next);
    router.refresh();
  }

  async function handleResend() {
    if (resendCooldown > 0) return;
    setError(null);
    setResendOk(false);
    setSending(true);
    const authError = await sendOtp();
    setSending(false);
    if (authError) {
      setError(friendlyAuthError(authError.message));
      return;
    }
    setResendOk(true);
    setResendCooldown(RESEND_COOLDOWN_S);
  }

  function handleEditPhone() {
    setStep("phone");
    setOtp("");
    setError(null);
    setResendOk(false);
  }

  function handleGoogleSignIn() {
    // PENDING (Phase 1C): wire Supabase OAuth provider once Google OAuth
    // client is configured in Supabase Dashboard → Auth → Providers. The
    // existing /auth/callback route handles the redirect.
    setError("Google sign-in is coming soon. Please use phone OTP for now.");
  }

  // Auto-submit OTP once 6 digits are entered.
  function handleOtpChange(raw: string) {
    const digits = raw.replace(/\D/g, "").slice(0, 6);
    setOtp(digits);
    if (digits.length === 6 && !verifying) {
      // Use setTimeout to ensure the latest state is read before submit.
      setTimeout(() => {
        void handleVerifyOtp();
      }, 0);
    }
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
              We&apos;ll send a 6-digit code to your phone — no password needed.
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
              <span className="font-semibold text-[var(--color-ink)]">{fullPhone}</span>.
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
                <span className="text-base font-semibold text-[var(--color-ink-muted)] select-none">
                  +91
                </span>
                <input
                  ref={phoneInputRef}
                  id="phone"
                  type="tel"
                  inputMode="numeric"
                  autoComplete="tel-national"
                  placeholder="98765 43210"
                  value={phone}
                  onChange={(e) => setPhone(normalisePhoneInput(e.target.value))}
                  className="flex-1 bg-transparent outline-none text-base tracking-wider"
                  aria-describedby="phone-help"
                  maxLength={10}
                />
              </div>
              <p id="phone-help" className="mt-1.5 text-xs text-[var(--color-ink-subtle)]">
                We&apos;ll text you a one-time code. Standard SMS rates apply.
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
                  Sending code…
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
                6-digit code
              </label>
              <div className="flex items-center gap-2 rounded-xl border border-[var(--color-border-strong)] bg-[var(--color-bg)] px-4 h-14 transition-colors focus-within:border-[var(--color-brand-500)] focus-within:ring-2 focus-within:ring-[var(--color-brand-100)]">
                <KeyRound size={18} className="text-[var(--color-ink-subtle)]" aria-hidden="true" />
                <input
                  ref={otpInputRef}
                  id="otp"
                  type="text"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  placeholder="123456"
                  value={otp}
                  onChange={(e) => handleOtpChange(e.target.value)}
                  className="flex-1 bg-transparent outline-none text-2xl font-bold tracking-[0.5em] text-center"
                  aria-describedby="otp-help"
                  maxLength={6}
                />
              </div>
              <p id="otp-help" className="mt-1.5 text-xs text-[var(--color-ink-subtle)]">
                Enter the code from your SMS. It expires in 10 minutes.
              </p>
            </div>

            {resendOk && (
              <div
                role="status"
                className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700"
              >
                New code sent. Check your SMS.
              </div>
            )}

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
                  Verify &amp; sign in
                  <ShieldCheck size={18} />
                </>
              )}
            </Button>

            <div className="flex flex-col sm:flex-row items-center justify-between gap-2 text-sm">
              <button
                type="button"
                onClick={handleEditPhone}
                className="inline-flex items-center gap-1.5 text-[var(--color-brand-700)] hover:underline font-medium"
              >
                <ArrowLeft size={14} />
                Wrong number? Edit
              </button>
              <button
                type="button"
                onClick={handleResend}
                disabled={resendCooldown > 0 || sending}
                className={cn(
                  "font-medium transition-colors",
                  resendCooldown > 0 || sending
                    ? "text-[var(--color-ink-subtle)] cursor-not-allowed"
                    : "text-[var(--color-brand-700)] hover:underline",
                )}
              >
                {resendCooldown > 0
                  ? `Resend in ${resendCooldown}s`
                  : sending
                    ? "Resending…"
                    : "Resend OTP"}
              </button>
            </div>
          </form>
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
