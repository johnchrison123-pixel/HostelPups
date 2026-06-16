"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export function AdminSignOutButton() {
  const [pending, setPending] = React.useState(false);
  const router = useRouter();

  async function handleSignOut() {
    if (pending) return;
    setPending(true);
    try {
      const supabase = createClient();
      await supabase.auth.signOut();
    } catch {
      // ignore — proceed to redirect regardless
    }
    router.push("/login");
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
