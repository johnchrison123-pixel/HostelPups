"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ArrowRight,
  Camera,
  CheckCircle2,
  Loader2,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  Building2,
  MapPin,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import {
  PRICING,
  CITY_NAMES,
  FULL_SERVICE_CITIES,
} from "@/lib/site";
import { cn, formatPrice } from "@/lib/utils";
import { ensureOwnerRecord, setOwnerTier } from "@/lib/owner-actions";
import type { OwnerTier } from "@/lib/types";

// Show every supported city so owners outside Kochi / Bangalore / Chennai
// (e.g. Mumbai, Delhi, Hyderabad) can complete onboarding too — they default
// to the self-serve tier. The full-service helper copy appears when one of
// the three launch cities is picked.
const ALL_CITIES = Object.keys(CITY_NAMES);

/**
 * Validate the `?next=` redirect param so we don't open up the onboarding
 * flow to arbitrary open-redirects.
 */
function safeNext(raw: string | null): string | null {
  if (!raw) return null;
  if (!raw.startsWith("/")) return null;
  if (raw.startsWith("//")) return null;
  if (raw.startsWith("/\\")) return null;
  return raw;
}

/**
 * Two-step owner onboarding flow shown after magic-link auth:
 *   step 1 — confirm/enter business name + city (skip if metadata supplied them)
 *   step 2 — pick tier (full_service / self_serve), then save & redirect
 *
 * The server actions `ensureOwnerRecord` + `setOwnerTier` are called from
 * here directly — RLS scopes everything to auth.uid().
 */
export function OwnerOnboardingFlow() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextPath = safeNext(searchParams.get("next"));
  const [step, setStep] = React.useState<"details" | "plan">("details");
  const [businessName, setBusinessName] = React.useState("");
  const [city, setCity] = React.useState("");
  const [tier, setTier] = React.useState<OwnerTier | null>(null);
  const [submitting, setSubmitting] = React.useState<"details" | "plan" | null>(
    null,
  );
  const [error, setError] = React.useState<string | null>(null);

  const businessValid = businessName.trim().length >= 2;
  const cityValid = city.length > 0;
  const isFullServiceCity = (FULL_SERVICE_CITIES as readonly string[]).includes(
    city,
  );

  // Pre-select sensible default tier when city changes (no effect needed —
  // we compute the default inline when transitioning to the plan step).
  function pickDefaultTierIfNeeded() {
    if (!tier) {
      setTier(isFullServiceCity ? "full_service" : "self_serve");
    }
  }

  async function handleEnsureRecord(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!businessValid) {
      setError("Please enter your property or business name.");
      return;
    }
    if (!cityValid) {
      setError("Pick the city of your property.");
      return;
    }
    setSubmitting("details");
    try {
      await ensureOwnerRecord(businessName.trim(), city);
      pickDefaultTierIfNeeded();
      setStep("plan");
    } catch (err) {
      setError((err as Error).message ?? "Could not save your details.");
    } finally {
      setSubmitting(null);
    }
  }

  async function handleConfirmTier(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!tier) {
      setError("Pick a tier to continue.");
      return;
    }
    setSubmitting("plan");
    try {
      await setOwnerTier(tier);
      // Honor ?next= if the user came in from a gated CTA, otherwise land
      // them on the dashboard so they can start adding listings.
      router.push(nextPath ?? "/owner/dashboard");
      router.refresh();
    } catch (err) {
      setError((err as Error).message ?? "Could not save your tier.");
      setSubmitting(null);
    }
  }

  return (
    <div className="w-full">
      <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-elevated)] p-6 sm:p-8 shadow-[var(--shadow-md)]">
        {error && (
          <div
            role="alert"
            className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 flex items-start gap-2"
          >
            <AlertCircle size={16} className="mt-0.5 shrink-0" aria-hidden="true" />
            <span>{error}</span>
          </div>
        )}

        {step === "details" && (
          <form onSubmit={handleEnsureRecord} className="space-y-5" noValidate>
            <div>
              <label
                htmlFor="ob-business"
                className="block text-sm font-semibold mb-1.5 text-[var(--color-ink)]"
              >
                Property / business name
              </label>
              <div className="flex items-center gap-2 rounded-xl border border-[var(--color-border-strong)] bg-[var(--color-bg)] px-4 h-12 focus-within:border-[var(--color-brand-500)] focus-within:ring-2 focus-within:ring-[var(--color-brand-100)]">
                <Building2
                  size={16}
                  className="text-[var(--color-ink-subtle)]"
                  aria-hidden="true"
                />
                <input
                  id="ob-business"
                  type="text"
                  autoComplete="organization"
                  placeholder="Sunshine PG / Lakshmi Hostel"
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                  className="flex-1 bg-transparent outline-none text-base"
                  autoFocus
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="ob-city"
                className="block text-sm font-semibold mb-1.5 text-[var(--color-ink)]"
              >
                City of property
              </label>
              <div className="flex items-center gap-2 rounded-xl border border-[var(--color-border-strong)] bg-[var(--color-bg)] px-4 h-12 focus-within:border-[var(--color-brand-500)] focus-within:ring-2 focus-within:ring-[var(--color-brand-100)]">
                <MapPin
                  size={16}
                  className="text-[var(--color-ink-subtle)]"
                  aria-hidden="true"
                />
                <select
                  id="ob-city"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="flex-1 bg-transparent outline-none text-base appearance-none"
                >
                  <option value="">Select a city</option>
                  {ALL_CITIES.map((c) => (
                    <option key={c} value={c}>
                      {CITY_NAMES[c] ?? c}
                      {(FULL_SERVICE_CITIES as readonly string[]).includes(c)
                        ? " — full-service"
                        : ""}
                    </option>
                  ))}
                </select>
              </div>
              <p className="mt-1.5 text-xs text-[var(--color-ink-subtle)]">
                Full-service cities (Kochi, Bangalore, Chennai) include in-person
                KYC and professional photoshoot.
              </p>
            </div>

            <Button
              type="submit"
              variant="cta"
              size="lg"
              fullWidth
              disabled={submitting !== null || !businessValid || !cityValid}
            >
              {submitting === "details" ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  Saving…
                </>
              ) : (
                <>
                  Continue
                  <ArrowRight size={18} />
                </>
              )}
            </Button>
          </form>
        )}

        {step === "plan" && (
          <form onSubmit={handleConfirmTier} className="space-y-5" noValidate>
            <p className="text-sm text-[var(--color-ink-muted)] text-center">
              Welcome,{" "}
              <span className="font-semibold text-[var(--color-ink)]">
                {businessName || "owner"}
              </span>
              . Pick a tier — you can switch later.
            </p>

            <fieldset className="space-y-3">
              <legend className="sr-only">Pick a tier</legend>

              {/* Full-service */}
              <label
                className={cn(
                  "block rounded-2xl border-2 p-5 cursor-pointer transition-all",
                  tier === "full_service"
                    ? "border-[var(--color-brand-500)] bg-[var(--color-brand-50)] shadow-[var(--shadow-md)]"
                    : "border-[var(--color-border)] bg-[var(--color-bg-elevated)] hover:border-[var(--color-brand-300)]",
                )}
              >
                <div className="flex items-start gap-3">
                  <input
                    type="radio"
                    name="tier"
                    value="full_service"
                    checked={tier === "full_service"}
                    onChange={() => setTier("full_service")}
                    className="mt-1 h-4 w-4 accent-[var(--color-brand-500)]"
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className="font-bold text-lg">Full-Service</span>
                      {isFullServiceCity ? (
                        <Badge tone="verified">
                          Available in {CITY_NAMES[city]}
                        </Badge>
                      ) : (
                        <Badge tone="warning">
                          Kochi / Bangalore / Chennai only
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-[var(--color-ink-muted)] mb-3">
                      We come on-site, do KYC, run a professional photoshoot, and
                      write your listing copy. Unlimited active listings.
                    </p>
                    <ul className="space-y-1.5 text-sm">
                      <li className="flex items-center gap-2">
                        <Camera
                          size={14}
                          className="text-[var(--color-brand-600)] shrink-0"
                          aria-hidden="true"
                        />
                        Professional photoshoot (photos owned by us)
                      </li>
                      <li className="flex items-center gap-2">
                        <ShieldCheck
                          size={14}
                          className="text-emerald-600 shrink-0"
                          aria-hidden="true"
                        />
                        In-person KYC + verification badge
                      </li>
                      <li className="flex items-center gap-2">
                        <Sparkles
                          size={14}
                          className="text-[var(--color-brand-600)] shrink-0"
                          aria-hidden="true"
                        />
                        Unlimited listings
                      </li>
                    </ul>
                    <p className="mt-3 text-sm">
                      <span className="text-2xl font-black">
                        {formatPrice(PRICING.owner.fullService.firstYear)}
                      </span>
                      <span className="text-[var(--color-ink-muted)]">
                        {" "}
                        first year, then{" "}
                        {formatPrice(PRICING.owner.fullService.renewal)}/year
                      </span>
                    </p>
                  </div>
                </div>
              </label>

              {/* Self-serve */}
              <label
                className={cn(
                  "block rounded-2xl border-2 p-5 cursor-pointer transition-all",
                  tier === "self_serve"
                    ? "border-[var(--color-brand-500)] bg-[var(--color-brand-50)] shadow-[var(--shadow-md)]"
                    : "border-[var(--color-border)] bg-[var(--color-bg-elevated)] hover:border-[var(--color-brand-300)]",
                )}
              >
                <div className="flex items-start gap-3">
                  <input
                    type="radio"
                    name="tier"
                    value="self_serve"
                    checked={tier === "self_serve"}
                    onChange={() => setTier("self_serve")}
                    className="mt-1 h-4 w-4 accent-[var(--color-brand-500)]"
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className="font-bold text-lg">Self-Serve</span>
                      <Badge tone="brand">Available everywhere</Badge>
                    </div>
                    <p className="text-sm text-[var(--color-ink-muted)] mb-3">
                      Upload your own photos, write your listing, get verified
                      via video KYC. Up to{" "}
                      {PRICING.owner.selfServe.maxActiveListings} active
                      listings.
                    </p>
                    <ul className="space-y-1.5 text-sm">
                      <li className="flex items-center gap-2">
                        <TrendingUp
                          size={14}
                          className="text-[var(--color-brand-600)] shrink-0"
                          aria-hidden="true"
                        />
                        Listed in 24 hours after upload
                      </li>
                      <li className="flex items-center gap-2">
                        <ShieldCheck
                          size={14}
                          className="text-emerald-600 shrink-0"
                          aria-hidden="true"
                        />
                        Optional verification badge (+
                        {formatPrice(PRICING.owner.verification.yearly)}/year)
                      </li>
                      <li className="flex items-center gap-2">
                        <Sparkles
                          size={14}
                          className="text-[var(--color-brand-600)] shrink-0"
                          aria-hidden="true"
                        />
                        Max {PRICING.owner.selfServe.maxActiveListings} active
                        listings
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
              disabled={submitting !== null || !tier}
            >
              {submitting === "plan" ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  Saving…
                </>
              ) : (
                <>
                  Finish setup
                  <CheckCircle2 size={18} />
                </>
              )}
            </Button>

            <p className="text-center text-xs text-[var(--color-ink-subtle)] pt-1">
              No payment now. Free trial until your first listing is published —
              billing activates at that point.
            </p>
          </form>
        )}
      </div>
    </div>
  );
}
