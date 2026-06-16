"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { resolveReport, dismissReport } from "@/lib/admin-actions";
import type { AdminReportRow } from "@/lib/admin-queries";
import { Button } from "@/components/ui/Button";
import { CheckCircle2, X } from "lucide-react";

interface Props {
  report: AdminReportRow;
}

type ActiveMode = "resolve" | "dismiss" | null;

export function ReportActions({ report }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [mode, setMode] = useState<ActiveMode>(null);
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);

  function handleSubmit() {
    if (mode === "resolve" && note.trim().length < 3) {
      setError("Resolution note must be at least 3 characters.");
      return;
    }
    setError(null);
    startTransition(async () => {
      let result;
      if (mode === "resolve") {
        result = await resolveReport({ reportId: report.id, note: note.trim() });
      } else if (mode === "dismiss") {
        result = await dismissReport({
          reportId: report.id,
          note: note.trim() || undefined,
        });
      } else {
        return;
      }
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setMode(null);
      setNote("");
      router.refresh();
    });
  }

  function handleCancel() {
    setMode(null);
    setNote("");
    setError(null);
  }

  if (mode) {
    const label = mode === "resolve" ? "Resolve" : "Dismiss";
    const placeholder =
      mode === "resolve"
        ? "Resolution note (required)…"
        : "Dismiss note (optional)…";
    return (
      <div className="flex flex-col gap-2 w-full max-w-sm">
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder={placeholder}
          rows={2}
          className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-[var(--color-brand-500)]"
          autoFocus
        />
        {error && <p className="text-xs text-red-600">{error}</p>}
        <div className="flex gap-2">
          <Button
            size="sm"
            variant={mode === "resolve" ? "primary" : "outline"}
            onClick={handleSubmit}
            disabled={isPending}
            className="h-8 text-xs"
          >
            {isPending ? "Saving…" : `Confirm ${label.toLowerCase()}`}
          </Button>
          <button
            onClick={handleCancel}
            className="text-xs text-[var(--color-ink-muted)] hover:underline"
          >
            Cancel
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={() => setMode("resolve")}
        className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 hover:underline"
      >
        <CheckCircle2 size={12} aria-hidden="true" />
        Resolve
      </button>
      <button
        onClick={() => setMode("dismiss")}
        className="inline-flex items-center gap-1 text-xs font-semibold text-[var(--color-ink-muted)] hover:underline"
      >
        <X size={12} aria-hidden="true" />
        Dismiss
      </button>
    </div>
  );
}
