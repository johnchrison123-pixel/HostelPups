"use client";

import * as React from "react";
import { LogOut } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

/**
 * Tiny client component used inside OwnerSidebar to actually sign the
 * user out — calls supabase.auth.signOut() and hard-navigates to /owner/login
 * so all cached server data is dropped from the navigation cache.
 *
 * Why a hard reload (window.location) instead of router.push():
 *   - Sign-out clears auth cookies. Any cached server-component output that
 *     was rendered while signed in must be discarded.
 *   - A hard reload is the simplest way to guarantee that — the alternative
 *     is router.refresh() but it doesn't always evict prefetched pages.
 */
export function OwnerSignOutButton() {
  const [pending, setPending] = React.useState(false);

  async function handleSignOut() {
    if (pending) return;
    setPending(true);
    try {
      const supabase = createClient();
      await supabase.auth.signOut();
    } catch {
      // ignore — we'll redirect regardless
    } finally {
      window.location.href = "/owner/login";
    }
  }

  return (
    <button
      type="button"
      onClick={handleSignOut}
      disabled={pending}
      className="inline-flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-[var(--color-ink-muted)] hover:bg-[var(--color-surface)] hover:text-[var(--color-ink)] transition-colors disabled:opacity-60 disabled:cursor-not-allowed text-left w-full"
    >
      <LogOut
        size={18}
        className="text-[var(--color-ink-subtle)] shrink-0"
        aria-hidden="true"
      />
      {pending ? "Signing out…" : "Sign out"}
    </button>
  );
}
