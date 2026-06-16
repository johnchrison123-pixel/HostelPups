"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  MoreVertical,
  Pause,
  Play,
  Star,
  StarOff,
  Trash2,
  AlertTriangle,
} from "lucide-react";
import {
  suspendListing,
  restoreListing,
  featureListing,
  unfeatureListing,
  deleteListing,
} from "@/lib/admin-actions";
import type { AdminListingRow } from "@/lib/admin-queries";

interface Props {
  listing: AdminListingRow;
}

function isFeatured(row: AdminListingRow): boolean {
  if (!row.is_boosted_until) return false;
  return new Date(row.is_boosted_until) > new Date();
}

export function ListingRowActions({ listing }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = React.useTransition();
  const [error, setError] = React.useState<string | null>(null);

  // Inline prompt states
  const [suspendPrompt, setSuspendPrompt] = React.useState(false);
  const [suspendReason, setSuspendReason] = React.useState("");
  const [deletePrompt, setDeletePrompt] = React.useState(false);
  const [deleteReason, setDeleteReason] = React.useState("");
  // Feature picker state (fix 20)
  const [featurePickerOpen, setFeaturePickerOpen] = React.useState(false);
  const [featureDays, setFeatureDays] = React.useState(30);

  const featured = isFeatured(listing);
  const isPaused = listing.status === "paused";

  // Ref for outside-click + Esc dismiss (fix 19)
  const detailsRef = React.useRef<HTMLDetailsElement>(null);

  function clearPrompts() {
    setSuspendPrompt(false);
    setSuspendReason("");
    setDeletePrompt(false);
    setDeleteReason("");
    setFeaturePickerOpen(false);
    setError(null);
  }

  // Outside-click + Esc dismiss (fix 19)
  React.useEffect(() => {
    const details = detailsRef.current;
    if (!details) return;

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape" && details && details.open) {
        details.removeAttribute("open");
        clearPrompts();
      }
    }

    function handleClickOutside(e: MouseEvent) {
      if (details && details.open && !details.contains(e.target as Node)) {
        details.removeAttribute("open");
        clearPrompts();
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("mousedown", handleClickOutside);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleAction(fn: () => Promise<{ ok: boolean; error?: string }>) {
    setError(null);
    startTransition(async () => {
      const res = await fn();
      if (!res.ok) {
        setError(res.error ?? "Something went wrong.");
      } else {
        clearPrompts();
        router.refresh();
      }
    });
  }

  // Base button style for menu items
  const itemBase =
    "w-full flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-left font-medium transition-colors hover:bg-[var(--color-surface)] disabled:opacity-50 disabled:cursor-not-allowed";
  const itemDanger =
    "w-full flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-left font-medium transition-colors hover:bg-red-50 text-red-700 disabled:opacity-50 disabled:cursor-not-allowed";

  return (
    <details
      ref={detailsRef}
      className="relative inline-block"
      onToggle={(e) => {
        // Close details clears any open prompts
        if (!(e.currentTarget as HTMLDetailsElement).open) {
          clearPrompts();
        }
      }}
    >
      <summary
        className="cursor-pointer list-none inline-flex h-8 w-8 items-center justify-center rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-elevated)] text-[var(--color-ink-muted)] hover:border-[var(--color-border-strong)] hover:text-[var(--color-ink)] transition-colors"
        aria-label="Listing actions"
      >
        <MoreVertical size={14} aria-hidden="true" />
      </summary>

      <div className="absolute right-0 top-full mt-1 w-60 rounded-xl border border-[var(--color-border)] bg-white shadow-md p-2 z-10">

        {/* Error chip */}
        {error && (
          <div className="mb-2 flex items-start gap-2 rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-xs text-red-700">
            <AlertTriangle size={13} className="shrink-0 mt-0.5" aria-hidden="true" />
            <span>{error}</span>
          </div>
        )}

        {/* ── Suspend / Restore ── */}
        {!isPaused && !suspendPrompt && (
          <button
            type="button"
            className={itemBase}
            disabled={isPending}
            onClick={() => {
              setDeletePrompt(false);
              setSuspendPrompt(true);
            }}
          >
            <Pause size={14} className="shrink-0 text-amber-600" aria-hidden="true" />
            Suspend listing
          </button>
        )}

        {!isPaused && suspendPrompt && (
          <div className="px-3 py-2 space-y-2">
            <p className="text-xs font-semibold text-[var(--color-ink-muted)] uppercase tracking-wide">
              Suspension reason
            </p>
            <textarea
              autoFocus
              rows={2}
              value={suspendReason}
              onChange={(e) => setSuspendReason(e.target.value)}
              placeholder="Why is this being suspended?"
              className="w-full rounded-lg border border-[var(--color-border-strong)] bg-[var(--color-bg)] px-2.5 py-1.5 text-xs resize-none focus:outline-none focus:ring-2 focus:ring-[var(--color-brand-500)]"
            />
            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={isPending || suspendReason.trim().length < 3}
                className="flex-1 inline-flex items-center justify-center h-8 rounded-lg bg-amber-600 text-white text-xs font-semibold hover:bg-amber-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                onClick={() =>
                  handleAction(() =>
                    suspendListing({
                      listingId: listing.id,
                      reason: suspendReason.trim(),
                    }),
                  )
                }
              >
                {isPending ? "Suspending…" : "Confirm suspend"}
              </button>
              <button
                type="button"
                className="h-8 px-3 rounded-lg text-xs font-semibold text-[var(--color-ink-muted)] hover:bg-[var(--color-surface)] transition-colors"
                onClick={() => setSuspendPrompt(false)}
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {isPaused && (
          <button
            type="button"
            className={itemBase}
            disabled={isPending}
            onClick={() =>
              handleAction(() =>
                restoreListing({ listingId: listing.id }),
              )
            }
          >
            <Play size={14} className="shrink-0 text-emerald-600" aria-hidden="true" />
            {isPending ? "Restoring…" : "Restore listing"}
          </button>
        )}

        {/* ── Feature / Unfeature ── */}
        {!featured && !featurePickerOpen && (
          <button
            type="button"
            className={itemBase}
            disabled={isPending}
            onClick={() => setFeaturePickerOpen(true)}
          >
            <Star size={14} className="shrink-0 text-[var(--color-brand-700)]" aria-hidden="true" />
            Feature listing…
          </button>
        )}

        {!featured && featurePickerOpen && (
          <div className="px-3 py-2 space-y-2">
            <p className="text-xs font-semibold text-[var(--color-ink-muted)] uppercase tracking-wide">
              Feature for
            </p>
            <select
              value={featureDays}
              onChange={(e) => setFeatureDays(Number(e.target.value))}
              className="w-full rounded-lg border border-[var(--color-border-strong)] bg-[var(--color-bg)] px-2.5 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-[var(--color-brand-500)]"
              disabled={isPending}
            >
              <option value={7}>7 days</option>
              <option value={14}>14 days</option>
              <option value={30}>30 days</option>
              <option value={60}>60 days</option>
              <option value={90}>90 days</option>
            </select>
            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={isPending}
                className="flex-1 inline-flex items-center justify-center h-8 rounded-lg bg-[var(--color-brand-500)] text-[var(--color-ink)] text-xs font-semibold hover:bg-[var(--color-brand-600)] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                onClick={() =>
                  handleAction(() =>
                    featureListing({ listingId: listing.id, daysAhead: featureDays }),
                  )
                }
              >
                {isPending ? "Featuring…" : `Feature for ${featureDays} days`}
              </button>
              <button
                type="button"
                className="h-8 px-3 rounded-lg text-xs font-semibold text-[var(--color-ink-muted)] hover:bg-[var(--color-surface)] transition-colors"
                onClick={() => setFeaturePickerOpen(false)}
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {featured && (
          <button
            type="button"
            className={itemBase}
            disabled={isPending}
            onClick={() =>
              handleAction(() =>
                unfeatureListing({ listingId: listing.id }),
              )
            }
          >
            <StarOff size={14} className="shrink-0 text-[var(--color-ink-subtle)]" aria-hidden="true" />
            {isPending ? "Unfeaturing…" : "Unfeature"}
          </button>
        )}

        {/* Divider before delete */}
        <div className="my-1.5 border-t border-[var(--color-border)]" />

        {/* ── Delete ── */}
        {!deletePrompt && (
          <button
            type="button"
            className={itemDanger}
            disabled={isPending}
            onClick={() => {
              setSuspendPrompt(false);
              setDeletePrompt(true);
            }}
          >
            <Trash2 size={14} className="shrink-0" aria-hidden="true" />
            Delete listing
          </button>
        )}

        {deletePrompt && (
          <div className="px-3 py-2 space-y-2">
            <p className="text-xs font-semibold text-red-700 uppercase tracking-wide">
              Takedown reason
            </p>
            <textarea
              autoFocus
              rows={2}
              value={deleteReason}
              onChange={(e) => setDeleteReason(e.target.value)}
              placeholder="Why is this listing being deleted?"
              className="w-full rounded-lg border border-red-300 bg-red-50 px-2.5 py-1.5 text-xs resize-none focus:outline-none focus:ring-2 focus:ring-red-500"
            />
            <p className="text-[10px] text-red-600 font-medium">
              This action is permanent and cannot be undone.
            </p>
            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={isPending || deleteReason.trim().length < 3}
                className="flex-1 inline-flex items-center justify-center h-8 rounded-lg bg-red-600 text-white text-xs font-semibold hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                onClick={() =>
                  handleAction(() =>
                    deleteListing({
                      listingId: listing.id,
                      reason: deleteReason.trim(),
                    }),
                  )
                }
              >
                {isPending ? "Deleting…" : "Confirm delete"}
              </button>
              <button
                type="button"
                className="h-8 px-3 rounded-lg text-xs font-semibold text-[var(--color-ink-muted)] hover:bg-[var(--color-surface)] transition-colors"
                onClick={() => setDeletePrompt(false)}
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </details>
  );
}
