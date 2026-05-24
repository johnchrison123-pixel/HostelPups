import * as React from "react";
import Link from "next/link";
import { User, Building2 } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Two-tab toggle that switches between renter (user) and business (owner)
 * authentication forms. Server-rendered (no JS) — clicking a tab navigates to
 * the corresponding auth URL.
 *
 * Auth URL mapping:
 *   /login          ↔ /owner/login       (login mode)
 *   /signup         ↔ /owner/signup      (signup mode)
 */
interface AuthModeToggleProps {
  /** Which mode is currently active — controls visual highlight */
  active: "renter" | "business";
  /** "login" or "signup" — determines the target URL of the inactive tab */
  mode: "login" | "signup";
}

export function AuthModeToggle({ active, mode }: AuthModeToggleProps) {
  // Resolve the two destination URLs based on mode
  const renterHref = mode === "login" ? "/login" : "/signup";
  const businessHref = mode === "login" ? "/owner/login" : "/owner/signup";

  return (
    <div
      role="tablist"
      aria-label={`${mode === "login" ? "Login" : "Sign up"} as`}
      className="inline-grid grid-cols-2 gap-1 rounded-full bg-[var(--color-surface)] p-1 border border-[var(--color-border)] w-full max-w-md mx-auto"
    >
      <Link
        href={renterHref}
        role="tab"
        aria-selected={active === "renter"}
        className={cn(
          "inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-full text-sm font-semibold transition-all",
          active === "renter"
            ? "bg-[var(--color-brand-500)] text-[var(--color-ink)] shadow-[var(--shadow-sm)]"
            : "text-[var(--color-ink-muted)] hover:text-[var(--color-ink)] hover:bg-[var(--color-brand-100)]/50",
        )}
      >
        <User size={16} aria-hidden="true" />
        <span>
          <span className="sm:hidden">Renter</span>
          <span className="hidden sm:inline">
            {mode === "login" ? "Login as Renter" : "Sign up as Renter"}
          </span>
        </span>
      </Link>

      <Link
        href={businessHref}
        role="tab"
        aria-selected={active === "business"}
        className={cn(
          "inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-full text-sm font-semibold transition-all",
          active === "business"
            ? "bg-[var(--color-ink)] text-white shadow-[var(--shadow-sm)]"
            : "text-[var(--color-ink-muted)] hover:text-[var(--color-ink)] hover:bg-[var(--color-brand-100)]/50",
        )}
      >
        <Building2 size={16} aria-hidden="true" />
        <span>
          <span className="sm:hidden">Business</span>
          <span className="hidden sm:inline">
            {mode === "login" ? "Login as Business" : "Register as Business"}
          </span>
        </span>
      </Link>
    </div>
  );
}
