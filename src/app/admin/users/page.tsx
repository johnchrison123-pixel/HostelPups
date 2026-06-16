import type { Metadata } from "next";
import Link from "next/link";
import {
  Users,
  Search,
  Ban,
  Check,
  ArrowLeft,
  ArrowRight,
  ShieldCheck,
} from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { buildMetadata } from "@/lib/seo";
import { searchUsers, type AdminUserRow } from "@/lib/admin-queries";
import { timeAgo } from "@/lib/utils";

export const metadata: Metadata = buildMetadata({
  title: "Users — Admin",
  description: "Search, filter, and manage HostelPups users.",
  path: "/admin/users",
  noindex: true,
});

export const dynamic = "force-dynamic";

const PAGE_SIZE = 50;

interface PageProps {
  searchParams: Promise<Record<string, string | undefined>>;
}

function parseRole(raw: string | undefined): "user" | "owner" | "admin" | undefined {
  if (raw === "user" || raw === "owner" || raw === "admin") return raw;
  return undefined;
}

function parsePage(raw: string | undefined): number {
  const n = Number(raw);
  if (!Number.isFinite(n) || n < 1) return 1;
  const floored = Math.floor(n);
  if (!Number.isInteger(floored) || floored < 1 || floored > 100000) return 1;
  return floored;
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

function roleTone(role: string): "brand" | "verified" | "default" {
  if (role === "admin") return "verified";
  if (role === "owner") return "brand";
  return "default";
}

export default async function AdminUsersPage({ searchParams }: PageProps) {
  const sp = await searchParams;
  const q = sp.q?.trim() || undefined;
  const role = parseRole(sp.role);
  const bannedFlag = sp.banned === "1";
  const page = parsePage(sp.page);

  const { rows, total } = await searchUsers({
    q,
    role,
    banned: bannedFlag ? true : undefined,
    limit: PAGE_SIZE,
    offset: (page - 1) * PAGE_SIZE,
  });

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const hasPrev = page > 1;
  const hasNext = page < totalPages;

  // Echo current filter params so pagination preserves them.
  const currentParams: Record<string, string | undefined> = {
    q,
    role,
    banned: bannedFlag ? "1" : undefined,
  };

  return (
    <>
      <header className="mb-6">
        <div className="flex items-start gap-3">
          <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--color-brand-100)] text-[var(--color-brand-700)] shrink-0">
            <Users size={22} aria-hidden="true" />
          </span>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-[var(--color-ink-subtle)]">
              CRM
            </p>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
              Users
            </h1>
            <p className="mt-1 text-sm text-[var(--color-ink-muted)]">
              {total.toLocaleString("en-IN")}{" "}
              {total === 1 ? "user" : "users"}
              {q ? (
                <>
                  {" "}
                  matching{" "}
                  <span className="font-semibold text-[var(--color-ink)]">
                    &ldquo;{q}&rdquo;
                  </span>
                </>
              ) : null}
            </p>
          </div>
        </div>
      </header>

      {/* Filter bar — plain GET form, no client component needed */}
      <form
        method="get"
        action="/admin/users"
        className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-elevated)] p-3 sm:p-4 mb-5"
      >
        <div className="flex flex-col sm:flex-row sm:items-end gap-3">
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
                placeholder="Name, email, or phone"
                className="w-full h-11 rounded-xl border border-[var(--color-border-strong)] bg-[var(--color-bg)] pl-10 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-brand-500)]"
              />
            </div>
          </div>

          <div className="sm:w-44">
            <label
              htmlFor="filter-role"
              className="block text-xs font-semibold uppercase tracking-wide text-[var(--color-ink-subtle)] mb-1"
            >
              Role
            </label>
            <select
              id="filter-role"
              name="role"
              defaultValue={role ?? ""}
              className="w-full h-11 rounded-xl border border-[var(--color-border-strong)] bg-[var(--color-bg)] px-3 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-brand-500)]"
            >
              <option value="">All roles</option>
              <option value="user">User</option>
              <option value="owner">Owner</option>
              <option value="admin">Admin</option>
            </select>
          </div>

          <label className="inline-flex items-center gap-2 px-3 h-11 rounded-xl border border-[var(--color-border-strong)] bg-[var(--color-bg)] text-sm cursor-pointer select-none">
            <input
              type="checkbox"
              name="banned"
              value="1"
              defaultChecked={bannedFlag}
              className="h-4 w-4 rounded border-[var(--color-border-strong)] text-[var(--color-brand-500)] focus:ring-2 focus:ring-[var(--color-brand-500)]"
            />
            <span className="font-medium">Banned only</span>
          </label>

          <div className="flex items-center gap-2 sm:shrink-0">
            <button
              type="submit"
              className="inline-flex items-center justify-center h-11 px-5 rounded-full bg-[var(--color-brand-500)] text-[var(--color-ink)] font-semibold hover:bg-[var(--color-brand-600)] active:bg-[var(--color-brand-700)] shadow-[var(--shadow-md)] transition-all"
            >
              Apply
            </button>
            <Link
              href="/admin/users"
              className="inline-flex items-center justify-center h-11 px-4 rounded-full text-sm font-semibold text-[var(--color-ink-muted)] hover:bg-[var(--color-surface)] hover:text-[var(--color-ink)] transition-colors"
            >
              Clear
            </Link>
          </div>
        </div>
      </form>

      {/* Results */}
      {rows.length === 0 ? (
        <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-elevated)] p-10 text-center">
          <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--color-surface)] text-[var(--color-ink-subtle)] mx-auto">
            <Search size={20} aria-hidden="true" />
          </span>
          <h2 className="mt-3 text-base font-bold">No users found</h2>
          <p className="mt-1 text-sm text-[var(--color-ink-muted)] max-w-md mx-auto">
            {q || role || bannedFlag
              ? "Try removing filters or broadening your search."
              : "Once people sign up they'll appear here."}
          </p>
          {(q || role || bannedFlag) && (
            <Link
              href="/admin/users"
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
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-[var(--color-surface)] text-[var(--color-ink-muted)]">
                  <tr className="text-left text-xs font-semibold uppercase tracking-wide">
                    <th className="px-4 py-3 font-semibold">User</th>
                    <th className="px-4 py-3 font-semibold">Role</th>
                    <th className="px-4 py-3 font-semibold">Status</th>
                    <th className="px-4 py-3 font-semibold text-right">
                      Inquiries
                    </th>
                    <th className="px-4 py-3 font-semibold text-right">
                      Reports against
                    </th>
                    <th className="px-4 py-3 font-semibold">Joined</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--color-border)]">
                  {rows.map((u: AdminUserRow) => (
                    <tr
                      key={u.id}
                      className={
                        u.is_banned
                          ? "bg-red-50/40 hover:bg-red-50 transition-colors"
                          : "hover:bg-[var(--color-surface)] transition-colors"
                      }
                    >
                      <td className="px-4 py-3 max-w-[20rem]">
                        <Link
                          href={`/admin/users/${u.id}`}
                          className="block min-w-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-brand-500)] rounded-md"
                        >
                          <p className="font-semibold truncate">
                            {u.name ?? (
                              <span className="text-[var(--color-ink-subtle)] font-normal italic">
                                (no name)
                              </span>
                            )}
                          </p>
                          <p className="text-xs text-[var(--color-ink-muted)] truncate">
                            {u.email ?? u.phone ?? (
                              <span className="italic">no contact</span>
                            )}
                          </p>
                          {u.email && u.phone && (
                            <p className="text-xs text-[var(--color-ink-subtle)] truncate">
                              {u.phone}
                            </p>
                          )}
                        </Link>
                      </td>
                      <td className="px-4 py-3">
                        <Badge tone={roleTone(u.role)}>{u.role}</Badge>
                      </td>
                      <td className="px-4 py-3">
                        {u.is_banned ? (
                          <Badge
                            tone="danger"
                            icon={<Ban size={11} aria-hidden="true" />}
                          >
                            Banned
                          </Badge>
                        ) : (
                          <Badge
                            tone="verified"
                            icon={<Check size={11} aria-hidden="true" />}
                          >
                            OK
                          </Badge>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums">
                        {u.inquiry_count}
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums">
                        {u.reports_against > 0 ? (
                          <span className="font-semibold text-red-700">
                            {u.reports_against}
                          </span>
                        ) : (
                          <span className="text-[var(--color-ink-subtle)]">
                            0
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-[var(--color-ink-muted)] whitespace-nowrap">
                        {timeAgo(u.created_at)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile cards */}
            <ul role="list" className="md:hidden divide-y divide-[var(--color-border)]">
              {rows.map((u: AdminUserRow) => (
                <li
                  key={u.id}
                  className={u.is_banned ? "bg-red-50/40" : ""}
                >
                  <Link
                    href={`/admin/users/${u.id}`}
                    className="block p-4 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-brand-500)]"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold truncate">
                          {u.name ?? (
                            <span className="text-[var(--color-ink-subtle)] font-normal italic">
                              (no name)
                            </span>
                          )}
                        </p>
                        <p className="text-xs text-[var(--color-ink-muted)] truncate">
                          {u.email ?? u.phone ?? (
                            <span className="italic">no contact</span>
                          )}
                        </p>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <Badge tone={roleTone(u.role)}>{u.role}</Badge>
                        {u.is_banned && (
                          <Badge
                            tone="danger"
                            icon={<Ban size={11} aria-hidden="true" />}
                          >
                            Banned
                          </Badge>
                        )}
                      </div>
                    </div>
                    <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-[var(--color-ink-muted)]">
                      <span>{u.inquiry_count} inquiries</span>
                      {u.reports_against > 0 && (
                        <span className="font-semibold text-red-700">
                          {u.reports_against} reports against
                        </span>
                      )}
                      <span>· joined {timeAgo(u.created_at)}</span>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Pagination */}
          {total > PAGE_SIZE && (
            <div className="mt-5 flex items-center justify-between gap-3">
              <p className="text-xs text-[var(--color-ink-muted)]">
                Page {page} of {totalPages} ·{" "}
                {(page - 1) * PAGE_SIZE + 1}–
                {Math.min(page * PAGE_SIZE, total)} of{" "}
                {total.toLocaleString("en-IN")}
              </p>
              <div className="flex items-center gap-2">
                {hasPrev ? (
                  <Link
                    href={`/admin/users${buildQuery(currentParams, {
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
                    href={`/admin/users${buildQuery(currentParams, {
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

      {/* Quick filter helper at bottom */}
      {!q && !role && !bannedFlag && total > 0 && (
        <p className="mt-4 text-xs text-[var(--color-ink-subtle)] inline-flex items-center gap-1.5">
          <ShieldCheck size={12} aria-hidden="true" />
          Quick filter:{" "}
          <Link
            href="/admin/users?banned=1"
            className="font-semibold text-[var(--color-brand-700)] hover:underline ml-1"
          >
            banned users
          </Link>
          <span>·</span>
          <Link
            href="/admin/users?role=admin"
            className="font-semibold text-[var(--color-brand-700)] hover:underline"
          >
            admins
          </Link>
        </p>
      )}
    </>
  );
}
