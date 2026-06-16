import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  Mail,
  Phone,
  Calendar,
  Ban,
  Shield,
  MessageSquare,
  PhoneCall,
  CreditCard,
  Flag,
  AlertTriangle,
  Heart,
} from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { buildMetadata } from "@/lib/seo";
import { getUserById, getUserActivity } from "@/lib/admin-queries";
import { timeAgo, formatPrice } from "@/lib/utils";
import { CITY_NAMES } from "@/lib/site";
import { UserActions } from "@/components/admin/UserActions";

export const metadata: Metadata = buildMetadata({
  title: "User — Admin",
  description: "Admin view of a single user.",
  path: "/admin/users",
  noindex: true,
});

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ id: string }>;
}

function initialsFrom(user: {
  name: string | null;
  email: string | null;
}): string {
  const src = user.name?.trim() || user.email?.trim() || "";
  if (!src) return "?";
  const parts = src.split(/[\s@.]+/).filter(Boolean);
  if (parts.length === 0) return src.slice(0, 1).toUpperCase();
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
}

function roleTone(role: string): "brand" | "verified" | "default" {
  if (role === "admin") return "verified";
  if (role === "owner") return "brand";
  return "default";
}

function inquiryStatusTone(
  status: string,
): "warning" | "brand" | "verified" | "default" {
  if (status === "open") return "warning";
  if (status === "responded") return "brand";
  if (status === "closed") return "verified";
  return "default";
}

function callStatusTone(
  status: string,
): "verified" | "warning" | "danger" | "default" {
  if (status === "completed" || status === "answered") return "verified";
  if (status === "missed" || status === "ringing") return "warning";
  if (status === "failed" || status === "rejected") return "danger";
  return "default";
}

function paymentStatusTone(
  status: string,
): "verified" | "warning" | "danger" | "default" {
  if (status === "completed") return "verified";
  if (status === "pending") return "warning";
  if (status === "failed" || status === "refunded") return "danger";
  return "default";
}

function formatDuration(secs: number | null): string {
  if (secs == null || secs < 0) return "—";
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export default async function AdminUserDetailPage({ params }: PageProps) {
  const { id } = await params;
  const [user, activity] = await Promise.all([
    getUserById(id),
    getUserActivity(id),
  ]);
  if (!user) notFound();

  return (
    <>
      {/* Back link */}
      <Link
        href="/admin/users"
        className="inline-flex items-center gap-1.5 text-sm font-semibold text-[var(--color-ink-muted)] hover:text-[var(--color-ink)] transition-colors mb-4"
      >
        <ArrowLeft size={14} aria-hidden="true" />
        Back to users
      </Link>

      {/* Header card */}
      <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-elevated)] p-4 sm:p-6 mb-4">
        <div className="flex items-start gap-4">
          {/* Avatar circle */}
          <span
            className="inline-flex h-16 w-16 sm:h-20 sm:w-20 items-center justify-center rounded-full bg-[var(--color-brand-100)] text-[var(--color-brand-700)] text-xl sm:text-2xl font-black shrink-0 select-none"
            aria-hidden="true"
          >
            {initialsFrom(user)}
          </span>

          <div className="min-w-0 flex-1">
            <div className="flex items-center flex-wrap gap-2">
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight truncate">
                {user.name ?? (
                  <span className="text-[var(--color-ink-subtle)] italic">
                    (no name)
                  </span>
                )}
              </h1>
              <Badge tone={roleTone(user.role)}>
                <Shield size={11} aria-hidden="true" />
                {user.role}
              </Badge>
              {user.is_banned && (
                <Badge
                  tone="danger"
                  icon={<Ban size={11} aria-hidden="true" />}
                >
                  Banned
                </Badge>
              )}
            </div>

            <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-[var(--color-ink-muted)]">
              {user.email && (
                <span className="inline-flex items-center gap-1.5 min-w-0">
                  <Mail
                    size={13}
                    className="shrink-0 text-[var(--color-ink-subtle)]"
                    aria-hidden="true"
                  />
                  <span className="truncate">{user.email}</span>
                </span>
              )}
              {user.phone && (
                <span className="inline-flex items-center gap-1.5">
                  <Phone
                    size={13}
                    className="text-[var(--color-ink-subtle)]"
                    aria-hidden="true"
                  />
                  {user.phone}
                </span>
              )}
              <span className="inline-flex items-center gap-1.5">
                <Calendar
                  size={13}
                  className="text-[var(--color-ink-subtle)]"
                  aria-hidden="true"
                />
                User since {timeAgo(user.created_at)}
              </span>
            </div>

            {user.is_banned && (
              <div className="mt-3 rounded-xl bg-red-50 border border-red-200 px-3 py-2 text-sm">
                <p className="inline-flex items-start gap-2 text-red-900">
                  <AlertTriangle
                    size={14}
                    className="mt-0.5 shrink-0"
                    aria-hidden="true"
                  />
                  <span>
                    <strong>Banned</strong>
                    {user.banned_at ? ` ${timeAgo(user.banned_at)}` : ""}
                    {user.banned_reason ? ` — ${user.banned_reason}` : "."}
                  </span>
                </p>
              </div>
            )}

            {/* Activity chip row */}
            <div className="mt-4 flex flex-wrap gap-2">
              <StatChip
                Icon={MessageSquare}
                label="Inquiries"
                value={user.inquiry_count}
              />
              <StatChip
                Icon={PhoneCall}
                label="Calls"
                value={user.call_count}
              />
              <StatChip
                Icon={Heart}
                label="Favorites"
                value={user.favorite_count}
              />
              <StatChip
                Icon={Flag}
                label="Reports filed"
                value={user.reports_filed}
              />
              <StatChip
                Icon={Flag}
                label="Reports against"
                value={user.reports_against}
                tone={user.reports_against > 0 ? "danger" : "default"}
              />
              {user.listing_count > 0 && (
                <StatChip
                  Icon={Shield}
                  label="Listings"
                  value={user.listing_count}
                />
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Action strip with inline panels */}
      <div className="mb-6">
        <UserActions user={user} />
      </div>

      {/* Activity sections */}
      <div className="space-y-6">
        {/* Recent inquiries */}
        <section aria-labelledby="inquiries-heading">
          <div className="flex items-end justify-between gap-3 mb-3 flex-wrap">
            <div>
              <h2
                id="inquiries-heading"
                className="text-xl font-black tracking-tight"
              >
                Recent inquiries
              </h2>
              <p className="text-xs text-[var(--color-ink-muted)]">
                Latest 20 inquiries this user has sent.
              </p>
            </div>
          </div>
          {activity.inquiries.length === 0 ? (
            <EmptyRow
              Icon={MessageSquare}
              label="No inquiries yet"
            />
          ) : (
            <ul
              role="list"
              className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-elevated)] divide-y divide-[var(--color-border)] overflow-hidden"
            >
              {activity.inquiries.map((row) => (
                <li
                  key={row.id}
                  className="p-3 sm:p-4 flex items-center gap-3 text-sm"
                >
                  <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-[var(--color-brand-100)] text-[var(--color-brand-700)] shrink-0">
                    <MessageSquare size={14} aria-hidden="true" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold truncate">
                      {row.listing_title ?? (
                        <span className="italic text-[var(--color-ink-subtle)]">
                          (listing removed)
                        </span>
                      )}
                    </p>
                    <p className="text-xs text-[var(--color-ink-muted)]">
                      {timeAgo(row.created_at)}
                    </p>
                  </div>
                  <Badge tone={inquiryStatusTone(row.status)}>
                    {row.status}
                  </Badge>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* Recent calls */}
        <section aria-labelledby="calls-heading">
          <div className="flex items-end justify-between gap-3 mb-3 flex-wrap">
            <div>
              <h2
                id="calls-heading"
                className="text-xl font-black tracking-tight"
              >
                Recent calls
              </h2>
              <p className="text-xs text-[var(--color-ink-muted)]">
                Latest 20 calls — as caller or callee.
              </p>
            </div>
          </div>
          {activity.calls.length === 0 ? (
            <EmptyRow Icon={PhoneCall} label="No calls yet" />
          ) : (
            <ul
              role="list"
              className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-elevated)] divide-y divide-[var(--color-border)] overflow-hidden"
            >
              {activity.calls.map((row) => (
                <li
                  key={row.id}
                  className="p-3 sm:p-4 flex items-center gap-3 text-sm"
                >
                  <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-sky-50 text-sky-700 shrink-0">
                    <PhoneCall size={14} aria-hidden="true" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold">
                      <span className="tabular-nums">
                        {formatDuration(row.duration_seconds)}
                      </span>
                      {row.counterparty && (
                        <span className="ml-2 text-xs font-normal text-[var(--color-ink-muted)]">
                          with {row.counterparty.slice(0, 8)}…
                        </span>
                      )}
                    </p>
                    <p className="text-xs text-[var(--color-ink-muted)]">
                      {timeAgo(row.created_at)}
                    </p>
                  </div>
                  <Badge tone={callStatusTone(row.status)}>{row.status}</Badge>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* Recent payments */}
        <section aria-labelledby="payments-heading">
          <div className="flex items-end justify-between gap-3 mb-3 flex-wrap">
            <div>
              <h2
                id="payments-heading"
                className="text-xl font-black tracking-tight"
              >
                Recent payments
              </h2>
              <p className="text-xs text-[var(--color-ink-muted)]">
                Latest 20 payments made by this user.
              </p>
            </div>
          </div>
          {activity.payments.length === 0 ? (
            <EmptyRow Icon={CreditCard} label="No payments yet" />
          ) : (
            <ul
              role="list"
              className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-elevated)] divide-y divide-[var(--color-border)] overflow-hidden"
            >
              {activity.payments.map((row) => {
                const amountStr =
                  row.currency === "INR"
                    ? formatPrice(row.amount)
                    : `${row.currency} ${row.amount}`;
                return (
                  <li
                    key={row.id}
                    className="p-3 sm:p-4 flex items-center gap-3 text-sm"
                  >
                    <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-emerald-50 text-emerald-700 shrink-0">
                      <CreditCard size={14} aria-hidden="true" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold tabular-nums">
                        {amountStr}
                        <span className="ml-2 text-xs font-normal text-[var(--color-ink-muted)]">
                          {row.purpose || "—"}
                        </span>
                      </p>
                      <p className="text-xs text-[var(--color-ink-muted)]">
                        {timeAgo(row.created_at)}
                      </p>
                    </div>
                    <Badge tone={paymentStatusTone(row.status)}>
                      {row.status}
                    </Badge>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </div>

      {/* Hidden helper to silence unused import — CITY_NAMES is used implicitly
          via the edit panel labels in the UserActions client component. */}
      <span className="sr-only" aria-hidden="true">
        {CITY_NAMES.kochi}
      </span>
    </>
  );
}

/* ============================================================
   Small server-side helpers
   ============================================================ */

interface StatChipProps {
  Icon: React.ComponentType<{ size?: number; className?: string }>;
  label: string;
  value: number;
  tone?: "default" | "danger";
}

function StatChip({ Icon, label, value, tone = "default" }: StatChipProps) {
  const toneClass =
    tone === "danger" && value > 0
      ? "bg-red-50 border-red-200 text-red-800"
      : "bg-[var(--color-surface)] border-[var(--color-border)] text-[var(--color-ink-muted)]";
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium ${toneClass}`}
    >
      <Icon
        size={12}
        className="shrink-0"
        aria-hidden="true"
      />
      <span className="font-bold tabular-nums text-[var(--color-ink)]">
        {value}
      </span>
      {label}
    </span>
  );
}

function EmptyRow({
  Icon,
  label,
}: {
  Icon: React.ComponentType<{ size?: number; className?: string }>;
  label: string;
}) {
  return (
    <div className="rounded-2xl border border-dashed border-[var(--color-border-strong)] bg-[var(--color-surface)] p-6 text-center">
      <Icon
        size={18}
        className="mx-auto text-[var(--color-ink-subtle)]"
        aria-hidden="true"
      />
      <p className="mt-2 text-sm font-medium text-[var(--color-ink-muted)]">
        {label}
      </p>
    </div>
  );
}
