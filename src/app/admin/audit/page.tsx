import type { Metadata } from "next";
import Link from "next/link";
import { ScrollText, Lock, ShieldCheck } from "lucide-react";
import { buildMetadata } from "@/lib/seo";
import { searchAuditLog } from "@/lib/admin-queries";
import { Badge } from "@/components/ui/Badge";
import { timeAgo } from "@/lib/utils";
import { AuditRowExpand } from "./AuditRowExpand";

export const metadata: Metadata = buildMetadata({
  title: "Audit Log — Admin",
  description: "Immutable log of all admin actions.",
  path: "/admin/audit",
  noindex: true,
});

export const dynamic = "force-dynamic";

const PAGE_SIZE = 100;

/* -----------------------------------------------------------------------
   Action → human-readable label (mirrors the dashboard's AUDIT_LABEL map)
------------------------------------------------------------------------ */
const AUDIT_LABEL: Record<string, string> = {
  ban_user: "Banned user",
  unban_user: "Unbanned user",
  edit_profile: "Edited profile",
  set_role: "Changed user role",
  delete_user: "Deleted user",
  force_logout: "Forced logout",
  approve_kyc: "Approved KYC",
  reject_kyc: "Rejected KYC",
  edit_owner: "Edited owner",
  suspend_owner: "Suspended owner",
  suspend_listing: "Suspended listing",
  restore_listing: "Restored listing",
  feature_listing: "Featured listing",
  unfeature_listing: "Unfeatured listing",
  delete_listing: "Deleted listing",
  close_inquiry: "Closed inquiry",
  reopen_inquiry: "Reopened inquiry",
  delete_message: "Deleted message",
  delete_review: "Deleted review",
  refund_payment: "Refunded payment",
  mark_payment_failed: "Marked payment failed",
  resolve_report: "Resolved report",
  dismiss_report: "Dismissed report",
};

/* Hardcoded action list for the filter dropdown */
const KNOWN_ACTIONS = [
  "ban_user",
  "unban_user",
  "edit_profile",
  "set_role",
  "delete_user",
  "force_logout",
  "approve_kyc",
  "reject_kyc",
  "edit_owner",
  "suspend_owner",
  "suspend_listing",
  "restore_listing",
  "feature_listing",
  "unfeature_listing",
  "delete_listing",
  "close_inquiry",
  "reopen_inquiry",
  "delete_message",
  "delete_review",
  "refund_payment",
  "mark_payment_failed",
  "resolve_report",
  "dismiss_report",
];

const TARGET_TABLES = [
  "profiles",
  "owners",
  "listings",
  "inquiries",
  "messages",
  "reviews",
  "payments",
  "reports",
  "admin_actions",
];

const SINCE_OPTIONS: Array<{ value: string; label: string }> = [
  { value: "24h", label: "24h" },
  { value: "7d", label: "7d" },
  { value: "30d", label: "30d" },
  { value: "", label: "All" },
];

function sinceToISO(since: string): string | undefined {
  const now = Date.now();
  if (since === "24h") return new Date(now - 24 * 60 * 60 * 1000).toISOString();
  if (since === "7d") return new Date(now - 7 * 24 * 60 * 60 * 1000).toISOString();
  if (since === "30d") return new Date(now - 30 * 24 * 60 * 60 * 1000).toISOString();
  return undefined;
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

export default async function AdminAuditPage({ searchParams }: PageProps) {
  const sp = await searchParams;
  const actionRaw = sp.action ?? "";
  const targetTableRaw = sp.target_table ?? "";
  const sinceRaw = sp.since ?? "24h";
  const adminIdRaw = sp.admin_id ?? "";
  const page = Math.max(1, parseInt(sp.page ?? "1", 10));
  const offset = (page - 1) * PAGE_SIZE;

  const sinceISO = sinceToISO(sinceRaw);

  const { rows, total } = await searchAuditLog({
    action: actionRaw || undefined,
    target_table: targetTableRaw || undefined,
    since: sinceISO,
    admin_id: adminIdRaw || undefined,
    limit: PAGE_SIZE,
    offset,
  });

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  function paginationUrl(p: number) {
    return buildUrl("/admin/audit", {
      action: actionRaw || undefined,
      target_table: targetTableRaw || undefined,
      since: sinceRaw || undefined,
      admin_id: adminIdRaw || undefined,
      page: p > 1 ? String(p) : undefined,
    });
  }

  return (
    <>
      <header className="mb-4">
        <div className="flex items-start gap-3">
          <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700 shrink-0">
            <ScrollText size={22} aria-hidden="true" />
          </span>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-[var(--color-ink-subtle)]">
              Admin
            </p>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
              Audit log
            </h1>
            <p className="mt-1 text-sm text-[var(--color-ink-muted)]">
              {total.toLocaleString("en-IN")} entries &mdash; showing up to{" "}
              {PAGE_SIZE} per page
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
          The audit log is immutable per RLS — no UPDATE / DELETE policies
          exist on <code className="font-mono text-xs">admin_actions</code>.
          This view is{" "}
          <strong>read-only</strong>.
        </p>
      </div>

      {/* Filter bar */}
      <form
        action="/admin/audit"
        method="GET"
        className="mb-4 flex flex-wrap items-end gap-3"
      >
        {/* Since pills (hidden inputs swap depending on pill click; keep as links) */}
        <div className="flex gap-2">
          {SINCE_OPTIONS.map((opt) => {
            const active = sinceRaw === opt.value;
            return (
              <Link
                key={opt.value}
                href={buildUrl("/admin/audit", {
                  action: actionRaw || undefined,
                  target_table: targetTableRaw || undefined,
                  since: opt.value || undefined,
                  admin_id: adminIdRaw || undefined,
                  page: undefined,
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

        {/* Action select */}
        <input type="hidden" name="since" value={sinceRaw} />
        <input type="hidden" name="admin_id" value={adminIdRaw} />
        <label className="flex flex-col gap-0.5">
          <span className="text-xs font-medium text-[var(--color-ink-muted)]">
            Action
          </span>
          <select
            name="action"
            defaultValue={actionRaw}
            className="rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-elevated)] px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-brand-500)]"
          >
            <option value="">All actions</option>
            {KNOWN_ACTIONS.map((a) => (
              <option key={a} value={a}>
                {AUDIT_LABEL[a] ?? a}
              </option>
            ))}
          </select>
        </label>

        {/* Target table select */}
        <label className="flex flex-col gap-0.5">
          <span className="text-xs font-medium text-[var(--color-ink-muted)]">
            Table
          </span>
          <select
            name="target_table"
            defaultValue={targetTableRaw}
            className="rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-elevated)] px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-brand-500)]"
          >
            <option value="">All tables</option>
            {TARGET_TABLES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </label>

        <button
          type="submit"
          className="rounded-full border border-[var(--color-border)] bg-[var(--color-bg-elevated)] px-4 py-1.5 text-sm font-semibold hover:border-[var(--color-brand-400)] transition-colors"
        >
          Apply
        </button>
      </form>

      {/* Table */}
      {rows.length === 0 ? (
        <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-elevated)] p-12 text-center">
          <ShieldCheck
            size={24}
            className="mx-auto text-[var(--color-ink-subtle)]"
            aria-hidden="true"
          />
          <p className="mt-3 font-semibold">No audit entries found</p>
          <p className="mt-1 text-sm text-[var(--color-ink-muted)]">
            Try a different time window or filter.
          </p>
        </div>
      ) : (
        <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-elevated)] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--color-border)] bg-[var(--color-surface)]">
                  <th className="px-4 py-3 text-left font-semibold text-[var(--color-ink-muted)] text-xs uppercase tracking-wide">
                    When
                  </th>
                  <th className="px-4 py-3 text-left font-semibold text-[var(--color-ink-muted)] text-xs uppercase tracking-wide">
                    Admin
                  </th>
                  <th className="px-4 py-3 text-left font-semibold text-[var(--color-ink-muted)] text-xs uppercase tracking-wide">
                    Action
                  </th>
                  <th className="px-4 py-3 text-left font-semibold text-[var(--color-ink-muted)] text-xs uppercase tracking-wide">
                    Target
                  </th>
                  <th className="px-4 py-3 text-left font-semibold text-[var(--color-ink-muted)] text-xs uppercase tracking-wide">
                    Reason
                  </th>
                  <th className="px-4 py-3 text-left font-semibold text-[var(--color-ink-muted)] text-xs uppercase tracking-wide">
                    IP
                  </th>
                  <th className="px-4 py-3 text-left font-semibold text-[var(--color-ink-muted)] text-xs uppercase tracking-wide">
                    Detail
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--color-border)]">
                {rows.map((row) => (
                  <tr
                    key={row.id}
                    className="hover:bg-[var(--color-surface)] transition-colors"
                  >
                    <td className="px-4 py-3 text-[var(--color-ink-muted)] whitespace-nowrap text-xs">
                      {timeAgo(row.created_at)}
                    </td>
                    <td className="px-4 py-3 font-medium whitespace-nowrap">
                      {row.admin_name ?? (
                        <span className="text-[var(--color-ink-subtle)] italic font-mono text-xs">
                          {row.admin_id.slice(0, 8)}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <Badge tone="default">
                        {AUDIT_LABEL[row.action] ?? row.action}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-xs font-mono text-[var(--color-ink-muted)]">
                      {row.target_table && (
                        <span className="font-semibold text-[var(--color-ink)]">
                          {row.target_table}
                        </span>
                      )}
                      {row.target_id && (
                        <>
                          {" "}
                          <span>#{row.target_id.slice(0, 8)}</span>
                        </>
                      )}
                      {!row.target_table && !row.target_id && (
                        <span className="text-[var(--color-ink-subtle)]">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-[var(--color-ink-muted)] max-w-[180px] truncate text-xs">
                      {row.reason ?? (
                        <span className="text-[var(--color-ink-subtle)]">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-xs font-mono text-[var(--color-ink-subtle)]">
                      {row.ip_address ?? "—"}
                    </td>
                    <td className="px-4 py-3">
                      <AuditRowExpand before={row.before} after={row.after} />
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
