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
  ArrowRight,
  Loader2,
  Eye,
  EyeOff,
  MailCheck,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { createClient } from "@/lib/supabase/client";
import { createAccount } from "@/lib/auth-actions";
import { cn, safeNext } from "@/lib/utils";
import { CITY_NAMES, LAUNCHED_CITIES } from "@/lib/site";

/**
 * Renter signup — single-step password auth.
 *
 * Captures name + email + phone + city + password + T&C tick.
 * On submit: supabase.auth.signUp(). If email-confirm is OFF in the
 * Supabase dashboard, a session is returned immediately and we redirect
 * to "/". Otherwise we show a "check your email" pending state.
 *
 * The DB trigger `handle_new_user` reads raw_user_meta_data (name, phone,
 * intent) and writes a public.profiles row automatically — no client-side
 * insert is needed.
 */

// Allow letters (incl. accented), spaces, dots, apostrophes, hyphens.
const NAME_REGEX = /^[\p{L}\s.'-]{2,60}$/u;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_REGEX = /^[6-9]\d{9}$/;
const PASSWORD_MIN = 6;

const CITY_OPTIONS = LAUNCHED_CITIES.map((slug) => [slug, CITY_NAMES[slug]] as [string, string]);

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

export function SignupForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextPath = safeNext(searchParams.get("next"));

  const [name, setName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [phone, setPhone] = React.useState("");
  const [city, setCity] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [showPw, setShowPw] = React.useState(false);
  const [terms, setTerms] = React.useState(false);

  const [submitting, setSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [pendingEmail, setPendingEmail] = React.useState<string | null>(null);

  const nameInputRef = React.useRef<HTMLInputElement>(null);

  // Per-field touched flags so we don't spam errors before the user interacts.
  const [touched, setTouched] = React.useState({
    name: false,
    email: false,
    phone: false,
    city: false,
    password: false,
  });

  React.useEffect(() => {
    nameInputRef.current?.focus();
  }, []);

  const trimmedName = name.trim();
  const trimmedEmail = email.trim().toLowerCase();

  const nameValid = NAME_REGEX.test(trimmedName);
  const emailValid = EMAIL_REGEX.test(trimmedEmail);
  const phoneValid = PHONE_REGEX.test(phone);
  const cityValid = city.length > 0;
  const passwordValid = password.length >= PASSWORD_MIN;
  const allValid = nameValid && emailValid && phoneValid && cityValid && passwordValid && terms;

  const strength = passwordStrength(password);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    // Mark everything as touched so inline errors surface if submit is forced.
    setTouched({
      name: true,
      email: true,
      phone: true,
      city: true,
      password: true,
    });

    if (!allValid) {
      if (!nameValid) setError("Please enter your full name (2-60 letters).");
      else if (!emailValid) setError("Please enter a valid email address.");
      else if (!phoneValid)
        setError("Enter a 10-digit Indian mobile number starting with 6, 7, 8, or 9.");
      else if (!cityValid) setError("Please select your city.");
      else if (!passwordValid) setError(`Password must be at least ${PASSWORD_MIN} characters.`);
      else if (!terms) setError("Please agree to the Terms of Service and Privacy Policy.");
      return;
    }

    setSubmitting(true);

    // Use the server-side admin createAccount() action — bypasses email
    // domain validation, disposable-email blocks, and "Confirm email"
    // requirement. Account is auto-confirmed and ready to log in.
    const createResult = await createAccount({
      email: trimmedEmail,
      password,
      name: trimmedName,
      phone,
      city,
      intent: "renter",
    });

    if (!createResult.ok) {
      setSubmitting(false);
      setError(createResult.error);
      return;
    }

    // Account exists + confirmed. Now sign in to set the browser session cookie.
    const supabase = createClient();
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: trimmedEmail,
      password,
    });
    setSubmitting(false);

    if (signInError) {
      // Very unlikely now — account was just created with this password.
      setError(friendlyError(signInError));
      return;
    }

    // Honor ?next= so signing up from a gated CTA (e.g. "Save listing")
    // sends the new user back to where they were headed.
    router.replace(nextPath ?? "/");
    router.refresh();
  }

  // ---- Pending state: email confirmation required ----
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
            Click the link to activate your account and log in.
          </p>
        </div>

        <div className="mt-7 rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-elevated)] p-6 sm:p-8 shadow-[var(--shadow-md)] text-center space-y-4">
          <p className="text-sm text-[var(--color-ink-muted)]">
            Didn&apos;t get the email? Check your spam folder, or contact{" "}
            <a
              href="mailto:support@hostelpups.in"
              className="font-semibold text-[var(--color-brand-700)] hover:underline"
            >
              support@hostelpups.in
            </a>
            .
          </p>
          <Button type="button" variant="outline" size="lg" fullWidth href="/login">
            Go to login
            <ArrowRight size={18} />
          </Button>
        </div>
      </div>
    );
  }

  // ---- Default state: signup form ----
  return (
    <div className="w-full">
      <div className="text-center">
        <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-[var(--color-ink)]">
          Create your account
        </h1>
        <p className="mt-2 text-[var(--color-ink-muted)]">
          Sign up in 30 seconds. No email verification needed during beta.
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
          {/* Name */}
          <div>
            <label
              htmlFor="signup-name"
              className="block text-sm font-semibold mb-1.5 text-[var(--color-ink)]"
            >
              Full name
            </label>
            <div className="flex items-center gap-2 rounded-xl border border-[var(--color-border-strong)] bg-[var(--color-bg)] px-4 h-12 transition-colors focus-within:border-[var(--color-brand-500)] focus-within:ring-2 focus-within:ring-[var(--color-brand-100)]">
              <User size={16} className="text-[var(--color-ink-subtle)]" aria-hidden="true" />
              <input
                ref={nameInputRef}
                id="signup-name"
                type="text"
                autoComplete="name"
                placeholder="Aditya Menon"
                value={name}
                onChange={(e) => setName(e.target.value)}
                onBlur={() => setTouched((t) => ({ ...t, name: true }))}
                className="flex-1 bg-transparent outline-none text-base min-w-0"
                aria-invalid={touched.name && !nameValid}
                aria-describedby={touched.name && !nameValid ? "signup-name-err" : undefined}
              />
            </div>
            {touched.name && !nameValid && (
              <p id="signup-name-err" className="mt-1.5 text-xs text-red-600">
                Please enter your full name (2-60 letters).
              </p>
            )}
          </div>

          {/* Email */}
          <div>
            <label
              htmlFor="signup-email"
              className="block text-sm font-semibold mb-1.5 text-[var(--color-ink)]"
            >
              Email
            </label>
            <div className="flex items-center gap-2 rounded-xl border border-[var(--color-border-strong)] bg-[var(--color-bg)] px-4 h-12 transition-colors focus-within:border-[var(--color-brand-500)] focus-within:ring-2 focus-within:ring-[var(--color-brand-100)]">
              <Mail size={16} className="text-[var(--color-ink-subtle)]" aria-hidden="true" />
              <input
                id="signup-email"
                type="email"
                autoComplete="email"
                placeholder="aditya@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onBlur={() => setTouched((t) => ({ ...t, email: true }))}
                className="flex-1 bg-transparent outline-none text-base min-w-0"
                aria-invalid={touched.email && !emailValid}
                aria-describedby={touched.email && !emailValid ? "signup-email-err" : undefined}
              />
            </div>
            {touched.email && !emailValid && (
              <p id="signup-email-err" className="mt-1.5 text-xs text-red-600">
                Please enter a valid email address.
              </p>
            )}
          </div>

          {/* Phone */}
          <div>
            <label
              htmlFor="signup-phone"
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
                id="signup-phone"
                type="tel"
                inputMode="numeric"
                autoComplete="tel-national"
                placeholder="98765 43210"
                value={phone}
                onChange={(e) => setPhone(normalisePhoneInput(e.target.value))}
                onBlur={() => setTouched((t) => ({ ...t, phone: true }))}
                className="flex-1 bg-transparent outline-none text-base tracking-wider min-w-0"
                aria-invalid={touched.phone && !phoneValid}
                aria-describedby={touched.phone && !phoneValid ? "signup-phone-err" : undefined}
                maxLength={10}
              />
            </div>
            {touched.phone && !phoneValid && (
              <p id="signup-phone-err" className="mt-1.5 text-xs text-red-600">
                Enter a 10-digit Indian mobile starting with 6, 7, 8, or 9.
              </p>
            )}
          </div>

          {/* City */}
          <div>
            <label
              htmlFor="signup-city"
              className="block text-sm font-semibold mb-1.5 text-[var(--color-ink)]"
            >
              City
            </label>
            <div className="flex items-center gap-2 rounded-xl border border-[var(--color-border-strong)] bg-[var(--color-bg)] px-4 h-12 transition-colors focus-within:border-[var(--color-brand-500)] focus-within:ring-2 focus-within:ring-[var(--color-brand-100)]">
              <MapPin size={16} className="text-[var(--color-ink-subtle)]" aria-hidden="true" />
              <select
                id="signup-city"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                onBlur={() => setTouched((t) => ({ ...t, city: true }))}
                className="flex-1 bg-transparent outline-none text-base appearance-none min-w-0"
                aria-invalid={touched.city && !cityValid}
              >
                <option value="">Select a city</option>
                {CITY_OPTIONS.map(([slug, label]) => (
                  <option key={slug} value={slug}>
                    {label}
                  </option>
                ))}
              </select>
            </div>
            {touched.city && !cityValid && (
              <p className="mt-1.5 text-xs text-red-600">Please select your city.</p>
            )}
          </div>

          {/* Password */}
          <div>
            <label
              htmlFor="signup-password"
              className="block text-sm font-semibold mb-1.5 text-[var(--color-ink)]"
            >
              Password
            </label>
            <div className="flex items-center gap-2 rounded-xl border border-[var(--color-border-strong)] bg-[var(--color-bg)] px-4 h-12 transition-colors focus-within:border-[var(--color-brand-500)] focus-within:ring-2 focus-within:ring-[var(--color-brand-100)]">
              <Lock size={16} className="text-[var(--color-ink-subtle)]" aria-hidden="true" />
              <input
                id="signup-password"
                type={showPw ? "text" : "password"}
                autoComplete="new-password"
                placeholder="At least 6 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onBlur={() => setTouched((t) => ({ ...t, password: true }))}
                className="flex-1 bg-transparent outline-none text-base min-w-0"
                aria-invalid={touched.password && !passwordValid}
                aria-describedby="signup-password-help"
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
            <div
              id="signup-password-help"
              className="mt-1.5 flex items-center justify-between text-xs"
            >
              <span className="text-[var(--color-ink-subtle)]">Minimum {PASSWORD_MIN} characters.</span>
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
              htmlFor="signup-terms"
              className="flex items-start gap-2.5 cursor-pointer select-none"
            >
              <input
                id="signup-terms"
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
                Create account
                <ArrowRight size={18} />
              </>
            )}
          </Button>
        </form>
      </div>

      <p className="mt-6 text-center text-sm text-[var(--color-ink-muted)]">
        Already have an account?{" "}
        <Link
          href="/login"
          className="font-semibold text-[var(--color-brand-700)] hover:underline"
        >
          Log in
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
