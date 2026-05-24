"use client";

import * as React from "react";
import Link from "next/link";
import {
  Mail,
  Building2,
  MapPin,
  ArrowRight,
  CheckCircle2,
  Loader2,
  MailCheck,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { createClient } from "@/lib/supabase/client";
import { CITY_NAMES, KERALA_CITIES, FULL_SERVICE_CITIES } from "@/lib/site";
import { cn } from "@/lib/utils";

/**
 * Owner signup is a 2-step magic-link flow:
 *   1. Property details (business_name + city + email) — we collect these
 *      and pass them via signInWithOtp's options.data so they survive the
 *      device-switch round-trip (user clicks the email on phone, lands back
 *      with a fresh session).
 *   2. Check-email confirmation — the user must click the link in their email.
 *
 * After magic-link verification, the user lands on /owner/dashboard, where
 * a server action (ensureOwnerRecord) reads raw_user_meta_data and inserts
 * the public.owners row + bumps the profile role to 'owner'. The user is
 * prompted to pick a plan there (Phase 1B placeholder — full Razorpay billing
 * comes in Phase 2).
 */

type Step = "details" | "check_email";

const STEPS: { key: Step; label: string }[] = [
  { key: "details", label: "Property Details" },
  { key: "check_email", label: "Check Inbox" },
];

const ALL_CITIES = Array.from(new Set([...KERALA_CITIES, ...FULL_SERVICE_CITIES]));

function StepIndicator({ current }: { current: Step }) {
  const currentIdx = STEPS.findIndex((s) => s.key === current);

  return (
    <ol
      className="flex items-center justify-center gap-2 sm:gap-3 flex-wrap"
      aria-label="Owner signup progress"
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

export function OwnerSignupForm() {
  const [step, setStep] = React.useState<Step>("details");
  const [businessName, setBusinessName] = React.useState("");
  const [city, setCity] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [sending, setSending] = React.useState(false);
  const [resending, setResending] = React.useState(false);
  const [resendOk, setResendOk] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const businessValid = businessName.trim().length >= 2;
  const cityValid = city.length > 0;
  const emailValid = isValidEmail(email);

  async function sendMagicLink() {
    const supabase = createClient();
    // Pass business_name + city through user metadata. The /owner/dashboard
    // server component will read these via ensureOwnerRecord() on first visit
    // and insert the public.owners row.
    const { error: authError } = await supabase.auth.signInWithOtp({
      email: email.trim().toLowerCase(),
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent("/owner/dashboard?onboarding=1")}`,
        data: {
          name: businessName.trim(),
          business_name: businessName.trim(),
          city,
          intent: "owner",
        },
      },
    });
    return authError;
  }

  async function handleSendLink(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!businessValid) {
      setError("Please enter your property or business name.");
      return;
    }
    if (!cityValid) {
      setError("Please select the city of your property.");
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

  /* ---------------------------- */
  /* Render                       */
  /* ---------------------------- */

  return (
    <div className="w-full">
      <StepIndicator current={step} />

      <div className="mt-7 text-center">
        {step === "details" && (
          <>
            <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-[var(--color-ink)]">
              List your property
            </h1>
            <p className="mt-2 text-[var(--color-ink-muted)]">
              Reach 10,000+ verified renters. Honest pricing. Zero commission.
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
                htmlFor="owner-business"
                className="block text-sm font-semibold mb-1.5 text-[var(--color-ink)]"
              >
                Property / business name
              </label>
              <div className="flex items-center gap-2 rounded-xl border border-[var(--color-border-strong)] bg-[var(--color-bg)] px-4 h-12 transition-colors focus-within:border-[var(--color-brand-500)] focus-within:ring-2 focus-within:ring-[var(--color-brand-100)]">
                <Building2
                  size={16}
                  className="text-[var(--color-ink-subtle)]"
                  aria-hidden="true"
                />
                <input
                  id="owner-business"
                  type="text"
                  autoComplete="organization"
                  placeholder="Sunshine PG / Lakshmi Hostel"
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                  className="flex-1 bg-transparent outline-none text-base"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="owner-city"
                className="block text-sm font-semibold mb-1.5 text-[var(--color-ink)]"
              >
                City of property
              </label>
              <div className="flex items-center gap-2 rounded-xl border border-[var(--color-border-strong)] bg-[var(--color-bg)] px-4 h-12 transition-colors focus-within:border-[var(--color-brand-500)] focus-within:ring-2 focus-within:ring-[var(--color-brand-100)]">
                <MapPin
                  size={16}
                  className="text-[var(--color-ink-subtle)]"
                  aria-hidden="true"
                />
                <select
                  id="owner-city"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="flex-1 bg-transparent outline-none text-base appearance-none"
                >
                  <option value="">Select a city</option>
                  {ALL_CITIES.map((c) => (
                    <option key={c} value={c}>
                      {CITY_NAMES[c] ?? c}
                      {(FULL_SERVICE_CITIES as readonly string[]).includes(c) ? " — full-service" : ""}
                    </option>
                  ))}
                </select>
              </div>
              <p className="mt-1.5 text-xs text-[var(--color-ink-subtle)]">
                Full-service cities (Kochi, Bangalore, Chennai) include in-person KYC and professional photoshoot.
              </p>
            </div>

            <div>
              <label
                htmlFor="owner-email"
                className="block text-sm font-semibold mb-1.5 text-[var(--color-ink)]"
              >
                Your email
              </label>
              <div className="flex items-center gap-2 rounded-xl border border-[var(--color-border-strong)] bg-[var(--color-bg)] px-4 h-12 transition-colors focus-within:border-[var(--color-brand-500)] focus-within:ring-2 focus-within:ring-[var(--color-brand-100)]">
                <Mail
                  size={16}
                  className="text-[var(--color-ink-subtle)]"
                  aria-hidden="true"
                />
                <input
                  id="owner-email"
                  type="email"
                  inputMode="email"
                  autoComplete="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="flex-1 bg-transparent outline-none text-base"
                  aria-describedby="owner-email-help"
                />
              </div>
              <p
                id="owner-email-help"
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
              disabled={sending || !businessValid || !cityValid || !emailValid}
            >
              {sending ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  Sending link…
                </>
              ) : (
                <>
                  Send magic link &amp; continue
                  <ArrowRight size={18} />
                </>
              )}
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
                Click the link in your email — then you&apos;ll choose your plan.
              </p>
              <p className="text-sm text-[var(--color-ink-muted)]">
                The link expires in 10 minutes. Check your spam folder if you
                don&apos;t see it within a minute. After clicking, you&apos;ll
                land on your owner dashboard where you can pick Full-Service
                or Self-Serve.
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
        Already listed?{" "}
        <Link
          href="/owner/login"
          className="font-semibold text-[var(--color-brand-700)] hover:underline"
        >
          Owner login
        </Link>
      </p>

      <div className="mt-3 text-center">
        <Link
          href="/signup"
          className="text-xs text-[var(--color-ink-muted)] hover:text-[var(--color-brand-700)] hover:underline inline-flex items-center gap-1"
        >
          Are you a renter? Sign up here
          <ArrowRight size={12} />
        </Link>
      </div>
    </div>
  );
}
