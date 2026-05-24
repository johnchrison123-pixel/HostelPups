"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Phone, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { createClient } from "@/lib/supabase/client";
import { initiateCall } from "@/lib/call-actions";

/**
 * "Call owner" button rendered on the public listing detail page.
 *
 * Behavior:
 * - If the visitor is not signed in: redirects to /login?next=/pg/{city}/{slug}.
 * - If signed in: server-action `initiateCall({ listing_id })` creates the row
 *   in `ringing` state and we navigate to `/call/{id}?role=caller`.
 *
 * The actual WebRTC peer connection lives in the /call/[id] page — this
 * component's only job is the click-through.
 */
export function CallButton({
  listingId,
  listingCity,
  listingSlug,
  fullWidth = true,
  variant = "primary",
}: {
  listingId: string;
  listingCity: string;
  listingSlug: string;
  fullWidth?: boolean;
  variant?: "primary" | "cta" | "outline";
}) {
  const router = useRouter();
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  async function handleClick() {
    if (busy) return;
    setError(null);
    setBusy(true);
    try {
      // First check auth client-side so we redirect to /login without
      // bouncing through a server action that would just throw.
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        const next = `/pg/${listingCity}/${listingSlug}`;
        router.push(`/login?next=${encodeURIComponent(next)}`);
        return;
      }

      const call = await initiateCall({ listing_id: listingId });
      router.push(`/call/${call.id}?role=caller`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Could not start call";
      setError(msg);
      setBusy(false);
    }
  }

  return (
    <div className="w-full">
      <Button
        variant={variant}
        fullWidth={fullWidth}
        onClick={handleClick}
        disabled={busy}
        aria-label="Call owner now"
      >
        {busy ? (
          <Loader2 size={16} className="animate-spin" aria-hidden="true" />
        ) : (
          <Phone size={16} aria-hidden="true" />
        )}
        {busy ? "Connecting..." : "Call owner"}
      </Button>
      {error && (
        <p
          role="alert"
          className="mt-2 text-xs text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2"
        >
          {error}
        </p>
      )}
    </div>
  );
}
