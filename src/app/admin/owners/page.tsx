import type { Metadata } from "next";
import Link from "next/link";
import {
  Building2,
  Search,
  ShieldCheck,
  ShieldX,
  ArrowLeft,
  ArrowRight,
  Calendar,
} from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { buildMetadata } from "@/lib/seo";
import { searchOwners, type AdminOwnerRow } from "@/lib/admin-queries";
import { timeAgo } from "@/lib/utils";

export const dynamic = "force-dynamic";

export const metadata: Metadata = buildMetadata({
  title: "Owners — Admin",
  description: "HostelPups admin: owner CRM with KYC review queue.",
  path: "/admin/owners",
  noindex: true,
});

const PAGE_SIZE = 50;

type KycStatusFilter = "not_submitted" | "pending" | "verified" | "rejected";
const KYC_VALUES: KycStatusFilter[] = [
  "not_submitted",
  "pending",
  "verified",
  "rejected",
];

const TIER_OPTIONS: Array<{ value: string; label: string }> = [
  { value: "", label: "All tiers" },
  { value: "self_serve", label: "Self-serve" },
  { value: "full_service", label: "Full service" },
];

interface QuickFilter {
  key: KycStatusFilter | null;
  label: string;
}

const QUICK_FILTERS: QuickFilter[] = [
  { key: null, label: "All" },
  { key: "pending", label: "Pending" },
  { key: "verified", label: "Verified" },
  { key: "rejected", label: "Rejected" },
  { key: "not_submitted", label: "Not submitted" },
];

function kycBadge(status: string): {
  tone: "default" | "brand" | "verified" | "warning" | "danger";
  label: string;
} {
  switch (status) {
    case "verified":
      return { tone: "verified", label: "Verified" };
    case "pending":
      return { tone: "warning", label: "Pending" };
    case "rejected":
      return { tone: "danger", label: "Rejected" };
    case "not_submitted":
    default:
      return { tone: "default", label: "Not submitted" };
  }
}

function tierLabel(tier: string | null): string {
  if (tier === "self_serve") return "Self-serve";
  if (tier === "full_service") return "Full service";
  return "—";
}

interface Props {
  searchParams: Promise<Record<string, string | undefined>>;
}

export default async function AdminOwnersPage({ searchParams }: Props) {
  const sp = await searchParams;
  const q = sp.q?.trim() || undefined;
  const tier = sp.tier?.trim() || undefined;
  const kycRaw = sp.kyc_status;
  const kyc_status =
    kycRaw && (KYC_VALUES as string[]).includes(kycRaw)
      ? (kycRaw as KycStatusFilter)
      : undefined;
  const page = Math.max(1, Number(sp.page ?? "1") || 1);
  const offset = (page - 1) * PAGE_SIZE;

  const { rows, total } = await searchOwners({
    q,
    kyc_status,
    tier,
    limit: PAGE_SIZE,
    offset,
  });

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  function buildHref(overrides: Record<string, string | undefined>) {
    const next = new URLSearchParams();
    const merged: Record<string, string | undefined> = {
      q,
      kyc_status,
      tier,
      page: page > 1 ? String(page) : undefined,
      ...overrides,
    };
    Object.entries(merged).forEach(([k, v]) => {
      if (v && v !== "") next.set(k, v);
    });
    const qs = next.toString();
    return qs ? `/admin/owners?${qs}` : "/admin/owners";
  }

  return (
    <>
      <header className="mb-5">
        <div className="flex items-start gap-3">
          <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--color-brand-100)] text-[var(--color-brand-700)] shrink-0">
            <Building2 size={22} aria-hidden="true" />
          </span>
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-wider text-[var(--color-ink-subtle)]">
              CRM
            </p>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
              Owners
            </h1>
            <p className="mt-1 text-sm text-[var(--color-ink-muted)]">
              {total.toLocaleString("en-IN")}{" "}
              {total === 1 ? "owner" : "owners"} total
              {kyc_status ? ` · filtered by ${kyc_status.replace("_", " ")}` : ""}
              {tier ? ` · tier ${tierLabel(tier)}` : ""}
            </p>
          </div>
        </div>
      </header>

      {/* Quick-filter pills for KYC status */}
      <nav
        aria-label="KYC status quick filter"
        className="mb-4 flex flex-wrap gap-2"
      >
        {QUICK_FILTERS.map((f) => {
          const isActive =
            (f.key === null && !kyc_status) || f.key === kyc_status;
          return (
            <Link
              key={f.label}
              href={buildHref({ kyc_status: f.key ?? undefined, page: undefined })}
              aria-current={isActive ? "true" : undefined}
              className={
                isActive
                  ? "inline-flex items-center gap-1.5 rounded-full bg-[var(--color-brand-100)] border border-[var(--color-brand-500)] px-3 py-1.5 text-xs font-semibold text-[var(--color-brand-900)]"
                  : "inline-flex items-center gap-1.5 rounded-full bg-[var(--color-bg-elevated)] border border-[var(--color-border)] px-3 py-1.5 text-xs font-medium text-[var(--color-ink-muted)] hover:border-[var(--color-brand-500)] hover:text-[var(--color-ink)] transition-colors"
              }
            >
              {f.key === "verified" && (
                <ShieldCheck size={12} aria-hidden="true" />
              )}
              {f.key === "rejected" && <ShieldX size={12} aria-hidden="true" />}
              {f.label}
            </Link>
          );
        })}
      </nav>

      {/* Filter bar */}
      <form
        action="/admin/owners"
        method="get"
        className="mb-5 rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-elevated)] p-3 sm:p-4 flex flex-col sm:flex-row gap-3 sm:items-end"
      >
        {/* Preserve the current kyc_status / tier when only the search box is submitted */}
        {kyc_status && (
          <input type="hidden" name="kyc_status" value={kyc_status} />
        )}
        <div className="flex-1 min-w-0">
          <label
            htmlFor="owners-search"
            className="block text-xs font-semibold mb-1.5"
          >
            Search by business name
          </label>
          <div className="relative">
            <Search
              size={14}
              aria-hidden="true"
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-ink-subtle)]"
            />
            <input
              id="owners-search"
              name="q"
              type="search"
              defaultValue={q ?? ""}
              placeholder="e.g. Sunshine PG"
              autoComplete="off"
              className="w-full rounded-xl border border-[var(--color-border-strong)] bg-[var(--color-bg)] pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-brand-500)]"
            />
          </div>
        </div>
        <div className="sm:w-48">
          <label
            htmlFor="owners-tier"
            className="block text-xs font-semibold mb-1.5"
          >
            Tier
          </label>
          <select
            id="owners-tier"
            name="tier"
            defaultValue={tier ?? ""}
            className="w-full rounded-xl border border-[var(--color-border-strong)] bg-[var(--color-bg)] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-brand-500)]"
          >
            {TIER_OPTIONS.map((opt) => (
              <option key={opt.value || "any"} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
        <div className="flex gap-2">
          <Button variant="primary" size="sm" type="submit">
            <Search size={14} aria-hidden="true" />
            Apply
          </Button>
          {(q || tier) && (
            <Button
              variant="ghost"
              size="sm"
              href={buildHref({ q: undefined, tier: undefined, page: undefined })}
            >
              Reset
            </Button>
          )}
        </div>
      </form>

      {/* Table */}
      {rows.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-elevated)] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-[var(--color-surface)] text-left text-xs font-semibold uppercase tracking-wide text-[var(--color-ink-subtle)]">
                  <th className="px-4 py-3">Business</th>
                  <th className="px-4 py-3">KYC</th>
                  <th className="px-4 py-3">Tier</th>
                  <th className="px-4 py-3 text-right">Listings</th>
                  <th className="px-4 py-3 text-right">Inquiries</th>
                  <th className="px-4 py-3">Registered</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--color-border)]">
                {rows.map((row) => (
                  <OwnerRow key={row.id} row={row} />
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <nav
          aria-label="Pagination"
          className="mt-5 flex items-center justify-between gap-3 text-sm"
        >
          <div className="text-xs text-[var(--color-ink-muted)]">
            Page <span className="font-semibold">{page}</span> of{" "}
            <span className="font-semibold">{totalPages}</span> · showing{" "}
            {rows.length} of {total.toLocaleString("en-IN")}
          </div>
          <div className="flex gap-2">
            {page > 1 && (
              <Button
                variant="outline"
                size="sm"
                href={buildHref({
                  page: page - 1 > 1 ? String(page - 1) : undefined,
                })}
              >
                <ArrowLeft size={14} aria-hidden="true" />
                Prev
              </Button>
            )}
            {page < totalPages && (
              <Button
                variant="outline"
                size="sm"
                href={buildHref({ page: String(page + 1) })}
              >
                Next
                <ArrowRight size={14} aria-hidden="true" />
              </Button>
            )}
          </div>
        </nav>
      )}
    </>
  );
}

function OwnerRow({ row }: { row: AdminOwnerRow }) {
  const kyc = kycBadge(row.kyc_status);
  const businessName =
    row.business_name && row.business_name.trim().length > 0
      ? row.business_name
      : "(unnamed business)";
  return (
    <tr
      className={
        row.is_banned
          ? "bg-red-50/60 hover:bg-red-50 transition-colors"
          : "hover:bg-[var(--color-surface)] transition-colors"
      }
    >
      <td className="px-4 py-3 align-top">
        <Link
          href={`/admin/owners/${row.id}`}
          className="font-semibold text-[var(--color-ink)] hover:text-[var(--color-brand-700)] hover:underline"
        >
          {businessName}
        </Link>
        <div className="mt-0.5 flex flex-wrap items-center gap-2 text-xs text-[var(--color-ink-muted)]">
          <span className="truncate max-w-[14ch]">
            {row.name ?? "(no profile name)"}
          </span>
          {row.has_verification_badge && (
            <Badge tone="verified" icon={<ShieldCheck size={10} aria-hidden="true" />}>
              Badge
            </Badge>
          )}
          {row.is_banned && <Badge tone="danger">Banned</Badge>}
        </div>
      </td>
      <td className="px-4 py-3 align-top">
        <Badge tone={kyc.tone}>{kyc.label}</Badge>
      </td>
      <td className="px-4 py-3 align-top text-[var(--color-ink-muted)]">
        {tierLabel(row.tier)}
      </td>
      <td className="px-4 py-3 align-top text-right font-mono">
        {row.listing_count}
      </td>
      <td className="px-4 py-3 align-top text-right font-mono">
        {row.inquiry_count}
      </td>
      <td className="px-4 py-3 align-top text-xs text-[var(--color-ink-muted)]">
        {row.registered_at ? (
          <span className="inline-flex items-center gap-1">
            <Calendar size={11} aria-hidden="true" />
            {timeAgo(row.registered_at)}
          </span>
        ) : (
          "—"
        )}
      </td>
    </tr>
  );
}

function EmptyState() {
  return (
    <div className="rounded-2xl border border-dashed border-[var(--color-border-strong)] bg-[var(--color-surface)] p-8 text-center">
      <Building2
        size={24}
        className="mx-auto text-[var(--color-ink-subtle)]"
        aria-hidden="true"
      />
      <p className="mt-3 text-sm font-semibold">No owners match these filters</p>
      <p className="mt-1 text-xs text-[var(--color-ink-muted)]">
        Try clearing the search box or quick-filter pill above.
      </p>
    </div>
  );
}
