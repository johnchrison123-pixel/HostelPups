"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Phone,
  User,
  Mail,
  MapPin,
  Lock,
  Building2,
  ArrowRight,
  Loader2,
  Eye,
  EyeOff,
  MailCheck,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { createClient } from "@/lib/supabase/client";
import { createAccount } from "@/lib/auth-actions";
import { CITY_NAMES, FULL_SERVICE_CITIES, LAUNCHED_CITIES } from "@/lib/site";
import { cn, safeNext } from "@/lib/utils";

/**
 * Owner signup — single-step password auth.
 *
 * Captures business_name + contact_name + email + phone + city +
 * password + T&C. On submit, supabase.auth.signUp() with intent="owner"
 * and business_name in user_metadata. If a session is returned (email
 * confirm OFF), we redirect to /owner/onboarding — that page calls
 * ensureOwnerRecord() to insert the public.owners row and bump role.
 */

const NAME_REGEX = /^[\p{L}\s.'-]{2,60}$/u;
const BUSINESS_REGEX = /^[\p{L}\p{N}\s.,'&()/-]{2,80}$/u;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_REGEX = /^[6-9]\d{9}$/;
const PASSWORD_MIN = 6;

// Show every supported city so owners outside Kochi / Bangalore / Chennai
// Show launched cities only — avoids showing dead cities (Hyderabad, Pune, etc.)
// that have no landing pages. FULL_SERVICE_SET toggles the "we'll do KYC +
// photoshoot" helper copy when one of the three launch cities is picked.
const ALL_CITIES = [...LAUNCHED_CITIES];
const FULL_SERVICE_SET = new Set<string>(FULL_SERVICE_CITIES as readonly string[]);

function normalisePhoneInput(raw: string) {
  return raw.replace(/[^0-9]/g, "").slice(0, 10);
}

function friendlyError(err: { message?: string } | null | undefined): string {
  const m = err?.message?.toLowerCase() ?? "";
  if (m.includes("already registered") || m.includes("already exists") || m.includes("user already")) {
    return "An account with this email already exists. Try logging in.";
  }
  if (m.includes("password should be at least") || m.includes("password is too short")) {
    return `Password must be at least ${PASSWORD_MIN} characters.`;
  }
  if (m.includes("rate limit")) {
    return "Too many attempts. Wait a minute and try again.";
  }
  if (m.includes("invalid email")) {
    return "That email doesn't look valid.";
  }
  return err?.message || "Something went wrong. Please try again.";
}

function passwordStrength(pw: string): { label: string; tone: "weak" | "ok" | "strong" } {
  if (pw.length < PASSWORD_MIN) return { label: "Too short", tone: "weak" };
  const variety =
    (/[a-z]/.test(pw) ? 1 : 0) +
    (/[A-Z]/.test(pw) ? 1 : 0) +
    (/\d/.test(pw) ? 1 : 0) +
    (/[^A-Za-z0-9]/.test(pw) ? 1 : 0);
  if (pw.length >= 10 && variety >= 3) return { label: "Strong", tone: "strong" };
  if (pw.length >= 8 && variety >= 2) return { label: "Good", tone: "ok" };
  return { label: "Weak", tone: "weak" };
}

export function OwnerSignupForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextPath = safeNext(searchParams.get("next"));

  const [businessName, setBusinessName] = React.useState("");
  const [contactName, setContactName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [phone, setPhone] = React.useState("");
  const [city, setCity] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [showPw, setShowPw] = React.useState(false);
  const [terms, setTerms] = React.useState(false);

  const [submitting, setSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [pendingEmail, setPendingEmail] = React.useState<string | null>(null);

  const businessInputRef = React.useRef<HTMLInputElement>(null);

  const [touched, setTouched] = React.useState({
    business: false,
    contact: false,
    email: false,
    phone: false,
    city: false,
    password: false,
  });

  React.useEffect(() => {
    businessInputRef.current?.focus();
  }, []);

  const trimmedBusiness = businessName.trim();
  const trimmedContact = contactName.trim();
  const trimmedEmail = email.trim().toLowerCase();

  const businessValid = BUSINESS_REGEX.test(trimmedBusiness);
  // Contact name is optional. Only validate format if non-empty.
  const contactValid = trimmedContact.length === 0 || NAME_REGEX.test(trimmedContact);
  const emailValid = EMAIL_REGEX.test(trimmedEmail);
  const phoneValid = PHONE_REGEX.test(phone);
  const cityValid = city.length > 0;
  const passwordValid = password.length >= PASSWORD_MIN;
  const allValid =
    businessValid && contactValid && emailValid && phoneValid && cityValid && passwordValid && terms;

  const strength = passwordStrength(password);
  const isFullServiceCity = cityValid && FULL_SERVICE_SET.has(city);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setTouched({
      business: true,
      contact: true,
      email: true,
      phone: true,
      city: true,
      password: true,
    });

    if (!allValid) {
      if (!businessValid) setError("Please enter your business / property name.");
      else if (!contactValid) setError("Contact name should be 2-60 letters.");
      else if (!emailValid) setError("Please enter a valid email address.");
      else if (!phoneValid)
        setError("Enter a 10-digit Indian mobile number starting with 6, 7, 8, or 9.");
      else if (!cityValid) setError("Please select the city of your property.");
      else if (!passwordValid) setError(`Password must be at least ${PASSWORD_MIN} characters.`);
      else if (!terms) setError("Please agree to the Terms of Service and Privacy Policy.");
      return;
    }

    setSubmitting(true);

    // Use server-side admin createAccount — bypasses email validation +
    // disposable-email blocks + "Confirm email" requirement.
    const createResult = await createAccount({
      email: trimmedEmail,
      password,
      name: trimmedContact || trimmedBusiness,
      phone,
      city,
      intent: "owner",
      business_name: trimmedBusiness,
    });

    if (!createResult.ok) {
      setSubmitting(false);
      setError(createResult.error);
      return;
    }

    // Account auto-confirmed. Now sign in to set browser session cookie.
    const supabase = createClient();
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: trimmedEmail,
      password,
    });
    setSubmitting(false);

    if (signInError) {
      setError(friendlyError(signInError));
      return;
    }

    // Owners always need to complete onboarding before doing anything else,
    // so we always route them through /owner/onboarding first. After
    // onboarding finishes, the OwnerOnboardingFlow will honor a pending
    // `?next=` via its own redirect (or fall back to the dashboard).
    const dest = nextPath
      ? `/owner/onboarding?next=${encodeURIComponent(nextPath)}`
      : "/owner/onboarding";
    router.replace(dest);
    router.refresh();
  }

  if (pendingEmail) {
    return (
      <div className="w-full">
        <div className="text-center">
          <div className="mx-auto inline-flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50">
            <MailCheck size={32} className="text-[var(--color-success)]" aria-hidden="true" />
          </div>
          <h1 className="mt-5 text-3xl sm:text-4xl font-black tracking-tight text-[var(--color-ink)]">
            Check your inbox
          </h1>
          <p className="mt-3 text-[var(--color-ink-muted)]">
            We sent a confirmation link to{" "}
            <span className="font-semibold text-[var(--color-ink)]">{pendingEmail}</span>.
            Click the link to activate your owner account, then return to log in.
          </p>
        </div>

        <div className="mt-7 rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-elevated)] p-6 sm:p-8 shadow-[var(--shadow-md)] text-center space-y-4">
          <p className="text-sm text-[var(--color-ink-muted)]">
            Didn&apos;t get the email? Check your spam folder, or contact{" "}
            <a
              href="mailto:owners@hostelpups.com"
              className="font-semibold text-[var(--color-brand-700)] hover:underline"
            >
              owners@hostelpups.com
            </a>
            .
          </p>
          <Button type="button" variant="outline" size="lg" fullWidth href="/owner/login">
            Go to owner login
            <ArrowRight size={18} />
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="text-center">
        <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-[var(--color-ink)]">
          List your property
        </h1>
        <p className="mt-2 text-[var(--color-ink-muted)]">
          Be among our first listed owners. Honest pricing. Zero commission.
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
          {/* Business / property name */}
          <div>
            <label
              htmlFor="owner-business"
              className="block text-sm font-semibold mb-1.5 text-[var(--color-ink)]"
            >
              Business / property name
            </label>
            <div className="flex items-center gap-2 rounded-xl border border-[var(--color-border-strong)] bg-[var(--color-bg)] px-4 h-12 transition-colors focus-within:border-[var(--color-brand-500)] focus-within:ring-2 focus-within:ring-[var(--color-brand-100)]">
              <Building2 size={16} className="text-[var(--color-ink-subtle)]" aria-hidden="true" />
              <input
                ref={businessInputRef}
                id="owner-business"
                type="text"
                autoComplete="organization"
                placeholder="Sunshine PG"
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                onBlur={() => setTouched((t) => ({ ...t, business: true }))}
                className="flex-1 bg-transparent outline-none text-base min-w-0"
                aria-invalid={touched.business && !businessValid}
              />
            </div>
            {touched.business && !businessValid && (
              <p className="mt-1.5 text-xs text-red-600">
                Please enter your business or property name (2-80 chars).
              </p>
            )}
          </div>

          {/* Contact person name (optional) */}
          <div>
            <label
              htmlFor="owner-contact"
              className="block text-sm font-semibold mb-1.5 text-[var(--color-ink)]"
            >
              Contact person name{" "}
              <span className="font-normal text-[var(--color-ink-subtle)]">(optional)</span>
            </label>
            <div className="flex items-center gap-2 rounded-xl border border-[var(--color-border-strong)] bg-[var(--color-bg)] px-4 h-12 transition-colors focus-within:border-[var(--color-brand-500)] focus-within:ring-2 focus-within:ring-[var(--color-brand-100)]">
              <User size={16} className="text-[var(--color-ink-subtle)]" aria-hidden="true" />
              <input
                id="owner-contact"
                type="text"
                autoComplete="name"
                placeholder="Owner / manager name"
                value={contactName}
                onChange={(e) => setContactName(e.target.value)}
                onBlur={() => setTouched((t) => ({ ...t, contact: true }))}
                className="flex-1 bg-transparent outline-none text-base min-w-0"
                aria-invalid={touched.contact && !contactValid}
              />
            </div>
            {touched.contact && !contactValid && (
              <p className="mt-1.5 text-xs text-red-600">
                Contact name should be 2-60 letters.
              </p>
            )}
          </div>

          {/* Email */}
          <div>
            <label
              htmlFor="owner-email"
              className="block text-sm font-semibold mb-1.5 text-[var(--color-ink)]"
            >
              Email
            </label>
            <div className="flex items-center gap-2 rounded-xl border border-[var(--color-border-strong)] bg-[var(--color-bg)] px-4 h-12 transition-colors focus-within:border-[var(--color-brand-500)] focus-within:ring-2 focus-within:ring-[var(--color-brand-100)]">
              <Mail size={16} className="text-[var(--color-ink-subtle)]" aria-hidden="true" />
              <input
                id="owner-email"
                type="email"
                autoComplete="email"
                placeholder="owner@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onBlur={() => setTouched((t) => ({ ...t, email: true }))}
                className="flex-1 bg-transparent outline-none text-base min-w-0"
                aria-invalid={touched.email && !emailValid}
              />
            </div>
            {touched.email && !emailValid && (
              <p className="mt-1.5 text-xs text-red-600">Please enter a valid email address.</p>
            )}
          </div>

          {/* Phone */}
          <div>
            <label
              htmlFor="owner-phone"
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
                id="owner-phone"
                type="tel"
                inputMode="numeric"
                autoComplete="tel-national"
                placeholder="98765 43210"
                value={phone}
                onChange={(e) => setPhone(normalisePhoneInput(e.target.value))}
                onBlur={() => setTouched((t) => ({ ...t, phone: true }))}
                className="flex-1 bg-transparent outline-none text-base tracking-wider min-w-0"
                aria-invalid={touched.phone && !phoneValid}
                maxLength={10}
              />
            </div>
            {touched.phone && !phoneValid && (
              <p className="mt-1.5 text-xs text-red-600">
                Enter a 10-digit Indian mobile starting with 6, 7, 8, or 9.
              </p>
            )}
          </div>

          {/* City */}
          <div>
            <label
              htmlFor="owner-city"
              className="block text-sm font-semibold mb-1.5 text-[var(--color-ink)]"
            >
              City of property
            </label>
            <div className="flex items-center gap-2 rounded-xl border border-[var(--color-border-strong)] bg-[var(--color-bg)] px-4 h-12 transition-colors focus-within:border-[var(--color-brand-500)] focus-within:ring-2 focus-within:ring-[var(--color-brand-100)]">
              <MapPin size={16} className="text-[var(--color-ink-subtle)]" aria-hidden="true" />
              <select
                id="owner-city"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                onBlur={() => setTouched((t) => ({ ...t, city: true }))}
                className="flex-1 bg-transparent outline-none text-base appearance-none min-w-0"
                aria-invalid={touched.city && !cityValid}
              >
                <option value="">Select a city</option>
                {ALL_CITIES.map((c) => (
                  <option key={c} value={c}>
                    {CITY_NAMES[c] ?? c}
                    {FULL_SERVICE_SET.has(c) ? " — full-service" : ""}
                  </option>
                ))}
              </select>
            </div>
            <p className="mt-1.5 text-xs text-[var(--color-ink-subtle)]">
              {isFullServiceCity
                ? "Full-service tier available here — we handle KYC + photoshoot."
                : "Self-serve tier — upload your own photos, up to 3 active listings."}
            </p>
            {touched.city && !cityValid && (
              <p className="mt-1 text-xs text-red-600">Please select the city of your property.</p>
            )}
          </div>

          {/* Password */}
          <div>
            <label
              htmlFor="owner-password"
              className="block text-sm font-semibold mb-1.5 text-[var(--color-ink)]"
            >
              Password
            </label>
            <div className="flex items-center gap-2 rounded-xl border border-[var(--color-border-strong)] bg-[var(--color-bg)] px-4 h-12 transition-colors focus-within:border-[var(--color-brand-500)] focus-within:ring-2 focus-within:ring-[var(--color-brand-100)]">
              <Lock size={16} className="text-[var(--color-ink-subtle)]" aria-hidden="true" />
              <input
                id="owner-password"
                type={showPw ? "text" : "password"}
                autoComplete="new-password"
                placeholder="At least 6 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onBlur={() => setTouched((t) => ({ ...t, password: true }))}
                className="flex-1 bg-transparent outline-none text-base min-w-0"
                aria-invalid={touched.password && !passwordValid}
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
            <div className="mt-1.5 flex items-center justify-between text-xs">
              <span className="text-[var(--color-ink-subtle)]">
                Minimum {PASSWORD_MIN} characters.
              </span>
              {password.length > 0 && (
                <span
                  className={cn(
                    "font-semibold",
                    strength.tone === "weak" && "text-red-600",
                    strength.tone === "ok" && "text-amber-600",
                    strength.tone === "strong" && "text-emerald-600",
                  )}
                >
                  {strength.label}
                </span>
              )}
            </div>
          </div>

          {/* Terms */}
          <div className="pt-1">
            <label
              htmlFor="owner-terms"
              className="flex items-start gap-2.5 cursor-pointer select-none"
            >
              <input
                id="owner-terms"
                type="checkbox"
                checked={terms}
                onChange={(e) => setTerms(e.target.checked)}
                className="mt-0.5 h-5 w-5 rounded border-[var(--color-border-strong)] accent-[var(--color-brand-500)] cursor-pointer"
              />
              <span className="text-sm text-[var(--color-ink-muted)] leading-snug">
                I agree to the{" "}
                <Link
                  href="/terms"
                  className="font-semibold text-[var(--color-brand-700)] hover:underline"
                >
                  Terms of Service
                </Link>{" "}
                and{" "}
                <Link
                  href="/privacy"
                  className="font-semibold text-[var(--color-brand-700)] hover:underline"
                >
                  Privacy Policy
                </Link>
                .
              </span>
            </label>
          </div>

          <Button
            type="submit"
            variant="cta"
            size="lg"
            fullWidth
            disabled={submitting || !allValid}
          >
            {submitting ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                Creating account…
              </>
            ) : (
              <>
                Create owner account
                <ArrowRight size={18} />
              </>
            )}
          </Button>
        </form>
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
