"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Phone,
  User,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  Loader2,
  KeyRound,
  ShieldCheck,
  PartyPopper,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { createClient } from "@/lib/supabase/client";
import { cn, formatPrice } from "@/lib/utils";
import { PRICING } from "@/lib/site";

type Step = "details" | "verify" | "welcome";

const STEPS: { key: Step; label: string }[] = [
  { key: "details", label: "Details" },
  { key: "verify", label: "Verify" },
  { key: "welcome", label: "Welcome" },
];

const RESEND_COOLDOWN_S = 30;

const PHONE_REGEX = /^[6-9]\d{9}$/;
const OTP_REGEX = /^\d{6}$/;

function normalisePhoneInput(raw: string) {
  return raw.replace(/[^0-9]/g, "").slice(0, 10);
}

function friendlyAuthError(message: string): string {
  const m = message.toLowerCase();
  if (m.includes("rate limit")) {
    return "Too many attempts. Please wait a minute and try again.";
  }
  if (m.includes("provider") && m.includes("phone")) {
    return "Phone sign-in isn't enabled yet. Please check back soon.";
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
  const router = useRouter();
  const [step, setStep] = React.useState<Step>("details");
  const [name, setName] = React.useState("");
  const [phone, setPhone] = React.useState("");
  const [otp, setOtp] = React.useState("");
  const [sending, setSending] = React.useState(false);
  const [verifying, setVerifying] = React.useState(false);
  const [resendCooldown, setResendCooldown] = React.useState(0);
  const [resendOk, setResendOk] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const nameInputRef = React.useRef<HTMLInputElement>(null);
  const otpInputRef = React.useRef<HTMLInputElement>(null);

  const nameValid = name.trim().length >= 2;
  const phoneValid = PHONE_REGEX.test(phone);
  const otpValid = OTP_REGEX.test(otp);
  const fullPhone = `+91${phone}`;

  React.useEffect(() => {
    if (step === "details") {
      nameInputRef.current?.focus();
    } else if (step === "verify") {
      otpInputRef.current?.focus();
    }
  }, [step]);

  React.useEffect(() => {
    if (resendCooldown <= 0) return;
    const t = setTimeout(() => setResendCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [resendCooldown]);

  async function sendOtp() {
    const supabase = createClient();
    // Name is captured into raw_user_meta_data so the handle_new_user
    // trigger can copy it onto the profiles row when the account is created.
    const { error: authError } = await supabase.auth.signInWithOtp({
      phone: fullPhone,
      options: {
        shouldCreateUser: true,
        data: { name: name.trim() },
      },
    });
    return authError;
  }

  async function handleSendOtp(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!nameValid) {
      setError("Please enter your name (at least 2 characters).");
      return;
    }
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
    // Success — session is set, cookies populated, profile row created by trigger.
    setStep("welcome");
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
    setStep("details");
    setOtp("");
    setError(null);
    setResendOk(false);
  }

  function handleContinue() {
    router.replace("/");
    router.refresh();
  }

  function handleOtpChange(raw: string) {
    const digits = raw.replace(/\D/g, "").slice(0, 6);
    setOtp(digits);
    if (digits.length === 6 && !verifying) {
      setTimeout(() => {
        void handleVerifyOtp();
      }, 0);
    }
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
              Browse verified PGs free. Pay {formatPrice(PRICING.user.week.price)} only to contact an owner.
            </p>
          </>
        )}
        {step === "verify" && (
          <>
            <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-[var(--color-ink)]">
              Verify your number
            </h1>
            <p className="mt-2 text-[var(--color-ink-muted)]">
              We sent a 6-digit code to{" "}
              <span className="font-semibold text-[var(--color-ink)]">{fullPhone}</span>.
            </p>
          </>
        )}
        {step === "welcome" && (
          <>
            <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-[var(--color-ink)]">
              Welcome, {name.split(" ")[0] || "friend"}!
            </h1>
            <p className="mt-2 text-[var(--color-ink-muted)]">
              Your account is ready. Let&apos;s find you a great PG.
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
                  ref={nameInputRef}
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
                <span className="text-base font-semibold text-[var(--color-ink-muted)] select-none">
                  +91
                </span>
                <input
                  id="signup-phone"
                  type="tel"
                  inputMode="numeric"
                  autoComplete="tel-national"
                  placeholder="98765 43210"
                  value={phone}
                  onChange={(e) => setPhone(normalisePhoneInput(e.target.value))}
                  className="flex-1 bg-transparent outline-none text-base tracking-wider"
                  aria-describedby="signup-phone-help"
                  maxLength={10}
                />
              </div>
              <p
                id="signup-phone-help"
                className="mt-1.5 text-xs text-[var(--color-ink-subtle)]"
              >
                We&apos;ll text you a one-time code. Standard SMS rates apply.
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
                  Sending code…
                </>
              ) : (
                <>
                  Send OTP
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
                6-digit code
              </label>
              <div className="flex items-center gap-2 rounded-xl border border-[var(--color-border-strong)] bg-[var(--color-bg)] px-4 h-14 transition-colors focus-within:border-[var(--color-brand-500)] focus-within:ring-2 focus-within:ring-[var(--color-brand-100)]">
                <KeyRound size={18} className="text-[var(--color-ink-subtle)]" aria-hidden="true" />
                <input
                  ref={otpInputRef}
                  id="signup-otp"
                  type="text"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  placeholder="123456"
                  value={otp}
                  onChange={(e) => handleOtpChange(e.target.value)}
                  className="flex-1 bg-transparent outline-none text-2xl font-bold tracking-[0.5em] text-center"
                  aria-describedby="signup-otp-help"
                  maxLength={6}
                />
              </div>
              <p
                id="signup-otp-help"
                className="mt-1.5 text-xs text-[var(--color-ink-subtle)]"
              >
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
                  Verify &amp; create account
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

        {step === "welcome" && (
          <div className="text-center py-3 space-y-5">
            <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50">
              <PartyPopper
                size={32}
                className="text-[var(--color-success)]"
                aria-hidden="true"
              />
            </div>
            <div className="space-y-1.5">
              <p className="text-base font-semibold text-[var(--color-ink)]">
                You&apos;re all set!
              </p>
              <p className="text-sm text-[var(--color-ink-muted)]">
                Browse verified listings. When you find one you love, unlock the
                owner&apos;s number for{" "}
                <span className="font-semibold text-[var(--color-ink)]">
                  {formatPrice(PRICING.user.week.price)}/week
                </span>{" "}
                or{" "}
                <span className="font-semibold text-[var(--color-ink)]">
                  {formatPrice(PRICING.user.singleUnlock.price)} for a single contact
                </span>
                .
              </p>
            </div>

            <Button
              type="button"
              variant="cta"
              size="lg"
              fullWidth
              onClick={handleContinue}
            >
              Continue to home
              <ArrowRight size={18} />
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
