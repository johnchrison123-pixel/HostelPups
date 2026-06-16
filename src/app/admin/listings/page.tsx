import type { Metadata } from "next";
import Link from "next/link";
import {
  ClipboardList,
  Search,
  Star,
  ExternalLink,
  ArrowLeft,
  ArrowRight,
} from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { buildMetadata } from "@/lib/seo";
import { searchAdminListings, type AdminListingRow } from "@/lib/admin-queries";
import { timeAgo } from "@/lib/utils";
import { CITY_NAMES, LAUNCHED_CITIES } from "@/lib/site";
import { ListingRowActions } from "@/components/admin/ListingRowActions";

export const metadata: Metadata = buildMetadata({
  title: "Listings — Admin",
  description: "Search, filter, and moderate HostelPups listings.",
  path: "/admin/listings",
  noindex: true,
});

export const dynamic = "force-dynamic";

const PAGE_SIZE = 50;

const VALID_STATUSES = [
  "live",
  "pending_review",
  "paused",
  "draft",
  "full",
  "rejected",
] as const;
type ListingStatus = (typeof VALID_STATUSES)[number];

const STATUS_LABELS: Record<ListingStatus, string> = {
  live: "Live",
  pending_review: "Pending review",
  paused: "Paused",
  draft: "Draft",
  full: "Full",
  rejected: "Rejected",
};

const STATUS_TONES: Record<
  ListingStatus,
  "verified" | "warning" | "danger" | "default" | "brand"
> = {
  live: "verified",
  pending_review: "warning",
  paused: "warning",
  draft: "default",
  full: "brand",
  rejected: "danger",
};

interface PageProps {
  searchParams: Promise<Record<string, string | undefined>>;
}

function parseStatus(raw: string | undefined): ListingStatus | undefined {
  if (VALID_STATUSES.includes(raw as ListingStatus)) return raw as ListingStatus;
  return undefined;
}

function parseCity(raw: string | undefined): string | undefined {
  if (!raw) return undefined;
  if ((LAUNCHED_CITIES as readonly string[]).includes(raw)) return raw;
  return undefined;
}

function parsePage(raw: string | undefined): number {
  const n = Number(raw);
  if (!Number.isFinite(n) || n < 1) return 1;
  return Math.floor(n);
}

function buildQuery(
  params: Record<string, string | undefined>,
  overrides: Record<string, string | undefined>,
): string {
  const merged = { ...params, ...overrides };
  const usp = new URLSearchParams();
  Object.entries(merged).forEach(([k, v]) => {
    if (v != null && v !== "") usp.set(k, String(v));
  });
  const qs = usp.toString();
  return qs ? `?${qs}` : "";
}

function isFeatured(row: AdminListingRow): boolean {
  if (!row.is_boosted_until) return false;
  return new Date(row.is_boosted_until) > new Date();
}

/** Quick-filter pill */
function FilterPill({
  label,
  href,
  active,
}: {
  label: string;
  href: string;
  active: boolean;
}) {
  return (
    <Link
      href={href}
      className={[
        "inline-flex items-center h-8 px-3 rounded-full text-xs font-semibold border transition-colors whitespace-nowrap",
        active
          ? "bg-[var(--color-brand-500)] border-[var(--color-brand-500)] text-[var(--color-ink)] shadow-sm"
          : "bg-[var(--color-bg-elevated)] border-[var(--color-border-strong)] text-[var(--color-ink-muted)] hover:border-[var(--color-brand-500)] hover:text-[var(--color-ink)]",
      ].join(" ")}
    >
      {label}
    </Link>
  );
}

export default async function AdminListingsPage({ searchParams }: PageProps) {
  const sp = await searchParams;
  const q = sp.q?.trim() || undefined;
  const city = parseCity(sp.city);
  const status = parseStatus(sp.status);
  const page = parsePage(sp.page);

  const { rows, total } = await searchAdminListings({
    q,
    city,
    status,
    limit: PAGE_SIZE,
    offset: (page - 1) * PAGE_SIZE,
  });

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const hasPrev = page > 1;
  const hasNext = page < totalPages;

  // Params to preserve across pagination / quick-filter links
  const currentParams: Record<string, string | undefined> = {
    q,
    city,
    status,
  };

  // Quick-filter status pills (no "full" or "rejected" — keep it tidy)
  const quickFilters: Array<{ label: string; value: string | undefined }> = [
    { label: "All", value: undefined },
    { label: "Live", value: "live" },
    { label: "Pending review", value: "pending_review" },
    { label: "Paused", value: "paused" },
    { label: "Draft", value: "draft" },
  ];

  return (
    <>
      {/* ── Header ── */}
      <header className="mb-6">
        <div className="flex items-start gap-3">
          <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--color-brand-100)] text-[var(--color-brand-700)] shrink-0">
            <ClipboardList size={22} aria-hidden="true" />
          </span>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-[var(--color-ink-subtle)]">
              Marketplace
            </p>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
              Listings
            </h1>
            <p className="mt-1 text-sm text-[var(--color-ink-muted)]">
              {total.toLocaleString("en-IN")}{" "}
              {total === 1 ? "listing" : "listings"}
              {q && (
                <>
                  {" "}
                  matching{" "}
                  <span className="font-semibold text-[var(--color-ink)]">
                    &ldquo;{q}&rdquo;
                  </span>
                </>
              )}
            </p>
          </div>
        </div>
      </header>

      {/* ── Status quick-filter pills ── */}
      <div className="mb-4 flex flex-wrap gap-2">
        {quickFilters.map(({ label, value }) => (
          <FilterPill
            key={value ?? "__all__"}
            label={label}
            href={`/admin/listings${buildQuery(
              { q, city },
              { status: value, page: undefined },
            )}`}
            active={status === value}
          />
        ))}
      </div>

      {/* ── Filter bar ── */}
      <form
        method="get"
        action="/admin/listings"
        className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-elevated)] p-3 sm:p-4 mb-5"
      >
        <div className="flex flex-col sm:flex-row sm:items-end gap-3">
          {/* Search */}
          <div className="flex-1 min-w-0">
            <label
              htmlFor="filter-q"
              className="block text-xs font-semibold uppercase tracking-wide text-[var(--color-ink-subtle)] mb-1"
            >
              Search
            </label>
            <div className="relative">
              <Search
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-ink-subtle)] pointer-events-none"
                aria-hidden="true"
              />
              <input
                id="filter-q"
                type="search"
                name="q"
                defaultValue={q ?? ""}
                placeholder="Listing title"
                className="w-full h-11 rounded-xl border border-[var(--color-border-strong)] bg-[var(--color-bg)] pl-10 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-brand-500)]"
              />
            </div>
          </div>

          {/* City */}
          <div className="sm:w-44">
            <label
              htmlFor="filter-city"
              className="block text-xs font-semibold uppercase tracking-wide text-[var(--color-ink-subtle)] mb-1"
            >
              City
            </label>
            <select
              id="filter-city"
              name="city"
              defaultValue={city ?? ""}
              className="w-full h-11 rounded-xl border border-[var(--color-border-strong)] bg-[var(--color-bg)] px-3 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-brand-500)]"
            >
              <option value="">All cities</option>
              {LAUNCHED_CITIES.map((c) => (
                <option key={c} value={c}>
                  {CITY_NAMES[c] ?? c}
                </option>
              ))}
            </select>
          </div>

          {/* Status */}
          <div className="sm:w-48">
            <label
              htmlFor="filter-status"
              className="block text-xs font-semibold uppercase tracking-wide text-[var(--color-ink-subtle)] mb-1"
            >
              Status
            </label>
            <select
              id="filter-status"
              name="status"
              defaultValue={status ?? ""}
              className="w-full h-11 rounded-xl border border-[var(--color-border-strong)] bg-[var(--color-bg)] px-3 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-brand-500)]"
            >
              <option value="">All statuses</option>
              {VALID_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {STATUS_LABELS[s]}
                </option>
              ))}
            </select>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 sm:shrink-0">
            <button
              type="submit"
              className="inline-flex items-center justify-center h-11 px-5 rounded-full bg-[var(--color-brand-500)] text-[var(--color-ink)] font-semibold hover:bg-[var(--color-brand-600)] active:bg-[var(--color-brand-700)] shadow-[var(--shadow-md)] transition-all"
            >
              Apply
            </button>
            <Link
              href="/admin/listings"
              className="inline-flex items-center justify-center h-11 px-4 rounded-full text-sm font-semibold text-[var(--color-ink-muted)] hover:bg-[var(--color-surface)] hover:text-[var(--color-ink)] transition-colors"
            >
              Clear
            </Link>
          </div>
        </div>
      </form>

      {/* ── Results ── */}
      {rows.length === 0 ? (
        <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-elevated)] p-10 text-center">
          <span className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--color-surface)] text-[var(--color-ink-subtle)] mx-auto">
            <ClipboardList size={24} aria-hidden="true" />
          </span>
          <h2 className="mt-3 text-base font-bold">No listings found</h2>
          <p className="mt-1 text-sm text-[var(--color-ink-muted)] max-w-md mx-auto">
            {q || city || status
              ? "Try removing filters or broadening your search."
              : "Once owners create listings they'll appear here."}
          </p>
          {(q || city || status) && (
            <Link
              href="/admin/listings"
              className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-[var(--color-brand-700)] hover:underline"
            >
              Clear all filters
            </Link>
          )}
        </div>
      ) : (
        <>
          <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-elevated)] overflow-hidden">
            {/* Desktop table */}
            <div className="hidden lg:block overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-[var(--color-surface)] text-[var(--color-ink-muted)]">
                  <tr className="text-left text-xs font-semibold uppercase tracking-wide">
                    <th className="px-4 py-3 font-semibold">Listing</th>
                    <th className="px-4 py-3 font-semibold">Owner</th>
                    <th className="px-4 py-3 font-semibold">Status</th>
                    <th className="px-4 py-3 font-semibold text-right">
                      Vacancies
                    </th>
                    <th className="px-4 py-3 font-semibold">Featured</th>
                    <th className="px-4 py-3 font-semibold">Updated</th>
                    <th className="px-4 py-3 font-semibold sr-only">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--color-border)]">
                  {rows.map((row: AdminListingRow) => {
                    const featured = isFeatured(row);
                    const listingStatus =
                      VALID_STATUSES.includes(row.status as ListingStatus)
                        ? (row.status as ListingStatus)
                        : undefined;
                    return (
                      <tr
                        key={row.id}
                        className="hover:bg-[var(--color-surface)] transition-colors"
                      >
                        {/* Listing */}
                        <td className="px-4 py-3 max-w-[20rem]">
                          <div className="flex items-start gap-2 min-w-0">
                            <div className="min-w-0 flex-1">
                              <a
                                href={`/pg/${row.city}/${row.slug}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 font-semibold text-[var(--color-ink)] hover:text-[var(--color-brand-700)] hover:underline transition-colors"
                              >
                                <span className="truncate">{row.title}</span>
                                <ExternalLink
                                  size={11}
                                  className="shrink-0 text-[var(--color-ink-subtle)]"
                                  aria-hidden="true"
                                />
                              </a>
                              <p className="text-xs text-[var(--color-ink-muted)] truncate">
                                {row.area
                                  ? `${row.area}, ${CITY_NAMES[row.city] ?? row.city}`
                                  : CITY_NAMES[row.city] ?? row.city}
                              </p>
                            </div>
                          </div>
                        </td>

                        {/* Owner */}
                        <td className="px-4 py-3 max-w-[16rem]">
                          <p className="font-medium truncate">
                            {row.business_name ?? (
                              <span className="italic text-[var(--color-ink-subtle)]">
                                (no business name)
                              </span>
                            )}
                            {/* TODO: show "Banned owner" chip here once is_banned is
                                added to AdminListingRow via searchAdminListings join */}
                          </p>
                          <p className="text-xs text-[var(--color-ink-muted)] truncate">
                            {row.owner_name ?? row.owner_id}
                          </p>
                        </td>

                        {/* Status */}
                        <td className="px-4 py-3">
                          {listingStatus ? (
                            <Badge tone={STATUS_TONES[listingStatus]}>
                              {STATUS_LABELS[listingStatus]}
                            </Badge>
                          ) : (
                            <Badge tone="default">{row.status}</Badge>
                          )}
                        </td>

                        {/* Vacancies */}
                        <td className="px-4 py-3 text-right tabular-nums">
                          {row.total_vacancies == null ? (
                            <span className="text-[var(--color-ink-subtle)]">
                              —
                            </span>
                          ) : (
                            row.total_vacancies
                          )}
                        </td>

                        {/* Featured */}
                        <td className="px-4 py-3">
                          {featured ? (
                            <Badge
                              tone="brand"
                              icon={
                                <Star
                                  size={11}
                                  aria-hidden="true"
                                />
                              }
                            >
                              Featured
                            </Badge>
                          ) : (
                            <span className="text-[var(--color-ink-subtle)] text-xs">
                              —
                            </span>
                          )}
                        </td>

                        {/* Updated */}
                        <td className="px-4 py-3 text-[var(--color-ink-muted)] whitespace-nowrap">
                          {timeAgo(row.updated_at)}
                        </td>

                        {/* Actions */}
                        <td className="px-4 py-3">
                          <ListingRowActions listing={row} />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile cards */}
            <ul
              role="list"
              className="lg:hidden divide-y divide-[var(--color-border)]"
            >
              {rows.map((row: AdminListingRow) => {
                const featured = isFeatured(row);
                const listingStatus = VALID_STATUSES.includes(
                  row.status as ListingStatus,
                )
                  ? (row.status as ListingStatus)
                  : undefined;
                return (
                  <li key={row.id} className="p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <a
                          href={`/pg/${row.city}/${row.slug}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 font-semibold text-[var(--color-ink)] hover:text-[var(--color-brand-700)] hover:underline"
                        >
                          <span className="truncate">{row.title}</span>
                          <ExternalLink
                            size={11}
                            className="shrink-0"
                            aria-hidden="true"
                          />
                        </a>
                        <p className="text-xs text-[var(--color-ink-muted)] truncate">
                          {row.area
                            ? `${row.area}, ${CITY_NAMES[row.city] ?? row.city}`
                            : CITY_NAMES[row.city] ?? row.city}
                        </p>
                        <p className="text-xs text-[var(--color-ink-muted)] truncate mt-0.5">
                          {row.business_name ?? row.owner_name ?? row.owner_id}
                        </p>
                      </div>
                      <div className="flex flex-col items-end gap-1.5 shrink-0">
                        {listingStatus ? (
                          <Badge tone={STATUS_TONES[listingStatus]}>
                            {STATUS_LABELS[listingStatus]}
                          </Badge>
                        ) : (
                          <Badge tone="default">{row.status}</Badge>
                        )}
                        {featured && (
                          <Badge
                            tone="brand"
                            icon={<Star size={11} aria-hidden="true" />}
                          >
                            Featured
                          </Badge>
                        )}
                      </div>
                    </div>
                    <div className="mt-2 flex items-center justify-between gap-3">
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-[var(--color-ink-muted)]">
                        {row.total_vacancies != null && (
                          <span>{row.total_vacancies} vacancies</span>
                        )}
                        <span>updated {timeAgo(row.updated_at)}</span>
                      </div>
                      <ListingRowActions listing={row} />
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>

          {/* Pagination */}
          {Math.ceil(total / PAGE_SIZE) > 1 && (
            <div className="mt-5 flex items-center justify-between gap-3">
              <p className="text-xs text-[var(--color-ink-muted)]">
                Page {page} of {totalPages} &middot;{" "}
                {(page - 1) * PAGE_SIZE + 1}–
                {Math.min(page * PAGE_SIZE, total)} of{" "}
                {total.toLocaleString("en-IN")}
              </p>
              <div className="flex items-center gap-2">
                {hasPrev ? (
                  <Link
                    href={`/admin/listings${buildQuery(currentParams, {
                      page: String(page - 1),
                    })}`}
                    className="inline-flex items-center gap-1.5 h-9 px-3 rounded-full text-sm font-semibold border border-[var(--color-border-strong)] hover:border-[var(--color-brand-500)] hover:bg-[var(--color-brand-50)] transition-colors"
                  >
                    <ArrowLeft size={14} aria-hidden="true" />
                    Prev
                  </Link>
                ) : (
                  <span className="inline-flex items-center gap-1.5 h-9 px-3 rounded-full text-sm font-semibold border border-[var(--color-border)] text-[var(--color-ink-subtle)] opacity-50">
                    <ArrowLeft size={14} aria-hidden="true" />
                    Prev
                  </span>
                )}
                {hasNext ? (
                  <Link
                    href={`/admin/listings${buildQuery(currentParams, {
                      page: String(page + 1),
                    })}`}
                    className="inline-flex items-center gap-1.5 h-9 px-3 rounded-full text-sm font-semibold border border-[var(--color-border-strong)] hover:border-[var(--color-brand-500)] hover:bg-[var(--color-brand-50)] transition-colors"
                  >
                    Next
                    <ArrowRight size={14} aria-hidden="true" />
                  </Link>
                ) : (
                  <span className="inline-flex items-center gap-1.5 h-9 px-3 rounded-full text-sm font-semibold border border-[var(--color-border)] text-[var(--color-ink-subtle)] opacity-50">
                    Next
                    <ArrowRight size={14} aria-hidden="true" />
                  </span>
                )}
              </div>
            </div>
          )}
        </>
      )}
    </>
  );
}
