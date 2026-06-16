"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { closeInquiry, reopenInquiry } from "@/lib/admin-actions";
import { Button } from "@/components/ui/Button";
import { XCircle, RefreshCw } from "lucide-react";

interface Props {
  inquiryId: string;
  status: "open" | "responded" | "closed";
}

export function InquiryRowActions({ inquiryId, status }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  // Close flow
  const [showClosePrompt, setShowClosePrompt] = useState(false);
  const [closeReason, setCloseReason] = useState("");
  const [closeError, setCloseError] = useState<string | null>(null);

  function handleClose() {
    setCloseError(null);
    startTransition(async () => {
      const result = await closeInquiry({
        inquiryId,
        reason: closeReason.trim() || undefined,
      });
      if (!result.ok) {
        setCloseError(result.error);
        return;
      }
      setShowClosePrompt(false);
      setCloseReason("");
      router.refresh();
    });
  }

  function handleReopen() {
    startTransition(async () => {
      await reopenInquiry({ inquiryId });
      router.refresh();
    });
  }

  if (status === "closed") {
    return (
      <button
        onClick={handleReopen}
        disabled={isPending}
        className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 hover:underline disabled:opacity-50"
      >
        <RefreshCw size={11} aria-hidden="true" />
        Reopen
      </button>
    );
  }

  if (showClosePrompt) {
    return (
      <div className="flex flex-col gap-1.5 min-w-[180px]">
        <textarea
          value={closeReason}
          onChange={(e) => setCloseReason(e.target.value)}
          placeholder="Reason (required)"
          rows={2}
          className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-2 py-1 text-xs resize-none focus:outline-none focus:ring-2 focus:ring-[var(--color-brand-500)]"
        />
        <p className="text-[10px] text-[var(--color-ink-muted)]">
          Min 3 characters.
        </p>
        {closeError && (
          <p className="text-xs text-red-600">{closeError}</p>
        )}
        <div className="flex gap-1.5">
          <Button
            size="sm"
            variant="outline"
            onClick={handleClose}
            disabled={isPending || closeReason.trim().length < 3}
            className="h-7 px-2 text-xs"
          >
            {isPending ? "Closing…" : "Confirm close"}
          </Button>
          <button
            onClick={() => {
              setShowClosePrompt(false);
              setCloseReason("");
              setCloseError(null);
            }}
            className="text-xs text-[var(--color-ink-muted)] hover:underline"
          >
            Cancel
          </button>
        </div>
      </div>
    );
  }

  return (
    <button
      onClick={() => setShowClosePrompt(true)}
      className="inline-flex items-center gap-1 text-xs font-semibold text-red-600 hover:underline"
    >
      <XCircle size={11} aria-hidden="true" />
      Close
    </button>
  );
}
