"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

type SinceOption = "24h" | "7d" | "30d" | "";

interface SinceItem {
  value: SinceOption;
  label: string;
}

const SINCE_OPTIONS: SinceItem[] = [
  { value: "24h", label: "24h" },
  { value: "7d", label: "7d" },
  { value: "30d", label: "30d" },
  { value: "", label: "All" },
];

const CALL_STATUSES = [
  "ringing",
  "accepted",
  "rejected",
  "missed",
  "ended",
  "failed",
  "cancelled",
];

interface Props {
  since: string;
  status: string;
}

function buildUrl(params: Record<string, string | undefined>): string {
  const sp = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v) sp.set(k, v);
  }
  const qs = sp.toString();
  return qs ? `/admin/calls?${qs}` : "/admin/calls";
}

export function CallsFilters({ since, status }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [statusValue, setStatusValue] = useState(status);

  function handleStatusChange(newStatus: string) {
    setStatusValue(newStatus);
    startTransition(() => {
      router.push(
        buildUrl({
          since: since || undefined,
          status: newStatus || undefined,
        }),
      );
    });
  }

  return (
    <div className="flex flex-wrap items-center gap-4 mb-4">
      {/* Since pills */}
      <div className="flex gap-2">
        {SINCE_OPTIONS.map((opt) => {
          const active = since === opt.value;
          return (
            <Link
              key={opt.value}
              href={buildUrl({
                since: opt.value || undefined,
                status: statusValue || undefined,
              })}
              className={[
                "inline-flex items-center rounded-full border px-3 py-1.5 text-sm font-semibold transition-colors",
                active
                  ? "bg-[var(--color-brand-500)] border-[var(--color-brand-500)] text-white"
                  : "bg-[var(--color-bg-elevated)] border-[var(--color-border)] text-[var(--color-ink)] hover:border-[var(--color-brand-400)]",
              ].join(" ")}
            >
              {opt.label}
            </Link>
          );
        })}
      </div>

      {/* Status select */}
      <label className="flex items-center gap-2 text-sm">
        <span className="font-medium text-[var(--color-ink-muted)]">
          Status
        </span>
        <select
          value={statusValue}
          disabled={isPending}
          onChange={(e) => handleStatusChange(e.target.value)}
          className="rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-elevated)] px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-brand-500)] disabled:opacity-60"
        >
          <option value="">All statuses</option>
          {CALL_STATUSES.map((s) => (
            <option key={s} value={s}>
              {s.charAt(0).toUpperCase() + s.slice(1)}
            </option>
          ))}
        </select>
      </label>
    </div>
  );
}
