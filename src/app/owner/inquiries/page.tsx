import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import {
  MessageSquare,
  Lock,
  ShieldCheck,
  CircleDot,
  Inbox,
} from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { OwnerLayout } from "@/components/owner/OwnerSidebar";
import { buildMetadata } from "@/lib/seo";
import { CITY_NAMES } from "@/lib/site";
import { timeAgo } from "@/lib/utils";
import {
  getCurrentOwner,
  getOwnerInquiries,
} from "@/lib/owner-queries";

export const metadata: Metadata = buildMetadata({
  title: "Inquiries",
  description: "All renter inquiries on your HostelPups listings.",
  path: "/owner/inquiries",
  noindex: true,
});

const STATUS_TONE: Record<
  string,
  "warning" | "verified" | "default"
> = {
  open: "warning",
  responded: "verified",
  closed: "default",
};

const STATUS_LABEL: Record<string, string> = {
  open: "Open",
  responded: "Replied",
  closed: "Closed",
};

export default async function OwnerInquiriesPage() {
  const current = await getCurrentOwner();
  if (!current) {
    redirect("/owner/login?next=/owner/inquiries");
  }
  if (!current.owner) {
    redirect("/owner/onboarding");
  }

  const inquiries = await getOwnerInquiries();

  return (
    <OwnerLayout businessName={current.owner.business_name}>
      <header className="mb-4">
        <h1 className="text-2xl sm:text-3xl font-black tracking-tight">Inquiries</h1>
        <p className="mt-1 text-sm text-[var(--color-ink-muted)]">
          Renters reach you through HostelPups secure chat. Reply within 4 hours to keep
          your response rate badge.
        </p>
      </header>

      {/* Safety notice */}
      <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4 mb-6 flex items-start gap-3 text-sm">
        <ShieldCheck
          size={18}
          className="text-emerald-600 mt-0.5 shrink-0"
          aria-hidden="true"
        />
        <div>
          <p className="font-semibold">
            Inquiries are routed through HostelPups secure chat.
          </p>
          <p className="text-[var(--color-ink-muted)] mt-0.5">
            Direct phone numbers, emails, UPI IDs, and social handles are{" "}
            <strong>never shared</strong> in either direction. Trying to share them
            in chat triggers our anti-disintermediation filter and may suspend your
            account.
          </p>
        </div>
      </div>

      {inquiries.length === 0 ? (
        <div className="rounded-2xl border-2 border-dashed border-[var(--color-border-strong)] bg-[var(--color-surface)] p-10 text-center">
          <div className="mx-auto inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--color-brand-100)] text-[var(--color-brand-700)] mb-4">
            <Inbox size={28} aria-hidden="true" />
          </div>
          <h2 className="text-xl font-black">No inquiries yet</h2>
          <p className="mt-2 text-sm text-[var(--color-ink-muted)] max-w-md mx-auto">
            Once one of your listings is live, renters can send you a message.
            They&apos;ll show up here.
          </p>
        </div>
      ) : (
        <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-elevated)] overflow-hidden shadow-[var(--shadow-sm)]">
          <ul role="list" className="divide-y divide-[var(--color-border)]">
            {inquiries.map((row) => {
              const renterName = row.profiles?.name ?? "Renter";
              const listingTitle = row.listings?.title ?? "—";
              const cityName = row.listings?.city
                ? CITY_NAMES[row.listings.city] ?? row.listings.city
                : "";
              return (
                <li
                  key={row.id}
                  className="p-4 sm:p-5 hover:bg-[var(--color-surface)] transition-colors"
                >
                  <div className="flex items-start gap-3">
                    {row.status === "open" ? (
                      <CircleDot
                        size={14}
                        className="text-amber-600 mt-1.5 shrink-0"
                        aria-label="Open inquiry"
                      />
                    ) : (
                      <span className="h-3.5 w-3.5 mt-1.5 shrink-0" />
                    )}

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-bold text-[var(--color-ink)] truncate">
                          {renterName}
                        </p>
                        <span className="text-xs text-[var(--color-ink-subtle)]">
                          · {listingTitle}
                          {cityName ? `, ${cityName}` : ""}
                        </span>
                        <span className="ml-auto inline-flex items-center gap-2 shrink-0">
                          <Badge tone={STATUS_TONE[row.status] ?? "default"}>
                            {STATUS_LABEL[row.status] ?? row.status}
                          </Badge>
                          <span className="text-xs text-[var(--color-ink-muted)] hidden sm:inline">
                            {timeAgo(row.created_at)}
                          </span>
                        </span>
                      </div>
                      <div className="mt-3 flex items-center gap-2 flex-wrap">
                        <Link
                          href="/messages"
                          className="inline-flex items-center gap-1.5 rounded-full border border-[var(--color-brand-500)] bg-[var(--color-brand-50)] px-3 py-1.5 text-xs font-bold text-[var(--color-brand-900)] hover:bg-[var(--color-brand-100)] transition-colors"
                        >
                          <MessageSquare size={12} aria-hidden="true" />
                          Open chat
                        </Link>
                        <span className="text-[10px] text-[var(--color-ink-subtle)] inline-flex items-center gap-1">
                          <Lock size={9} aria-hidden="true" />
                          Phone numbers hidden by HostelPups
                        </span>
                      </div>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </OwnerLayout>
  );
}
