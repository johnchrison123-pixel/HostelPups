"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

/**
 * Tiny client component used inside OwnerSidebar to actually sign the
 * user out — calls supabase.auth.signOut() and then navigates to /owner/login
 * so all cached server data is dropped from the navigation cache.
 *
 * We await signOut() before navigating so the auth cookies are cleared
 * before the server renders the next page (avoids a race where the
 * middleware refreshes a stale session from the previous owner).
 * router.push() + router.refresh() is preferred over window.location so
 * Next.js middleware fires cleanly and the RSC cache is invalidated.
 */
export function OwnerSignOutButton() {
  const [pending, setPending] = React.useState(false);
  const router = useRouter();

  async function handleSignOut() {
    if (pending) return;
    setPending(true);
    try {
      const supabase = createClient();
      await supabase.auth.signOut();
    } catch {
      // ignore sign-out errors — proceed to redirect regardless
    }
    // Navigate only after signOut resolves so auth cookies are cleared first.
    router.push("/owner/login");
    router.refresh();
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
