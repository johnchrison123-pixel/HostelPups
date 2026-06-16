import type { Metadata } from "next";
import Link from "next/link";
import { Flag } from "lucide-react";
import { buildMetadata } from "@/lib/seo";
import { searchReports } from "@/lib/admin-queries";
import type { AdminReportRow } from "@/lib/admin-queries";
import { fetchReportTarget } from "@/lib/admin-actions";
import { createClient } from "@/lib/supabase/server";
import { Badge } from "@/components/ui/Badge";
import { timeAgo, truncate } from "@/lib/utils";
import { ReportActions } from "./ReportActions";

export const metadata: Metadata = buildMetadata({
  title: "Reports — Admin",
  description: "Admin moderation queue for user reports.",
  path: "/admin/reports",
  noindex: true,
});

export const dynamic = "force-dynamic";

const PAGE_SIZE = 30;

type ReportStatus = "open" | "reviewing" | "resolved" | "dismissed";

const STATUS_PILLS: Array<{ value: ReportStatus | ""; label: string }> = [
  { value: "", label: "All" },
  { value: "open", label: "Open" },
  { value: "reviewing", label: "Reviewing" },
  { value: "resolved", label: "Resolved" },
  { value: "dismissed", label: "Dismissed" },
];

const TARGET_TYPES = [
  "listing",
  "user",
  "message",
  "review",
  "owner",
  "inquiry",
];

function reportStatusTone(
  status: string,
): "warning" | "brand" | "verified" | "default" {
  if (status === "open") return "warning";
  if (status === "reviewing") return "brand";
  if (status === "resolved") return "verified";
  return "default";
}

function targetTypeEmoji(type: string): string {
  const map: Record<string, string> = {
    listing: "🏠",
    user: "👤",
    owner: "🏢",
    message: "💬",
    review: "⭐",
    inquiry: "📋",
  };
  return map[type] ?? "❓";
}

function targetLink(report: AdminReportRow): string | null {
  const { target_type, target_id } = report;
  if (target_type === "user") return `/admin/users/${target_id}`;
  if (target_type === "listing") return `/admin/listings?q=${target_id}`;
  if (target_type === "owner") return `/admin/owners/${target_id}`;
  if (target_type === "inquiry") return `/admin/inquiries/${target_id}`;
  return null;
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

export default async function AdminReportsPage({ searchParams }: PageProps) {
  const sp = await searchParams;
  const wasExplicit = sp.status !== undefined;
  const statusRaw = sp.status ?? "";
  const targetTypeRaw = sp.target_type ?? "";
  const page = Math.max(1, parseInt(sp.page ?? "1", 10));
  const offset = (page - 1) * PAGE_SIZE;

  const status = ["open", "reviewing", "resolved", "dismissed"].includes(
    statusRaw,
  )
    ? (statusRaw as ReportStatus)
    : undefined;
  const targetType = TARGET_TYPES.includes(targetTypeRaw)
    ? targetTypeRaw
    : undefined;

  const { rows, total } = await searchReports({
    status,
    target_type: targetType,
    limit: PAGE_SIZE,
    offset,
  });

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  function filterUrl(params: Partial<Record<string, string>>) {
    return buildUrl("/admin/reports", {
      status: (params.status ?? statusRaw) || undefined,
      target_type: (params.target_type ?? targetTypeRaw) || undefined,
      page: undefined,
    });
  }

  function paginationUrl(p: number) {
    return buildUrl("/admin/reports", {
      status: statusRaw || undefined,
      target_type: targetTypeRaw || undefined,
      page: p > 1 ? String(p) : undefined,
    });
  }

  // For message / review / inquiry targets, fetch a small preview row
  // server-side so we can show it inline (Item K).
  const PREVIEW_TYPES = new Set(["message", "review", "inquiry"]);
  const previews = await Promise.all(
    rows.map(async (r) => {
      if (!PREVIEW_TYPES.has(r.target_type)) return null;
      const res = await fetchReportTarget(r.target_type, r.target_id);
      if (!res.ok) return null;
      return res.data;
    }),
  );

  // For inquiry previews we also want the last few messages.
  const inquiryMsgSupabase = await createClient();
  const inquiryRecentMessages = await Promise.all(
    rows.map(async (r, i) => {
      if (r.target_type !== "inquiry" || !previews[i]) return null;
      try {
        const { data } = await inquiryMsgSupabase
          .from("messages")
          .select("id, sender_id, content, created_at")
          .eq("inquiry_id", r.target_id)
          .order("created_at", { ascending: false })
          .limit(3);
        if (!data) return null;
        // Reverse to chronological order
        return [...data].reverse();
      } catch {
        return null;
      }
    }),
  );

  return (
    <>
      <header className="mb-6">
        <div className="flex items-start gap-3">
          <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-red-50 text-red-600 shrink-0">
            <Flag size={22} aria-hidden="true" />
          </span>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-[var(--color-ink-subtle)]">
              Admin
            </p>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
              Reports
            </h1>
            <p className="mt-1 text-sm text-[var(--color-ink-muted)]">
              {total.toLocaleString("en-IN")} report
              {total !== 1 ? "s" : ""} in view
            </p>
          </div>
        </div>
      </header>

      {/* Filter bar */}
      <div className="flex flex-wrap gap-4 items-center mb-4">
        {/* Status pills */}
        <div className="flex flex-wrap gap-2">
          {STATUS_PILLS.map((pill) => {
            const active =
              statusRaw === pill.value ||
              (statusRaw === "" && pill.value === "");
            return (
              <Link
                key={pill.value}
                href={filterUrl({ status: pill.value, target_type: targetTypeRaw })}
                className={[
                  "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm font-semibold transition-colors",
                  active
                    ? "bg-[var(--color-brand-500)] border-[var(--color-brand-500)] text-white"
                    : "bg-[var(--color-bg-elevated)] border-[var(--color-border)] text-[var(--color-ink)] hover:border-[var(--color-brand-400)]",
                ].join(" ")}
              >
                {pill.label}
              </Link>
            );
          })}
        </div>

        {/* Target type filter */}
        <label className="flex items-center gap-2 text-sm">
          <span className="font-medium text-[var(--color-ink-muted)]">Type</span>
          <select
            defaultValue={targetTypeRaw}
            name="target_type"
            form="reports-filter-form"
            className="rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-elevated)] px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-brand-500)]"
          >
            <option value="">All types</option>
            {TARGET_TYPES.map((t) => (
              <option key={t} value={t}>
                {targetTypeEmoji(t)}{" "}
                {t.charAt(0).toUpperCase() + t.slice(1)}
              </option>
            ))}
          </select>
        </label>
        <form id="reports-filter-form" action="/admin/reports" method="GET" className="flex items-center">
          {wasExplicit && statusRaw && (
            <input type="hidden" name="status" value={statusRaw} />
          )}
          <button
            type="submit"
            className="rounded-full border border-[var(--color-border)] bg-[var(--color-bg-elevated)] px-3 py-1.5 text-sm font-semibold hover:border-[var(--color-brand-400)] transition-colors"
          >
            Filter
          </button>
        </form>
      </div>

      {/* Cards */}
      {rows.length === 0 ? (
        <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-elevated)] p-12 text-center">
          <Flag
            size={28}
            className="mx-auto text-[var(--color-ink-subtle)]"
            aria-hidden="true"
          />
          <p className="mt-3 font-semibold text-lg">No reports here</p>
          <p className="mt-1 text-sm text-[var(--color-ink-muted)]">
            {status === "open"
              ? "The moderation queue is clear."
              : "Try a different status filter."}
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {rows.map((report, i) => {
            const isOpenLike =
              report.status === "open" || report.status === "reviewing";
            const link = targetLink(report);
            const detailsTruncated = report.details
              ? report.details.length > 200
                ? report.details.slice(0, 199) + "…"
                : report.details
              : null;
            const preview = previews[i] as Record<string, unknown> | null;
            const recentMessages = inquiryRecentMessages[i];

            return (
              <article
                key={report.id}
                className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-elevated)] overflow-hidden"
              >
                {/* Card header */}
                <div className="px-4 pt-4 pb-3 flex flex-wrap items-start gap-2 border-b border-[var(--color-border)]">
                  <span className="text-base">
                    {targetTypeEmoji(report.target_type)}
                  </span>
                  <Badge tone="default" className="capitalize">
                    {report.target_type}
                  </Badge>
                  <Badge tone={reportStatusTone(report.status)}>
                    {report.status.charAt(0).toUpperCase() +
                      report.status.slice(1)}
                  </Badge>
                  <p className="flex-1 text-sm font-bold text-[var(--color-ink)] min-w-[120px]">
                    {report.reason}
                  </p>
                  <span className="text-xs text-[var(--color-ink-muted)] whitespace-nowrap">
                    {timeAgo(report.created_at)}
                  </span>
                </div>

                {/* Card body */}
                <div className="px-4 py-3 space-y-1">
                  <p className="text-sm text-[var(--color-ink-muted)]">
                    <span className="font-medium text-[var(--color-ink)]">
                      Reporter:
                    </span>{" "}
                    <Link
                      href={`/admin/users/${report.reporter_id}`}
                      className="font-semibold text-[var(--color-brand-700)] hover:underline"
                    >
                      {report.reporter_name ?? (
                        <span className="italic">Unknown</span>
                      )}
                    </Link>
                  </p>
                  {detailsTruncated && (
                    <p className="text-sm text-[var(--color-ink-muted)] leading-relaxed">
                      &ldquo;{detailsTruncated}&rdquo;
                    </p>
                  )}
                  <p className="text-xs text-[var(--color-ink-subtle)] font-mono">
                    Target ID: {report.target_id}
                  </p>
                </div>

                {/* Inline target preview (message / review / inquiry) — Item K */}
                {preview && report.target_type === "message" && (
                  <div className="px-4 pb-3">
                    <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2">
                      <p className="text-[10px] font-semibold uppercase tracking-wide text-[var(--color-ink-subtle)] mb-1">
                        Message preview
                      </p>
                      <p className="text-sm whitespace-pre-wrap text-[var(--color-ink)]">
                        {truncate(String(preview.content ?? ""), 300)}
                      </p>
                      <p className="mt-1 text-xs text-[var(--color-ink-muted)]">
                        Sender:{" "}
                        <span className="font-mono">
                          {String(preview.sender_id ?? "").slice(0, 8)}
                        </span>
                        {Boolean(preview.created_at) && (
                          <>
                            {" · "}
                            {timeAgo(String(preview.created_at))}
                          </>
                        )}
                      </p>
                    </div>
                  </div>
                )}
                {preview && report.target_type === "review" && (
                  <div className="px-4 pb-3">
                    <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2">
                      <p className="text-[10px] font-semibold uppercase tracking-wide text-[var(--color-ink-subtle)] mb-1">
                        Review preview
                      </p>
                      <p className="text-sm font-semibold text-[var(--color-ink)]">
                        Rating: {String(preview.rating ?? "—")} / 5
                      </p>
                      <p className="mt-1 text-sm whitespace-pre-wrap text-[var(--color-ink-muted)]">
                        {truncate(
                          String(preview.content ?? preview.body ?? ""),
                          300,
                        )}
                      </p>
                    </div>
                  </div>
                )}
                {preview && report.target_type === "inquiry" && (
                  <div className="px-4 pb-3">
                    <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2">
                      <div className="flex items-center justify-between gap-2 mb-1.5">
                        <p className="text-[10px] font-semibold uppercase tracking-wide text-[var(--color-ink-subtle)]">
                          Inquiry preview
                        </p>
                        <Link
                          href={`/admin/inquiries/${report.target_id}`}
                          className="text-xs font-semibold text-[var(--color-brand-700)] hover:underline"
                        >
                          Open chat →
                        </Link>
                      </div>
                      {recentMessages && recentMessages.length > 0 ? (
                        <ol className="flex flex-col gap-1.5">
                          {recentMessages.map((m) => {
                            const mr = m as Record<string, unknown>;
                            return (
                              <li
                                key={String(mr.id)}
                                className="text-xs text-[var(--color-ink-muted)]"
                              >
                                <span className="font-mono text-[var(--color-ink-subtle)]">
                                  {String(mr.sender_id ?? "").slice(0, 8)}
                                </span>
                                {": "}
                                <span className="whitespace-pre-wrap">
                                  {truncate(String(mr.content ?? ""), 140)}
                                </span>
                              </li>
                            );
                          })}
                        </ol>
                      ) : (
                        <p className="text-xs text-[var(--color-ink-muted)] italic">
                          No messages yet.
                        </p>
                      )}
                    </div>
                  </div>
                )}

                {/* Resolution footer (only when resolved/dismissed) */}
                {(report.status === "resolved" ||
                  report.status === "dismissed") &&
                  (report.resolved_at || report.resolution_note) && (
                    <div className="px-4 pb-3 flex flex-col gap-0.5 border-t border-[var(--color-border)] pt-2">
                      {report.resolved_at && (
                        <p className="text-xs text-[var(--color-ink-muted)]">
                          {report.status === "resolved"
                            ? "Resolved"
                            : "Dismissed"}{" "}
                          {timeAgo(report.resolved_at)}
                        </p>
                      )}
                      {report.resolution_note && (
                        <p className="text-xs text-[var(--color-ink-muted)]">
                          Note: {report.resolution_note}
                        </p>
                      )}
                    </div>
                  )}

                {/* Action row — always render View target link; hide
                    Resolve/Dismiss buttons when terminal status. */}
                <div className="px-4 pb-4 pt-2 border-t border-[var(--color-border)] flex flex-wrap items-center gap-3">
                  {link && (
                    <Link
                      href={link}
                      className="text-xs font-semibold text-[var(--color-brand-700)] hover:underline inline-flex items-center gap-1"
                    >
                      View target →
                    </Link>
                  )}
                  {!link && (
                    <span className="text-xs text-[var(--color-ink-subtle)]">
                      Target: {report.target_type} #
                      {report.target_id.slice(0, 8)}
                    </span>
                  )}
                  {isOpenLike && <ReportActions report={report} />}
                </div>
              </article>
            );
          })}
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
