import type { Metadata } from "next";
import Link from "next/link";
import { MessageSquare, ExternalLink } from "lucide-react";
import { buildMetadata } from "@/lib/seo";
import { searchInquiries } from "@/lib/admin-queries";
import { Badge } from "@/components/ui/Badge";
import { timeAgo } from "@/lib/utils";
import { InquiryRowActions } from "./InquiryRowActions";

export const metadata: Metadata = buildMetadata({
  title: "Inquiries — Admin",
  description: "Admin view of all renter inquiries.",
  path: "/admin/inquiries",
  noindex: true,
});

export const dynamic = "force-dynamic";

const PAGE_SIZE = 50;

type StatusFilter = "open" | "responded" | "closed";

function statusBadgeTone(status: string): "warning" | "verified" | "default" {
  if (status === "open") return "warning";
  if (status === "responded") return "verified";
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

const STATUS_LABELS: Record<string, string> = {
  open: "Open",
  responded: "Responded",
  closed: "Closed",
};

const STATUS_PILLS: Array<{ value: StatusFilter | ""; label: string }> = [
  { value: "", label: "All" },
  { value: "open", label: "Open" },
  { value: "responded", label: "Responded" },
  { value: "closed", label: "Closed" },
];

interface PageProps {
  searchParams: Promise<Record<string, string | undefined>>;
}

export default async function AdminInquiriesPage({ searchParams }: PageProps) {
  const sp = await searchParams;
  const statusRaw = sp.status ?? "";
  const status = (["open", "responded", "closed"].includes(statusRaw)
    ? (statusRaw as StatusFilter)
    : undefined);
  const page = Math.max(1, parseInt(sp.page ?? "1", 10));
  const offset = (page - 1) * PAGE_SIZE;

  const { rows, total } = await searchInquiries({
    status,
    limit: PAGE_SIZE,
    offset,
  });

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  function paginationUrl(p: number) {
    return buildUrl("/admin/inquiries", {
      status: statusRaw || undefined,
      page: p > 1 ? String(p) : undefined,
    });
  }

  function filterUrl(newStatus: string) {
    return buildUrl("/admin/inquiries", {
      status: newStatus || undefined,
      page: undefined,
    });
  }

  return (
    <>
      <header className="mb-6">
        <div className="flex items-start gap-3">
          <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-sky-50 text-sky-700 shrink-0">
            <MessageSquare size={22} aria-hidden="true" />
          </span>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-[var(--color-ink-subtle)]">
              Admin
            </p>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
              Inquiries
            </h1>
            <p className="mt-1 text-sm text-[var(--color-ink-muted)]">
              {total.toLocaleString("en-IN")} total &mdash; renter ↔ owner
              conversations
            </p>
          </div>
        </div>
      </header>

      {/* Status quick-filter pills */}
      <div className="flex flex-wrap gap-2 mb-4">
        {STATUS_PILLS.map((pill) => {
          const active = (statusRaw ?? "") === pill.value;
          return (
            <Link
              key={pill.value}
              href={filterUrl(pill.value)}
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

      {/* Table */}
      {rows.length === 0 ? (
        <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-elevated)] p-12 text-center">
          <MessageSquare
            size={24}
            className="mx-auto text-[var(--color-ink-subtle)]"
            aria-hidden="true"
          />
          <p className="mt-3 font-semibold">No inquiries found</p>
          <p className="mt-1 text-sm text-[var(--color-ink-muted)]">
            Try a different status filter.
          </p>
        </div>
      ) : (
        <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-elevated)] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--color-border)] bg-[var(--color-surface)]">
                  <th className="px-4 py-3 text-left font-semibold text-[var(--color-ink-muted)] text-xs uppercase tracking-wide">
                    Renter
                  </th>
                  <th className="px-4 py-3 text-left font-semibold text-[var(--color-ink-muted)] text-xs uppercase tracking-wide">
                    Listing / City
                  </th>
                  <th className="px-4 py-3 text-left font-semibold text-[var(--color-ink-muted)] text-xs uppercase tracking-wide">
                    Owner
                  </th>
                  <th className="px-4 py-3 text-left font-semibold text-[var(--color-ink-muted)] text-xs uppercase tracking-wide">
                    Status
                  </th>
                  <th className="px-4 py-3 text-right font-semibold text-[var(--color-ink-muted)] text-xs uppercase tracking-wide">
                    Msgs
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
                      <span className="font-medium">
                        {row.user_name ?? (
                          <span className="text-[var(--color-ink-subtle)] italic">
                            Unknown
                          </span>
                        )}
                      </span>
                    </td>
                    <td className="px-4 py-3 max-w-[200px]">
                      <p className="truncate font-medium">
                        {row.listing_title ?? (
                          <span className="text-[var(--color-ink-subtle)] italic">
                            Deleted listing
                          </span>
                        )}
                      </p>
                      {row.city && (
                        <p className="text-xs text-[var(--color-ink-muted)] capitalize">
                          {row.city}
                        </p>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-[var(--color-ink-muted)]">
                        {row.business_name ?? "—"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <Badge tone={statusBadgeTone(row.status)}>
                        {STATUS_LABELS[row.status] ?? row.status}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums text-[var(--color-ink-muted)]">
                      {row.message_count}
                    </td>
                    <td className="px-4 py-3 text-[var(--color-ink-muted)] whitespace-nowrap">
                      {timeAgo(row.created_at)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Link
                          href={`/owner/inquiries/${row.id}`}
                          className="inline-flex items-center gap-1 text-xs font-semibold text-[var(--color-brand-700)] hover:underline"
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          Open chat
                          <ExternalLink size={11} aria-hidden="true" />
                        </Link>
                        <InquiryRowActions
                          inquiryId={row.id}
                          status={row.status as "open" | "responded" | "closed"}
                        />
                      </div>
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
