"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Heart } from "lucide-react";
import { toggleFavorite } from "@/lib/user-actions";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

interface FavoriteButtonProps {
  listingId: string;
  /** SEO-friendly title used in aria-label. */
  listingTitle: string;
  /**
   * If known server-side, pass the initial favorite state to avoid a
   * client roundtrip on mount. If undefined we query Supabase on mount.
   */
  initialFavorited?: boolean;
  /** Forwarded to <button> for positional styling on top of card images. */
  className?: string;
  /** Returns the URL we should send the user to if not signed in. */
  signInNext?: string;
  /** Optional icon size — defaults to 14 (compact card heart). */
  iconSize?: number;
}

/**
 * Heart "save to favourites" toggle button.
 *
 * Behaviour:
 *  - Not signed in → router.push(`/login?next=...`)
 *  - Signed in → optimistic toggle + server action + revalidate /saved
 *
 * On mount, if `initialFavorited` is omitted, we look up the current state
 * in the favourites table so the heart paints correctly on cards that the
 * server rendered without preloading the join.
 */
export function FavoriteButton({
  listingId,
  listingTitle,
  initialFavorited,
  className,
  signInNext,
  iconSize = 14,
}: FavoriteButtonProps) {
  const router = useRouter();
  const [favorited, setFavorited] = React.useState<boolean>(
    initialFavorited ?? false,
  );
  // We only need an explicit "ready" state when we have to fetch on mount.
  const [pending, setPending] = React.useState(false);

  React.useEffect(() => {
    // Skip the lookup if the parent already told us.
    if (initialFavorited !== undefined) return;

    let cancelled = false;
    (async () => {
      try {
        const supabase = createClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user || cancelled) return;
        const { data } = await supabase
          .from("favorites")
          .select("listing_id")
          .eq("user_id", user.id)
          .eq("listing_id", listingId)
          .maybeSingle();
        if (!cancelled) setFavorited(!!data);
      } catch {
        // Network / RLS error — leave the button in the default (unsaved) state.
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [listingId, initialFavorited]);

  async function handleClick(e: React.MouseEvent<HTMLButtonElement>) {
    e.preventDefault();
    e.stopPropagation();

    if (pending) return;

    // Auth gate before optimistic flip so the UI doesn't lie to logged-out users.
    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        const next = signInNext ?? (typeof window !== "undefined" ? window.location.pathname : "/");
        router.push(`/login?next=${encodeURIComponent(next)}`);
        return;
      }
    } catch {
      // If even the auth check fails, fall through to the server action which will
      // throw "Not authenticated" — UI is best-effort here.
    }

    // Optimistic flip
    const prev = favorited;
    setFavorited(!prev);
    setPending(true);
    try {
      const result = await toggleFavorite(listingId);
      setFavorited(result.favorited);
    } catch {
      // Roll back on failure.
      setFavorited(prev);
    } finally {
      setPending(false);
    }
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-label={
        favorited
          ? `Remove ${listingTitle} from favourites`
          : `Save ${listingTitle} to favourites`
      }
      aria-pressed={favorited}
      disabled={pending}
      className={cn(
        "inline-flex items-center justify-center rounded-full bg-white/90 backdrop-blur-sm shadow-sm transition-colors disabled:cursor-wait",
        favorited
          ? "text-[var(--color-cta)] hover:bg-white"
          : "text-[var(--color-ink-muted)] hover:text-[var(--color-cta)] hover:bg-white",
        className,
      )}
    >
      <Heart
        size={iconSize}
        className={cn(favorited ? "fill-[var(--color-cta)]" : "")}
        aria-hidden="true"
      />
    </button>
  );
}
