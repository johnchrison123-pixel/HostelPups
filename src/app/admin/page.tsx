import type { Metadata } from "next";
import Link from "next/link";
import {
  Users,
  Building2,
  ClipboardList,
  MessageSquare,
  PhoneCall,
  CreditCard,
  Flag,
  ShieldCheck,
  TrendingUp,
  Ban,
  AlertTriangle,
  ArrowRight,
  Activity,
} from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { buildMetadata } from "@/lib/seo";
import { getAdminStats, searchAuditLog } from "@/lib/admin-queries";
import { timeAgo } from "@/lib/utils";

export const metadata: Metadata = buildMetadata({
  title: "Admin Dashboard",
  description: "HostelPups admin control panel.",
  path: "/admin",
  noindex: true,
});

const INR = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});

interface MetricCardProps {
  label: string;
  value: string | number;
  caption?: string;
  href?: string;
  Icon: React.ComponentType<{ size?: number; className?: string }>;
  tone?: "brand" | "warning" | "danger" | "success" | "info";
}

function MetricCard({ label, value, caption, href, Icon, tone = "brand" }: MetricCardProps) {
  const toneClasses = {
    brand: "bg-[var(--color-brand-100)] text-[var(--color-brand-700)]",
    warning: "bg-amber-50 text-amber-700",
    danger: "bg-red-50 text-red-700",
    success: "bg-emerald-50 text-emerald-700",
    info: "bg-sky-50 text-sky-700",
  }[tone];

  const inner = (
    <div className="h-full rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-elevated)] p-4 shadow-[var(--shadow-sm)] hover:shadow-[var(--shadow-md)] transition-shadow">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-xs font-medium text-[var(--color-ink-muted)] uppercase tracking-wide">
            {label}
          </p>
          <p className="mt-1 text-2xl font-black tracking-tight">{value}</p>
          {caption && (
            <p className="mt-1 text-xs text-[var(--color-ink-muted)]">{caption}</p>
          )}
        </div>
        <span
          className={`inline-flex h-9 w-9 items-center justify-center rounded-xl ${toneClasses}`}
        >
          <Icon size={18} aria-hidden="true" />
        </span>
      </div>
    </div>
  );

  return href ? (
    <Link href={href} className="block focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-brand-500)] rounded-2xl">
      {inner}
    </Link>
  ) : (
    inner
  );
}

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

export default async function AdminDashboardPage() {
  const stats = await getAdminStats();
  const { rows: recentAudit } = await searchAuditLog({ limit: 8 });

  return (
    <>
      <header className="mb-6">
        <div className="flex items-start gap-3">
          <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700 shrink-0">
            <ShieldCheck size={22} aria-hidden="true" />
          </span>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-[var(--color-ink-subtle)]">
              Control panel
            </p>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
              Admin dashboard
            </h1>
            <p className="mt-1 text-sm text-[var(--color-ink-muted)]">
              Live ops view — pending KYC, open reports, today&apos;s payments.
            </p>
          </div>
        </div>
      </header>

      {/* Action queue strip — what needs attention right now */}
      {(stats.ownersPendingKyc > 0 || stats.reportsOpen > 0 || stats.usersBanned > 0) && (
        <section
          aria-labelledby="queue-heading"
          className="rounded-2xl border border-amber-200 bg-amber-50/80 p-4 sm:p-5 mb-6"
        >
          <div className="flex items-start gap-3">
            <AlertTriangle
              size={18}
              className="text-amber-700 mt-0.5 shrink-0"
              aria-hidden="true"
            />
            <div className="min-w-0 flex-1">
              <h2
                id="queue-heading"
                className="text-sm font-bold text-amber-900"
              >
                Needs your attention
              </h2>
              <ul className="mt-2 flex flex-wrap gap-2 text-sm">
                {stats.ownersPendingKyc > 0 && (
                  <li>
                    <Link
                      href="/admin/owners?kyc_status=pending"
                      className="inline-flex items-center gap-1.5 rounded-full bg-white border border-amber-300 px-3 py-1 font-semibold text-amber-900 hover:bg-amber-100 transition-colors"
                    >
                      {stats.ownersPendingKyc} KYC pending
                      <ArrowRight size={11} aria-hidden="true" />
                    </Link>
                  </li>
                )}
                {stats.reportsOpen > 0 && (
                  <li>
                    <Link
                      href="/admin/reports?status=open"
                      className="inline-flex items-center gap-1.5 rounded-full bg-white border border-amber-300 px-3 py-1 font-semibold text-amber-900 hover:bg-amber-100 transition-colors"
                    >
                      {stats.reportsOpen} open report
                      {stats.reportsOpen === 1 ? "" : "s"}
                      <ArrowRight size={11} aria-hidden="true" />
                    </Link>
                  </li>
                )}
                {stats.usersBanned > 0 && (
                  <li>
                    <Link
                      href="/admin/users?banned=1"
                      className="inline-flex items-center gap-1.5 rounded-full bg-white border border-amber-300 px-3 py-1 font-semibold text-amber-900 hover:bg-amber-100 transition-colors"
                    >
                      {stats.usersBanned} banned user
                      {stats.usersBanned === 1 ? "" : "s"}
                      <ArrowRight size={11} aria-hidden="true" />
                    </Link>
                  </li>
                )}
              </ul>
            </div>
          </div>
        </section>
      )}

      {/* Users + Owners */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <MetricCard
          label="Users"
          value={stats.usersTotal}
          caption={`${stats.usersNew24h} new in 24h`}
          Icon={Users}
          href="/admin/users"
          tone="brand"
        />
        <MetricCard
          label="Banned"
          value={stats.usersBanned}
          caption={stats.usersBanned > 0 ? "review status" : "all clear"}
          Icon={Ban}
          href="/admin/users?banned=1"
          tone={stats.usersBanned > 0 ? "danger" : "success"}
        />
        <MetricCard
          label="Owners"
          value={stats.ownersTotal}
          caption={`${stats.ownersVerifiedKyc} verified`}
          Icon={Building2}
          href="/admin/owners"
          tone="brand"
        />
        <MetricCard
          label="KYC pending"
          value={stats.ownersPendingKyc}
          caption={stats.ownersPendingKyc > 0 ? "review queue" : "all clear"}
          Icon={ShieldCheck}
          href="/admin/owners?kyc_status=pending"
          tone={stats.ownersPendingKyc > 0 ? "warning" : "success"}
        />
      </section>

      {/* Marketplace */}
      <section className="mt-4 grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <MetricCard
          label="Listings"
          value={stats.listingsTotal}
          caption={`${stats.listingsLive} live`}
          Icon={ClipboardList}
          href="/admin/listings"
          tone="brand"
        />
        <MetricCard
          label="Inquiries"
          value={stats.inquiriesTotal}
          caption={`${stats.inquiriesOpen} open · ${stats.inquiries24h} in 24h`}
          Icon={MessageSquare}
          href="/admin/inquiries"
          tone="info"
        />
        <MetricCard
          label="Calls"
          value={stats.callsTotal}
          caption={`${stats.calls24h} in 24h`}
          Icon={PhoneCall}
          href="/admin/calls"
          tone="info"
        />
        <MetricCard
          label="Reports"
          value={stats.reportsOpen}
          caption={stats.reportsOpen > 0 ? "open" : "queue empty"}
          Icon={Flag}
          href="/admin/reports"
          tone={stats.reportsOpen > 0 ? "warning" : "success"}
        />
      </section>

      {/* Payments */}
      <section className="mt-4 grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
        <MetricCard
          label="Payments (today)"
          value={stats.paymentsToday}
          caption={`${stats.paymentsTotal} total recorded`}
          Icon={CreditCard}
          href="/admin/payments"
          tone="success"
        />
        <MetricCard
          label="Revenue (today, INR)"
          value={INR.format(stats.paymentsRevenueINR)}
          caption="Completed payments only"
          Icon={TrendingUp}
          href="/admin/payments?status=completed"
          tone="success"
        />
        <div className="rounded-2xl border-2 border-dashed border-[var(--color-border-strong)] bg-[var(--color-surface)] p-4 flex items-center gap-3">
          <CreditCard
            size={18}
            className="text-[var(--color-ink-subtle)] shrink-0"
            aria-hidden="true"
          />
          <div className="text-xs text-[var(--color-ink-muted)]">
            <p className="font-semibold text-[var(--color-ink)]">Razorpay refund</p>
            <p className="mt-0.5">
              UI ready — wires up when you add{" "}
              <code className="font-mono">RAZORPAY_KEY_*</code> env vars.
            </p>
          </div>
        </div>
      </section>

      {/* Recent admin activity */}
      <section className="mt-8" aria-labelledby="recent-activity-heading">
        <div className="flex items-end justify-between gap-3 mb-3 flex-wrap">
          <div>
            <h2
              id="recent-activity-heading"
              className="text-xl font-black tracking-tight"
            >
              Recent admin activity
            </h2>
            <p className="text-sm text-[var(--color-ink-muted)]">
              Every admin action is logged — full feed at{" "}
              <Link
                href="/admin/audit"
                className="font-semibold text-[var(--color-brand-700)] hover:underline"
              >
                /admin/audit
              </Link>
              .
            </p>
          </div>
        </div>

        {recentAudit.length === 0 ? (
          <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-elevated)] p-6 text-center">
            <Activity
              size={20}
              className="mx-auto text-[var(--color-ink-subtle)]"
              aria-hidden="true"
            />
            <p className="mt-2 text-sm font-semibold">No admin actions yet</p>
            <p className="mt-1 text-xs text-[var(--color-ink-muted)]">
              When you ban a user, approve a KYC, or refund a payment, it&apos;ll show up
              here.
            </p>
          </div>
        ) : (
          <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-elevated)] overflow-hidden">
            <ul role="list" className="divide-y divide-[var(--color-border)]">
              {recentAudit.map((row) => (
                <li
                  key={row.id}
                  className="p-3 sm:p-4 flex items-center gap-3 text-sm"
                >
                  <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-[var(--color-brand-100)] text-[var(--color-brand-700)] shrink-0">
                    <Activity size={14} aria-hidden="true" />
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold truncate">
                      {AUDIT_LABEL[row.action] ?? row.action}
                      {row.target_table && (
                        <span className="text-[var(--color-ink-subtle)] font-normal">
                          {" "}
                          · {row.target_table}
                        </span>
                      )}
                    </p>
                    <p className="text-xs text-[var(--color-ink-muted)] truncate">
                      by {row.admin_name ?? "admin"}
                      {row.reason ? ` — ${row.reason}` : ""}
                    </p>
                  </div>
                  <Badge tone="default">{timeAgo(row.created_at)}</Badge>
                </li>
              ))}
            </ul>
          </div>
        )}
      </section>
    </>
  );
}
