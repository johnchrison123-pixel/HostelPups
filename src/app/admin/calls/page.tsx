import type { Metadata } from "next";
import Link from "next/link";
import { PhoneCall, Lock } from "lucide-react";
import { buildMetadata } from "@/lib/seo";
import { searchAdminCalls } from "@/lib/admin-queries";
import { Badge } from "@/components/ui/Badge";
import { timeAgo } from "@/lib/utils";
import { CallsFilters } from "./CallsFilters";

export const metadata: Metadata = buildMetadata({
  title: "Calls — Admin",
  description: "Admin supervisory view of call records.",
  path: "/admin/calls",
  noindex: true,
});

export const dynamic = "force-dynamic";

const PAGE_SIZE = 50;

const CALL_STATUSES = [
  "ringing",
  "accepted",
  "rejected",
  "missed",
  "ended",
  "failed",
  "cancelled",
];

function sinceToISO(since: string): string | undefined {
  if (!since) return undefined;
  const now = Date.now();
  if (since === "24h") return new Date(now - 24 * 60 * 60 * 1000).toISOString();
  if (since === "7d") return new Date(now - 7 * 24 * 60 * 60 * 1000).toISOString();
  if (since === "30d") return new Date(now - 30 * 24 * 60 * 60 * 1000).toISOString();
  return undefined;
}

function callStatusTone(
  status: string,
): "verified" | "warning" | "danger" | "default" {
  if (status === "ended" || status === "accepted") return "verified";
  if (status === "missed" || status === "cancelled") return "warning";
  if (status === "rejected" || status === "failed") return "danger";
  return "default";
}

function formatDuration(seconds: number | null): string {
  if (seconds == null || seconds < 0) return "—";
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) {
    return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  }
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

function buildUrl(
  base: string,
  params: Record<string, string | undefined>,
): string {
  const sp = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v) sp.set(k, v);
  }
  const qs = sp.toString();
  return qs ? `${base}?${qs}` : base;
}

interface PageProps {
  searchParams: Promise<Record<string, string | undefined>>;
}

export default async function AdminCallsPage({ searchParams }: PageProps) {
  const sp = await searchParams;
  const sinceRaw = sp.since ?? "";
  const statusRaw = sp.status ?? "";
  const page = Math.max(1, parseInt(sp.page ?? "1", 10));
  const offset = (page - 1) * PAGE_SIZE;

  const sinceISO = sinceToISO(sinceRaw);
  const status = CALL_STATUSES.includes(statusRaw) ? statusRaw : undefined;

  const { rows, total } = await searchAdminCalls({
    status,
    since: sinceISO,
    limit: PAGE_SIZE,
    offset,
  });

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  function paginationUrl(p: number) {
    return buildUrl("/admin/calls", {
      since: sinceRaw || undefined,
      status: statusRaw || undefined,
      page: p > 1 ? String(p) : undefined,
    });
  }

  return (
    <>
      <header className="mb-4">
        <div className="flex items-start gap-3">
          <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-sky-50 text-sky-700 shrink-0">
            <PhoneCall size={22} aria-hidden="true" />
          </span>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-[var(--color-ink-subtle)]">
              Admin
            </p>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
              Calls
            </h1>
            <p className="mt-1 text-sm text-[var(--color-ink-muted)]">
              {total.toLocaleString("en-IN")} records in view
            </p>
          </div>
        </div>
      </header>

      {/* Read-only notice */}
      <div className="mb-4 flex items-start gap-3 rounded-2xl border border-sky-200 bg-sky-50/80 px-4 py-3">
        <Lock
          size={16}
          className="text-sky-700 mt-0.5 shrink-0"
          aria-hidden="true"
        />
        <p className="text-sm text-sky-900 font-medium">
          Calls are immutable per migration 0007. This view is{" "}
          <strong>read-only</strong>.
        </p>
      </div>

      {/* Filters */}
      <CallsFilters since={sinceRaw} status={statusRaw} />

      {/* Table */}
      {rows.length === 0 ? (
        <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-elevated)] p-12 text-center">
          <PhoneCall
            size={24}
            className="mx-auto text-[var(--color-ink-subtle)]"
            aria-hidden="true"
          />
          <p className="mt-3 font-semibold">No calls found</p>
          <p className="mt-1 text-sm text-[var(--color-ink-muted)]">
            Try a different time window or status filter.
          </p>
        </div>
      ) : (
        <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-elevated)] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--color-border)] bg-[var(--color-surface)]">
                  <th className="px-4 py-3 text-left font-semibold text-[var(--color-ink-muted)] text-xs uppercase tracking-wide">
                    Caller
                  </th>
                  <th className="px-4 py-3 text-left font-semibold text-[var(--color-ink-muted)] text-xs uppercase tracking-wide">
                    Callee
                  </th>
                  <th className="px-4 py-3 text-left font-semibold text-[var(--color-ink-muted)] text-xs uppercase tracking-wide">
                    Status
                  </th>
                  <th className="px-4 py-3 text-right font-semibold text-[var(--color-ink-muted)] text-xs uppercase tracking-wide">
                    Duration
                  </th>
                  <th className="px-4 py-3 text-left font-semibold text-[var(--color-ink-muted)] text-xs uppercase tracking-wide">
                    End reason
                  </th>
                  <th className="px-4 py-3 text-left font-semibold text-[var(--color-ink-muted)] text-xs uppercase tracking-wide">
                    Started
                  </th>
                  <th className="px-4 py-3 text-left font-semibold text-[var(--color-ink-muted)] text-xs uppercase tracking-wide">
                    Inquiry
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--color-border)]">
                {rows.map((row) => (
                  <tr
                    key={row.id}
                    className="hover:bg-[var(--color-surface)] transition-colors"
                  >
                    <td className="px-4 py-3 font-medium">
                      {row.caller_name ?? (
                        <span className="text-[var(--color-ink-subtle)] italic">
                          Unknown
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 font-medium">
                      {row.callee_name ?? (
                        <span className="text-[var(--color-ink-subtle)] italic">
                          Unknown
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <Badge tone={callStatusTone(row.status)}>
                        {row.status.charAt(0).toUpperCase() + row.status.slice(1)}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums text-[var(--color-ink-muted)]">
                      {formatDuration(row.duration_seconds)}
                    </td>
                    <td className="px-4 py-3 text-[var(--color-ink-muted)] max-w-[120px] truncate">
                      {row.end_reason ?? "—"}
                    </td>
                    <td className="px-4 py-3 text-[var(--color-ink-muted)] whitespace-nowrap">
                      {row.started_at
                        ? timeAgo(row.started_at)
                        : timeAgo(row.created_at)}
                    </td>
                    <td className="px-4 py-3">
                      {row.inquiry_id ? (
                        <Link
                          href={`/admin/inquiries/${row.inquiry_id}`}
                          className="inline-flex items-center gap-1 text-xs font-semibold text-[var(--color-brand-700)] hover:underline"
                        >
                          View
                        </Link>
                      ) : (
                        <span className="text-[var(--color-ink-subtle)]">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <nav
          className="mt-6 flex items-center justify-between gap-4 flex-wrap"
          aria-label="Pagination"
        >
          <p className="text-sm text-[var(--color-ink-muted)]">
            Page {page} of {totalPages} &mdash;{" "}
            {total.toLocaleString("en-IN")} total
          </p>
          <div className="flex gap-2">
            {page > 1 && (
              <Link
                href={paginationUrl(page - 1)}
                className="inline-flex items-center gap-1 rounded-full border border-[var(--color-border)] bg-[var(--color-bg-elevated)] px-4 py-2 text-sm font-semibold hover:border-[var(--color-brand-400)] transition-colors"
              >
                Previous
              </Link>
            )}
            {page < totalPages && (
              <Link
                href={paginationUrl(page + 1)}
                className="inline-flex items-center gap-1 rounded-full border border-[var(--color-border)] bg-[var(--color-bg-elevated)] px-4 py-2 text-sm font-semibold hover:border-[var(--color-brand-400)] transition-colors"
              >
                Next
              </Link>
            )}
          </div>
        </nav>
      )}
    </>
  );
}
