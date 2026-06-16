"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { refundPayment, markPaymentFailed } from "@/lib/admin-actions";
import { Button } from "@/components/ui/Button";

type PaymentStatus = "pending" | "completed" | "failed" | "refunded";

interface Props {
  paymentId: string;
  status: PaymentStatus;
}

type ActiveAction = "refund" | "markFailed" | null;

export function PaymentRowActions({ paymentId, status }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [activeAction, setActiveAction] = useState<ActiveAction>(null);
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);

  const canRefund = status === "completed";
  const canMarkFailed = status === "pending";

  if (!canRefund && !canMarkFailed) {
    return <span className="text-xs text-[var(--color-ink-subtle)]">—</span>;
  }

  function handleSubmit() {
    if (reason.trim().length < 3) {
      setError("Reason must be at least 3 characters.");
      return;
    }
    setError(null);
    startTransition(async () => {
      let result;
      if (activeAction === "refund") {
        result = await refundPayment({ paymentId, reason: reason.trim() });
      } else if (activeAction === "markFailed") {
        result = await markPaymentFailed({ paymentId, reason: reason.trim() });
      } else {
        return;
      }
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setActiveAction(null);
      setReason("");
      router.refresh();
    });
  }

  function handleCancel() {
    setActiveAction(null);
    setReason("");
    setError(null);
  }

  if (activeAction) {
    const isRefund = activeAction === "refund";
    const placeholderLabel = isRefund ? "refund" : "mark failed";
    const confirmLabel = isRefund
      ? "Confirm — Razorpay NOT called"
      : "Confirm mark failed";
    return (
      <div className="flex flex-col gap-1.5 min-w-[220px]">
        <input
          type="text"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder={`Reason for ${placeholderLabel}…`}
          className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-[var(--color-brand-500)]"
          autoFocus
        />
        {error && <p className="text-xs text-red-600">{error}</p>}
        <div className="flex gap-1.5">
          <Button
            size="sm"
            variant="outline"
            onClick={handleSubmit}
            disabled={isPending}
            className="h-7 px-2 text-xs"
          >
            {isPending ? "Saving…" : confirmLabel}
          </Button>
          <button
            onClick={handleCancel}
            className="text-xs text-[var(--color-ink-muted)] hover:underline"
          >
            Cancel
          </button>
        </div>
        {isRefund && (
          <p className="text-[10px] text-amber-700">
            DB-only — does not trigger Razorpay refund yet.
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 flex-wrap">
      {canRefund && (
        <button
          onClick={() => setActiveAction("refund")}
          className="text-xs font-semibold text-amber-700 hover:underline"
        >
          Mark refunded (DB only)
        </button>
      )}
      {canMarkFailed && (
        <button
          onClick={() => setActiveAction("markFailed")}
          className="text-xs font-semibold text-red-600 hover:underline"
        >
          Mark failed
        </button>
      )}
    </div>
  );
}
