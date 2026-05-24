"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Pause, Play, Trash2, Loader2 } from "lucide-react";
import { pauseListing, resumeListing, deleteListing } from "@/lib/owner-actions";
import type { ListingStatus } from "@/lib/types";

interface ListingRowActionsProps {
  id: string;
  status: ListingStatus;
  title: string;
}

/**
 * Inline pause/resume/delete actions for a row in the owner listings table.
 *
 * Server actions are imported directly from owner-actions.ts; React 19
 * `useTransition` keeps the UI responsive while the action runs and lets
 * us show a spinner. The actions call `revalidatePath` server-side so
 * Next.js refreshes the cached page on success — no manual re-fetch needed.
 */
export function ListingRowActions({ id, status, title }: ListingRowActionsProps) {
  const router = useRouter();
  const [pending, startTransition] = React.useTransition();

  const isLive = status === "live";
  const isPaused = status === "paused";

  function handlePause() {
    startTransition(async () => {
      try {
        await pauseListing(id);
        router.refresh();
      } catch (err) {
        if (typeof window !== "undefined")
          window.alert(`Could not pause: ${(err as Error).message}`);
      }
    });
  }

  function handleResume() {
    startTransition(async () => {
      try {
        await resumeListing(id);
        router.refresh();
      } catch (err) {
        if (typeof window !== "undefined")
          window.alert(`Could not resume: ${(err as Error).message}`);
      }
    });
  }

  function handleDelete() {
    if (
      typeof window !== "undefined" &&
      !window.confirm(
        `Delete "${title}"? This permanently removes the listing, all photos, and all room types. Past inquiries stay in chat history.`,
      )
    ) {
      return;
    }
    startTransition(async () => {
      try {
        await deleteListing(id);
        router.refresh();
      } catch (err) {
        if (typeof window !== "undefined")
          window.alert(`Could not delete: ${(err as Error).message}`);
      }
    });
  }

  return (
    <>
      {isPaused ? (
        <button
          type="button"
          aria-label={`Resume ${title}`}
          onClick={handleResume}
          disabled={pending}
          className="inline-flex h-8 w-8 items-center justify-center rounded-full text-emerald-700 hover:bg-emerald-50 transition-colors disabled:opacity-50"
          title="Resume listing"
        >
          {pending ? (
            <Loader2 size={14} className="animate-spin" aria-hidden="true" />
          ) : (
            <Play size={14} aria-hidden="true" />
          )}
        </button>
      ) : isLive ? (
        <button
          type="button"
          aria-label={`Pause ${title}`}
          onClick={handlePause}
          disabled={pending}
          className="inline-flex h-8 w-8 items-center justify-center rounded-full text-[var(--color-ink-muted)] hover:bg-amber-50 hover:text-amber-700 transition-colors disabled:opacity-50"
          title="Pause listing"
        >
          {pending ? (
            <Loader2 size={14} className="animate-spin" aria-hidden="true" />
          ) : (
            <Pause size={14} aria-hidden="true" />
          )}
        </button>
      ) : null}
      <button
        type="button"
        aria-label={`Delete ${title}`}
        onClick={handleDelete}
        disabled={pending}
        className="inline-flex h-8 w-8 items-center justify-center rounded-full text-[var(--color-ink-muted)] hover:bg-red-50 hover:text-red-700 transition-colors disabled:opacity-50"
        title="Delete listing"
      >
        {pending ? (
          <Loader2 size={14} className="animate-spin" aria-hidden="true" />
        ) : (
          <Trash2 size={14} aria-hidden="true" />
        )}
      </button>
    </>
  );
}
