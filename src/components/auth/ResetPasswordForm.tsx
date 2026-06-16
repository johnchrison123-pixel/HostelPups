"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Lock, Eye, EyeOff, ArrowRight, Loader2, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

/**
 * Client component: new password + confirm fields.
 *
 * The user arrives here from the Supabase email link. Supabase's auth-helpers
 * detect the hash tokens on mount and establish a session automatically, so
 * supabase.auth.updateUser() will work here without any extra token handling.
 *
 * On success, redirects to / so the user lands on the homepage as logged in.
 */
export function ResetPasswordForm() {
  const router = useRouter();
  const [password, setPassword] = React.useState("");
  const [confirm, setConfirm] = React.useState("");
  const [showPw, setShowPw] = React.useState(false);
  const [status, setStatus] = React.useState<"idle" | "loading" | "done" | "error">("idle");
  const [errorMsg, setErrorMsg] = React.useState("");

  const passwordsMatch = password === confirm;
  const isLongEnough = password.length >= 8;
  const canSubmit = isLongEnough && passwordsMatch && password.length > 0 && confirm.length > 0;

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!canSubmit || status === "loading") return;

    setStatus("loading");
    setErrorMsg("");

    try {
      const supabase = createClient();
      const { error } = await supabase.auth.updateUser({ password });

      if (error) {
        console.error("updateUser error:", error.message);
        setStatus("error");
        // Friendly mapping for the most common errors:
        if (error.message.includes("same password")) {
          setErrorMsg("Your new password must be different from your current password.");
        } else if (error.message.includes("session")) {
          setErrorMsg(
            "Your reset link has expired or already been used. Please request a new one.",
          );
        } else {
          setErrorMsg("Failed to update password. Please try again or request a new reset link.");
        }
        return;
      }

      setStatus("done");
      // Brief delay so the user sees the success state, then redirect.
      setTimeout(() => {
        router.push("/");
        router.refresh();
      }, 1800);
    } catch (err) {
      console.error("updateUser unexpected error:", err);
      setStatus("error");
      setErrorMsg("Something went wrong. Please try again.");
    }
  }

  if (status === "done") {
    return (
      <div className="text-center space-y-4 py-4">
        <div className="mx-auto inline-flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50">
          <CheckCircle2 size={28} className="text-emerald-600" aria-hidden="true" />
        </div>
        <h2 className="text-xl font-bold">Password updated!</h2>
        <p className="text-[var(--color-ink-muted)] text-sm">
          You&apos;re now logged in. Redirecting to the homepage…
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-5">
      {/* New password */}
      <div>
        <label htmlFor="rp-password" className="block text-sm font-semibold mb-1.5">
          New password
        </label>
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-ink-subtle)] pointer-events-none">
            <Lock size={17} aria-hidden="true" />
          </span>
          <input
            id="rp-password"
            type={showPw ? "text" : "password"}
            autoComplete="new-password"
            required
            minLength={8}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="At least 8 characters"
            disabled={status === "loading"}
            className={cn(
              "w-full pl-10 pr-11 py-2.5 rounded-xl border bg-[var(--color-surface)]",
              "text-sm outline-none transition-colors",
              "focus:border-[var(--color-brand-500)] focus:ring-2 focus:ring-[var(--color-brand-200)]",
              "disabled:opacity-60 disabled:cursor-not-allowed",
              password.length > 0 && !isLongEnough
                ? "border-red-400"
                : "border-[var(--color-border-strong)]",
            )}
          />
          <button
            type="button"
            onClick={() => setShowPw((v) => !v)}
            aria-label={showPw ? "Hide password" : "Show password"}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-ink-subtle)] hover:text-[var(--color-ink)]"
          >
            {showPw ? <EyeOff size={17} /> : <Eye size={17} />}
          </button>
        </div>
        {password.length > 0 && !isLongEnough && (
          <p className="mt-1 text-xs text-red-600">Password must be at least 8 characters.</p>
        )}
      </div>

      {/* Confirm password */}
      <div>
        <label htmlFor="rp-confirm" className="block text-sm font-semibold mb-1.5">
          Confirm new password
        </label>
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-ink-subtle)] pointer-events-none">
            <Lock size={17} aria-hidden="true" />
          </span>
          <input
            id="rp-confirm"
            type={showPw ? "text" : "password"}
            autoComplete="new-password"
            required
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            placeholder="Repeat your new password"
            disabled={status === "loading"}
            className={cn(
              "w-full pl-10 pr-4 py-2.5 rounded-xl border bg-[var(--color-surface)]",
              "text-sm outline-none transition-colors",
              "focus:border-[var(--color-brand-500)] focus:ring-2 focus:ring-[var(--color-brand-200)]",
              "disabled:opacity-60 disabled:cursor-not-allowed",
              confirm.length > 0 && !passwordsMatch
                ? "border-red-400"
                : "border-[var(--color-border-strong)]",
            )}
          />
        </div>
        {confirm.length > 0 && !passwordsMatch && (
          <p className="mt-1 text-xs text-red-600">Passwords don&apos;t match.</p>
        )}
      </div>

      {status === "error" && errorMsg && (
        <p role="alert" className="text-sm text-[var(--color-ink-muted)] bg-red-50 border border-red-200 rounded-lg px-3 py-2">
          {errorMsg}
        </p>
      )}

      <Button
        type="submit"
        variant="cta"
        size="lg"
        fullWidth
        disabled={!canSubmit || status === "loading"}
      >
        {status === "loading" ? (
          <>
            <Loader2 size={17} className="animate-spin" aria-hidden="true" />
            Updating…
          </>
        ) : (
          <>
            Set new password
            <ArrowRight size={17} aria-hidden="true" />
          </>
        )}
      </Button>
    </form>
  );
}
