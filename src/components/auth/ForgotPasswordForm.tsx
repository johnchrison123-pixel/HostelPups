"use client";

import * as React from "react";
import { Mail, ArrowRight, Loader2, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

/**
 * Client component: email field + Supabase resetPasswordForEmail call.
 *
 * On success shows a "check your inbox" state — no redirect needed because
 * the user must click the email link.
 *
 * PENDING: reset emails will only deliver once custom SMTP is configured
 * in the Supabase dashboard (Authentication → Email → SMTP Settings).
 * Until then Supabase's built-in 4-email/hour rate limit applies and
 * delivery may silently fail in production.
 */
export function ForgotPasswordForm() {
  const [email, setEmail] = React.useState("");
  const [status, setStatus] = React.useState<"idle" | "loading" | "sent" | "error">("idle");
  const [errorMsg, setErrorMsg] = React.useState("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const trimmed = email.trim().toLowerCase();
    if (!trimmed) return;

    setStatus("loading");
    setErrorMsg("");

    try {
      const supabase = createClient();
      // Use window.location.origin so the redirectTo is always the current
      // deployment (localhost in dev, production domain in prod).
      const origin = typeof window !== "undefined" ? window.location.origin : "";
      const { error } = await supabase.auth.resetPasswordForEmail(trimmed, {
        redirectTo: `${origin}/reset-password`,
      });

      if (error) {
        // Surface the raw Supabase message in dev but show a generic message
        // to users so we don't leak whether an account exists (C4-equivalent
        // for password reset — email enumeration mitigation).
        console.error("resetPasswordForEmail error:", error.message);
        setStatus("error");
        setErrorMsg(
          "If an account with that email exists, we sent a reset link. Check your spam folder too.",
        );
        return;
      }

      setStatus("sent");
    } catch (err) {
      console.error("resetPasswordForEmail unexpected error:", err);
      setStatus("error");
      setErrorMsg("Something went wrong. Please try again in a moment.");
    }
  }

  if (status === "sent") {
    return (
      <div className="text-center space-y-4 py-4">
        <div className="mx-auto inline-flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50">
          <CheckCircle2 size={28} className="text-emerald-600" aria-hidden="true" />
        </div>
        <h2 className="text-xl font-bold">Check your inbox</h2>
        <p className="text-[var(--color-ink-muted)] text-sm leading-relaxed">
          If an account exists for <strong>{email.trim()}</strong>, you&apos;ll receive a
          password reset link within a few minutes. Check your spam folder if you don&apos;t see it.
        </p>
        <p className="text-xs text-[var(--color-ink-subtle)]">
          The link expires in 1 hour. If it doesn&apos;t arrive, try again or contact support.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-5">
      <div>
        <label
          htmlFor="fp-email"
          className="block text-sm font-semibold mb-1.5"
        >
          Email address
        </label>
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-ink-subtle)] pointer-events-none">
            <Mail size={17} aria-hidden="true" />
          </span>
          <input
            id="fp-email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            disabled={status === "loading"}
            className={cn(
              "w-full pl-10 pr-4 py-2.5 rounded-xl border bg-[var(--color-surface)]",
              "text-sm outline-none transition-colors",
              "focus:border-[var(--color-brand-500)] focus:ring-2 focus:ring-[var(--color-brand-200)]",
              "disabled:opacity-60 disabled:cursor-not-allowed",
              status === "error"
                ? "border-red-400"
                : "border-[var(--color-border-strong)]",
            )}
          />
        </div>
      </div>

      {status === "error" && errorMsg && (
        <p role="alert" className="text-sm text-[var(--color-ink-muted)] bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
          {errorMsg}
        </p>
      )}

      <Button
        type="submit"
        variant="cta"
        size="lg"
        fullWidth
        disabled={status === "loading" || !email.trim()}
      >
        {status === "loading" ? (
          <>
            <Loader2 size={17} className="animate-spin" aria-hidden="true" />
            Sending…
          </>
        ) : (
          <>
            Send reset link
            <ArrowRight size={17} aria-hidden="true" />
          </>
        )}
      </Button>

      {/* PENDING note: visible only in development to remind devs. */}
      <p className="text-xs text-[var(--color-ink-subtle)] border border-[var(--color-border)] rounded-lg px-3 py-2">
        Note: password reset emails are sent via Supabase email; ensure custom SMTP
        is configured in the Supabase dashboard for production delivery.
      </p>
    </form>
  );
}
