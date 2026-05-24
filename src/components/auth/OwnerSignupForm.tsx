"use client";

import * as React from "react";
import Link from "next/link";
import {
  Phone,
  Building2,
  MapPin,
  ArrowRight,
  CheckCircle2,
  Loader2,
  KeyRound,
  Camera,
  Sparkles,
  ShieldCheck,
  TrendingUp,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { PRICING, CITY_NAMES, KERALA_CITIES, FULL_SERVICE_CITIES } from "@/lib/site";
import { formatPrice, cn } from "@/lib/utils";

type Step = "details" | "verify" | "plan";
type PlanId = "full_service" | "self_serve";

const STEPS: { key: Step; label: string }[] = [
  { key: "details", label: "Property Details" },
  { key: "verify", label: "Verify OTP" },
  { key: "plan", label: "Choose Plan" },
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

export function OwnerSignupForm() {
  const [step, setStep] = React.useState<Step>("details");
  const [businessName, setBusinessName] = React.useState("");
  const [city, setCity] = React.useState("");
  const [phone, setPhone] = React.useState("");
  const [otp, setOtp] = React.useState("");
  const [selectedPlan, setSelectedPlan] = React.useState<PlanId | null>(null);
  const [sending, setSending] = React.useState(false);
  const [verifying, setVerifying] = React.useState(false);
  const [submitting, setSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [success, setSuccess] = React.useState(false);

  const businessValid = businessName.trim().length >= 2;
  const cityValid = city.length > 0;
  const phoneValid = /^[6-9]\d{9}$/.test(phone);
  const otpValid = /^\d{6}$/.test(otp);

  const isFullServiceCity = (FULL_SERVICE_CITIES as readonly string[]).includes(city);

  function handleSendOtp(e: React.FormEvent) {
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
    if (!phoneValid) {
      setError("Enter a 10-digit Indian mobile number starting with 6-9.");
      return;
    }
    setSending(true);
    // PENDING: wire to Supabase phone OTP
    window.setTimeout(() => {
      setSending(false);
      setStep("verify");
      // Sensible default based on city tier
      setSelectedPlan(isFullServiceCity ? "full_service" : "self_serve");
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
    // PENDING: Supabase verifyOtp + INSERT into owners table
    window.setTimeout(() => {
      setVerifying(false);
      setStep("plan");
    }, 700);
  }

  function handleSubmitPlan(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!selectedPlan) {
      setError("Pick a plan to continue.");
      return;
    }
    setSubmitting(true);
    // PENDING: Razorpay V2 — for now mark owner as registered without billing
    window.setTimeout(() => {
      setSubmitting(false);
      setSuccess(true);
    }, 700);
  }

  function handleResend() {
    setError(null);
    setOtp("");
    // PENDING: re-trigger Supabase OTP resend
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
        {step === "plan" && !success && (
          <>
            <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-[var(--color-ink)]">
              Pick the right tier
            </h1>
            <p className="mt-2 text-[var(--color-ink-muted)]">
              You can switch tiers later. Billing kicks in only when you publish your first listing.
            </p>
          </>
        )}
        {success && (
          <>
            <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-[var(--color-ink)]">
              You&apos;re on the list, owner
            </h1>
            <p className="mt-2 text-[var(--color-ink-muted)]">
              Our team will reach out within 24 hours to start onboarding{" "}
              <span className="font-semibold text-[var(--color-ink)]">{businessName}</span>.
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
                htmlFor="owner-phone"
                className="block text-sm font-semibold mb-1.5 text-[var(--color-ink)]"
              >
                Your phone number
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
                  id="owner-phone"
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
                />
              </div>
            </div>

            <Button
              type="submit"
              variant="cta"
              size="lg"
              fullWidth
              disabled={sending || !businessValid || !cityValid || !phoneValid}
            >
              {sending ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  Sending OTP…
                </>
              ) : (
                <>
                  Send OTP &amp; Continue
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

        {step === "verify" && (
          <form onSubmit={handleVerifyOtp} className="space-y-5" noValidate>
            <div>
              <label
                htmlFor="owner-otp"
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
                  id="owner-otp"
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
                  Verify &amp; choose plan
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

        {step === "plan" && !success && (
          <form onSubmit={handleSubmitPlan} className="space-y-5" noValidate>
            <fieldset className="space-y-3">
              <legend className="sr-only">Pick a tier</legend>

              {/* Full-service plan */}
              <label
                className={cn(
                  "block rounded-2xl border-2 p-5 cursor-pointer transition-all",
                  selectedPlan === "full_service"
                    ? "border-[var(--color-brand-500)] bg-[var(--color-brand-50)] shadow-[var(--shadow-md)]"
                    : "border-[var(--color-border)] bg-[var(--color-bg-elevated)] hover:border-[var(--color-brand-300)]",
                )}
              >
                <div className="flex items-start gap-3">
                  <input
                    type="radio"
                    name="plan"
                    value="full_service"
                    checked={selectedPlan === "full_service"}
                    onChange={() => setSelectedPlan("full_service")}
                    className="mt-1 h-4 w-4 accent-[var(--color-brand-500)]"
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className="font-bold text-lg">Full-Service</span>
                      {isFullServiceCity ? (
                        <Badge tone="verified">Available in {CITY_NAMES[city]}</Badge>
                      ) : (
                        <Badge tone="warning">Kochi / Bangalore / Chennai only</Badge>
                      )}
                    </div>
                    <p className="text-sm text-[var(--color-ink-muted)] mb-3">
                      We come on-site, do KYC, run a professional photoshoot, and write your listing copy.
                      Unlimited active listings.
                    </p>
                    <ul className="space-y-1.5 text-sm">
                      <li className="flex items-center gap-2">
                        <Camera size={14} className="text-[var(--color-brand-600)] shrink-0" aria-hidden="true" />
                        Professional photoshoot (photos owned by us)
                      </li>
                      <li className="flex items-center gap-2">
                        <ShieldCheck size={14} className="text-emerald-600 shrink-0" aria-hidden="true" />
                        In-person KYC + verification badge
                      </li>
                      <li className="flex items-center gap-2">
                        <Sparkles size={14} className="text-[var(--color-brand-600)] shrink-0" aria-hidden="true" />
                        Unlimited listings
                      </li>
                    </ul>
                    <p className="mt-3 text-sm">
                      <span className="text-2xl font-black">
                        {formatPrice(PRICING.owner.fullService.firstYear)}
                      </span>
                      <span className="text-[var(--color-ink-muted)]">
                        {" "}first year, then {formatPrice(PRICING.owner.fullService.renewal)}/year
                      </span>
                    </p>
                  </div>
                </div>
              </label>

              {/* Self-serve plan */}
              <label
                className={cn(
                  "block rounded-2xl border-2 p-5 cursor-pointer transition-all",
                  selectedPlan === "self_serve"
                    ? "border-[var(--color-brand-500)] bg-[var(--color-brand-50)] shadow-[var(--shadow-md)]"
                    : "border-[var(--color-border)] bg-[var(--color-bg-elevated)] hover:border-[var(--color-brand-300)]",
                )}
              >
                <div className="flex items-start gap-3">
                  <input
                    type="radio"
                    name="plan"
                    value="self_serve"
                    checked={selectedPlan === "self_serve"}
                    onChange={() => setSelectedPlan("self_serve")}
                    className="mt-1 h-4 w-4 accent-[var(--color-brand-500)]"
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className="font-bold text-lg">Self-Serve</span>
                      <Badge tone="brand">Available everywhere</Badge>
                    </div>
                    <p className="text-sm text-[var(--color-ink-muted)] mb-3">
                      Upload your own photos, write your listing, get verified via video KYC.
                      Up to {PRICING.owner.selfServe.maxActiveListings} active listings.
                    </p>
                    <ul className="space-y-1.5 text-sm">
                      <li className="flex items-center gap-2">
                        <TrendingUp size={14} className="text-[var(--color-brand-600)] shrink-0" aria-hidden="true" />
                        Listed in 24 hours after upload
                      </li>
                      <li className="flex items-center gap-2">
                        <ShieldCheck size={14} className="text-emerald-600 shrink-0" aria-hidden="true" />
                        Optional verification badge (+Rs 799/year)
                      </li>
                      <li className="flex items-center gap-2">
                        <Sparkles size={14} className="text-[var(--color-brand-600)] shrink-0" aria-hidden="true" />
                        Max {PRICING.owner.selfServe.maxActiveListings} active listings
                      </li>
                    </ul>
                    <p className="mt-3 text-sm">
                      <span className="text-2xl font-black">
                        {formatPrice(PRICING.owner.selfServe.yearly)}
                      </span>
                      <span className="text-[var(--color-ink-muted)]"> / year</span>
                    </p>
                  </div>
                </div>
              </label>
            </fieldset>

            <Button
              type="submit"
              variant="cta"
              size="lg"
              fullWidth
              disabled={submitting || !selectedPlan}
            >
              {submitting ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  Saving…
                </>
              ) : (
                <>
                  Continue — billing on first listing
                  <ArrowRight size={18} />
                </>
              )}
            </Button>

            <p className="text-center text-xs text-[var(--color-ink-subtle)] pt-1">
              No payment now. Razorpay billing activates only when you publish your first listing.
            </p>
          </form>
        )}

        {success && (
          <div className="text-center py-6 space-y-5">
            <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50">
              <CheckCircle2
                size={32}
                className="text-[var(--color-success)]"
                aria-hidden="true"
              />
            </div>
            <p className="text-[var(--color-ink-muted)]">
              Selected plan:{" "}
              <span className="font-semibold text-[var(--color-ink)]">
                {selectedPlan === "full_service" ? "Full-Service" : "Self-Serve"}
              </span>
            </p>
            <div className="space-y-2">
              <Button href="/for-owners" variant="cta" fullWidth>
                Read the owner playbook
                <ArrowRight size={16} />
              </Button>
              <Button href="/" variant="outline" fullWidth>
                Back to home
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
