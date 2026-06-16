import type { Metadata } from "next";
import Link from "next/link";
import { CreditCard, AlertTriangle } from "lucide-react";
import { buildMetadata } from "@/lib/seo";
import { searchAdminPayments } from "@/lib/admin-queries";
import type { AdminPaymentRow } from "@/lib/admin-queries";
import { Badge } from "@/components/ui/Badge";
import { timeAgo } from "@/lib/utils";
import { PaymentRowActions } from "./PaymentRowActions";

export const metadata: Metadata = buildMetadata({
  title: "Payments — Admin",
  description: "Admin supervisory view of all payments.",
  path: "/admin/payments",
  noindex: true,
});

export const dynamic = "force-dynamic";

const PAGE_SIZE = 50;

const INR = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

type PaymentStatus = "pending" | "completed" | "failed" | "refunded";

const STATUS_PILLS: Array<{ value: PaymentStatus | ""; label: string }> = [
  { value: "", label: "All" },
  { value: "pending", label: "Pending" },
  { value: "completed", label: "Completed" },
  { value: "failed", label: "Failed" },
  { value: "refunded", label: "Refunded" },
];

const SINCE_OPTIONS: Array<{ value: string; label: string }> = [
  { value: "24h", label: "24h" },
  { value: "7d", label: "7d" },
  { value: "30d", label: "30d" },
  { value: "", label: "All time" },
];

function sinceToISO(since: string): string | undefined {
  const now = Date.now();
  if (since === "24h") return new Date(now - 24 * 60 * 60 * 1000).toISOString();
  if (since === "7d") return new Date(now - 7 * 24 * 60 * 60 * 1000).toISOString();
  if (since === "30d") return new Date(now - 30 * 24 * 60 * 60 * 1000).toISOString();
  return undefined;
}

function paymentStatusTone(
  status: string,
): "verified" | "warning" | "danger" | "default" {
  if (status === "completed") return "verified";
  if (status === "pending") return "warning";
  if (status === "refunded") return "warning";
  if (status === "failed") return "danger";
  return "default";
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

function pageRevenue(rows: AdminPaymentRow[]): number {
  return rows
    .filter((r) => r.status === "completed" && (r.currency ?? "INR") === "INR")
    .reduce((sum, r) => sum + r.amount, 0);
}

interface PageProps {
  searchParams: Promise<Record<string, string | undefined>>;
}

export default async function AdminPaymentsPage({ searchParams }: PageProps) {
  const sp = await searchParams;
  const statusRaw = sp.status ?? "";
  const purposeRaw = sp.purpose ?? "";
  const sinceRaw = sp.since ?? "";
  const page = Math.max(1, parseInt(sp.page ?? "1", 10));
  const offset = (page - 1) * PAGE_SIZE;

  const status = ["pending", "completed", "failed", "refunded"].includes(
    statusRaw,
  )
    ? (statusRaw as PaymentStatus)
    : undefined;
  const sinceISO = sinceToISO(sinceRaw);

  const { rows, total } = await searchAdminPayments({
    status,
    purpose: purposeRaw || undefined,
    since: sinceISO,
    limit: PAGE_SIZE,
    offset,
  });

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const completedRevenue = pageRevenue(rows);

  function filterUrl(params: Partial<Record<string, string>>) {
    return buildUrl("/admin/payments", {
      status: (params.status ?? statusRaw) || undefined,
      purpose: (params.purpose ?? purposeRaw) || undefined,
      since: (params.since ?? sinceRaw) || undefined,
      page: undefined,
    });
  }

  function paginationUrl(p: number) {
    return buildUrl("/admin/payments", {
      status: statusRaw || undefined,
      purpose: purposeRaw || undefined,
      since: sinceRaw || undefined,
      page: p > 1 ? String(p) : undefined,
    });
  }

  return (
    <>
      <header className="mb-4">
        <div className="flex items-start gap-3">
          <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700 shrink-0">
            <CreditCard size={22} aria-hidden="true" />
          </span>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-[var(--color-ink-subtle)]">
              Admin
            </p>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
              Payments
            </h1>
            <p className="mt-1 text-sm text-[var(--color-ink-muted)]">
              {total.toLocaleString("en-IN")} records in view
            </p>
          </div>
        </div>
      </header>

      {/* Mock refund warning */}
      <div className="mb-4 flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50/80 px-4 py-3">
        <AlertTriangle
          size={16}
          className="text-amber-700 mt-0.5 shrink-0"
          aria-hidden="true"
        />
        <p className="text-sm text-amber-900">
          <strong>Note:</strong> Razorpay refund is currently mock — flips DB
          status only. Wire the Razorpay refund API when keys are added.
        </p>
      </div>

      {/* Revenue strip */}
      <div className="mb-4 rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-elevated)] px-5 py-4 flex items-center justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-[var(--color-ink-muted)]">
            Completed revenue (this page, INR)
          </p>
          <p className="mt-1 text-2xl font-black tracking-tight">
            {INR.format(completedRevenue)}
          </p>
        </div>
        <CreditCard
          size={20}
          className="text-emerald-600 shrink-0"
          aria-hidden="true"
        />
      </div>

      {/* Status quick-filter pills */}
      <div className="flex flex-wrap gap-2 mb-3">
        {STATUS_PILLS.map((pill) => {
          const active = statusRaw === pill.value;
          return (
            <Link
              key={pill.value}
              href={filterUrl({ status: pill.value })}
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

      {/* Since pills */}
      <div className="flex flex-wrap gap-2 mb-4">
        {SINCE_OPTIONS.map((opt) => {
          const active = sinceRaw === opt.value;
          return (
            <Link
              key={opt.value}
              href={filterUrl({ since: opt.value })}
              className={[
                "inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold transition-colors",
                active
                  ? "bg-[var(--color-ink)] border-[var(--color-ink)] text-[var(--color-bg)]"
                  : "bg-[var(--color-bg-elevated)] border-[var(--color-border)] text-[var(--color-ink-muted)] hover:border-[var(--color-brand-400)]",
              ].join(" ")}
            >
              {opt.label}
            </Link>
          );
        })}
      </div>

      {/* Table */}
      {rows.length === 0 ? (
        <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-elevated)] p-12 text-center">
          <CreditCard
            size={24}
            className="mx-auto text-[var(--color-ink-subtle)]"
            aria-hidden="true"
          />
          <p className="mt-3 font-semibold">No payments found</p>
          <p className="mt-1 text-sm text-[var(--color-ink-muted)]">
            Try different filters.
          </p>
        </div>
      ) : (
        <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-elevated)] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--color-border)] bg-[var(--color-surface)]">
                  <th className="px-4 py-3 text-left font-semibold text-[var(--color-ink-muted)] text-xs uppercase tracking-wide">
                    User
                  </th>
                  <th className="px-4 py-3 text-left font-semibold text-[var(--color-ink-muted)] text-xs uppercase tracking-wide">
                    Owner
                  </th>
                  <th className="px-4 py-3 text-right font-semibold text-[var(--color-ink-muted)] text-xs uppercase tracking-wide">
                    Amount
                  </th>
                  <th className="px-4 py-3 text-left font-semibold text-[var(--color-ink-muted)] text-xs uppercase tracking-wide">
                    Purpose
                  </th>
                  <th className="px-4 py-3 text-left font-semibold text-[var(--color-ink-muted)] text-xs uppercase tracking-wide">
                    Status
                  </th>
                  <th className="px-4 py-3 text-left font-semibold text-[var(--color-ink-muted)] text-xs uppercase tracking-wide">
                    Razorpay ID
                  </th>
                  <th className="px-4 py-3 text-left font-semibold text-[var(--color-ink-muted)] text-xs uppercase tracking-wide">
                    Created
                  </th>
                  <th className="px-4 py-3 text-left font-semibold text-[var(--color-ink-muted)] text-xs uppercase tracking-wide">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--color-border)]">
                {rows.map((row) => (
                  <tr
                    key={row.id}
                    className="hover:bg-[var(--color-surface)] transition-colors"
                  >
                    <td className="px-4 py-3">
                      <p className="font-medium">
                        {row.user_name ?? (
                          <span className="text-[var(--color-ink-subtle)] italic">
                            Unknown
                          </span>
                        )}
                      </p>
                      {row.user_email && (
                        <p className="text-xs text-[var(--color-ink-muted)] truncate max-w-[160px]">
                          {row.user_email}
                        </p>
                      )}
                    </td>
                    <td className="px-4 py-3 text-[var(--color-ink-muted)]">
                      {row.business_name ?? "—"}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums font-semibold">
                      {INR.format(row.amount)}
                    </td>
                    <td className="px-4 py-3 text-[var(--color-ink-muted)] capitalize">
                      {row.purpose.replace(/_/g, " ")}
                    </td>
                    <td className="px-4 py-3">
                      <Badge tone={paymentStatusTone(row.status)}>
                        {row.status.charAt(0).toUpperCase() +
                          row.status.slice(1)}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-[var(--color-ink-muted)]">
                      {row.razorpay_payment_id
                        ? row.razorpay_payment_id.slice(0, 12)
                        : "—"}
                    </td>
                    <td className="px-4 py-3 text-[var(--color-ink-muted)] whitespace-nowrap">
                      {timeAgo(row.created_at)}
                    </td>
                    <td className="px-4 py-3">
                      <PaymentRowActions
                        paymentId={row.id}
                        status={row.status as PaymentStatus}
                      />
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
