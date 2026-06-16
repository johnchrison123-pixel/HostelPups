"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { XCircle, RefreshCw } from "lucide-react";
import { closeInquiry, reopenInquiry } from "@/lib/admin-actions";
import { Button } from "@/components/ui/Button";

interface Props {
  inquiryId: string;
  closed: boolean;
}

export function InquiryDetailActions({ inquiryId, closed }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [showClosePrompt, setShowClosePrompt] = useState(false);
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);

  function handleClose() {
    setError(null);
    startTransition(async () => {
      const result = await closeInquiry({
        inquiryId,
        reason: reason.trim(),
      });
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setShowClosePrompt(false);
      setReason("");
      router.refresh();
    });
  }

  function handleReopen() {
    startTransition(async () => {
      const result = await reopenInquiry({ inquiryId });
      if (!result.ok) {
        setError(result.error);
        return;
      }
      router.refresh();
    });
  }

  if (closed) {
    return (
      <div className="flex flex-col items-end gap-1">
        <Button
          size="sm"
          variant="outline"
          onClick={handleReopen}
          disabled={isPending}
        >
          <RefreshCw size={14} aria-hidden="true" />
          {isPending ? "Reopening…" : "Reopen inquiry"}
        </Button>
        {error && <p className="text-xs text-red-600">{error}</p>}
      </div>
    );
  }

  if (showClosePrompt) {
    const tooShort = reason.trim().length < 3;
    return (
      <div className="flex flex-col gap-1.5 min-w-[240px]">
        <textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="Reason for closing (required)"
          rows={2}
          className="rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-elevated)] px-2 py-1.5 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-[var(--color-brand-500)]"
          autoFocus
        />
        <p className="text-[10px] text-[var(--color-ink-muted)]">
          Min 3 characters.
        </p>
        {error && <p className="text-xs text-red-600">{error}</p>}
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={handleClose}
            disabled={isPending || tooShort}
          >
            {isPending ? "Closing…" : "Confirm close"}
          </Button>
          <button
            onClick={() => {
              setShowClosePrompt(false);
              setReason("");
              setError(null);
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
    <div className="flex flex-col items-end gap-1">
      <Button
        size="sm"
        variant="outline"
        onClick={() => setShowClosePrompt(true)}
        disabled={isPending}
      >
        <XCircle size={14} aria-hidden="true" />
        Close inquiry
      </Button>
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}
