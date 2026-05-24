import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import {
  ChevronLeft,
  ShieldAlert,
  MapPin,
  ExternalLink,
} from "lucide-react";
import { OwnerLayout } from "@/components/owner/OwnerSidebar";
import { MessageThread } from "@/components/chat/MessageThread";
import { Badge } from "@/components/ui/Badge";
import { buildMetadata } from "@/lib/seo";
import { CITY_NAMES } from "@/lib/site";
import { getConversation, getOwnerStrikeCount } from "@/lib/chat-queries";
import { getCurrentOwner } from "@/lib/owner-queries";

type Props = { params: Promise<{ id: string }> };

export const metadata: Metadata = buildMetadata({
  title: "Inquiry chat",
  path: "/owner/inquiries",
  noindex: true,
});

const STATUS_TONE: Record<string, "warning" | "verified" | "default"> = {
  open: "warning",
  responded: "verified",
  closed: "default",
};

const STATUS_LABEL: Record<string, string> = {
  open: "Open",
  responded: "Replied",
  closed: "Closed",
};

export default async function OwnerInquiryDetailPage({ params }: Props) {
  const { id } = await params;
  const current = await getCurrentOwner();
  if (!current) {
    redirect(`/owner/login?next=/owner/inquiries/${id}`);
  }
  if (!current.owner) {
    redirect("/owner/onboarding");
  }

  const convo = await getConversation(id);
  if (!convo) notFound();

  // Owner route — renter should be redirected to /messages/[id]
  if (convo.myRole !== "owner") {
    redirect(`/messages/${id}`);
  }

  const cityName = CITY_NAMES[convo.listing.city] ?? convo.listing.city;
  const renterName = convo.renter?.name ?? "Renter";
  const listingHref = `/pg/${convo.listing.city}/${convo.listing.slug}`;
  const isClosed = convo.inquiry.status === "closed";

  // Strike count — surfaced to the owner as a self-warning so they know
  // we're tracking redactions. 3+ = soft warning UI.
  const strikeCount = await getOwnerStrikeCount(convo.listing.owner_id);
  const showStrikeWarning = strikeCount >= 3;

  return (
    <OwnerLayout businessName={current.owner.business_name}>
      {/* Back link */}
      <Link
        href="/owner/inquiries"
        className="inline-flex items-center gap-1 text-xs font-medium text-[var(--color-ink-muted)] hover:text-[var(--color-brand-700)] mb-3"
      >
        <ChevronLeft size={14} aria-hidden="true" />
        All inquiries
      </Link>

      {/* Header */}
      <header className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-elevated)] p-4 mb-3">
        <div className="flex items-start gap-3">
          <div
            className="h-12 w-12 shrink-0 rounded-full bg-gradient-to-br from-pink-400 to-fuchsia-500 inline-flex items-center justify-center text-white font-black text-base"
            aria-hidden="true"
          >
            {renterName.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-start gap-2 flex-wrap">
              <h1 className="text-lg sm:text-xl font-black tracking-tight truncate">
                {renterName}
              </h1>
              <Badge tone={STATUS_TONE[convo.inquiry.status] ?? "default"}>
                {STATUS_LABEL[convo.inquiry.status] ?? convo.inquiry.status}
              </Badge>
            </div>
            <p className="mt-1 text-xs text-[var(--color-ink-muted)] flex items-center gap-1.5 flex-wrap">
              <span>Inquiry on</span>
              <Link
                href={listingHref}
                target="_blank"
                rel="noopener"
                className="font-semibold text-[var(--color-ink)] hover:text-[var(--color-brand-700)] inline-flex items-center gap-0.5"
              >
                {convo.listing.title}
                <ExternalLink size={10} aria-hidden="true" />
              </Link>
              <span className="text-[var(--color-ink-subtle)]">·</span>
              <span className="inline-flex items-center gap-0.5">
                <MapPin size={11} aria-hidden="true" />
                {convo.listing.area}, {cityName}
              </span>
            </p>
          </div>
        </div>
      </header>

      {/* Strike warning (3+ redactions in last 30 days) */}
      {showStrikeWarning && (
        <div className="rounded-xl border border-amber-300 bg-amber-50 p-3 mb-3 flex items-start gap-2.5">
          <ShieldAlert
            size={16}
            className="text-amber-700 mt-0.5 shrink-0"
            aria-hidden="true"
          />
          <div className="text-xs text-amber-900">
            <p className="font-bold">
              {strikeCount} messages flagged in the last 30 days
            </p>
            <p className="mt-0.5 leading-relaxed">
              HostelPups removed contact info from {strikeCount} of your recent
              messages. Listings with 5+ redactions in 30 days may be
              suspended. Keep chat on-platform — calls and bookings are coming
              soon.
            </p>
          </div>
        </div>
      )}

      {/* Standard safety strip */}
      {!showStrikeWarning && (
        <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 mb-3 flex items-center gap-2 text-xs text-[var(--color-ink-muted)]">
          <ShieldAlert
            size={12}
            className="text-amber-700"
            aria-hidden="true"
          />
          <p>
            Phone, email, UPI &amp; social handles are stripped automatically.
            Sharing them violates our terms.
          </p>
        </div>
      )}

      <MessageThread
        inquiryId={convo.inquiry.id}
        initialMessages={convo.messages}
        currentUserId={convo.meId}
        counterpartyName={renterName}
        closed={isClosed}
      />
    </OwnerLayout>
  );
}
