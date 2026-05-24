import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ChevronLeft, ShieldCheck, ShieldAlert } from "lucide-react";
import { Container } from "@/components/ui/Container";
import { MessageThread } from "@/components/chat/MessageThread";
import { buildMetadata } from "@/lib/seo";
import { CITY_NAMES } from "@/lib/site";
import { getCurrentUser } from "@/lib/auth";
import { getConversation } from "@/lib/chat-queries";

type Props = { params: Promise<{ id: string }> };

export const metadata: Metadata = buildMetadata({
  title: "Conversation",
  path: "/messages",
  noindex: true,
});

export default async function MessageThreadPage({ params }: Props) {
  const { id } = await params;
  const user = await getCurrentUser();
  if (!user) {
    redirect(`/login?next=/messages/${id}`);
  }

  const convo = await getConversation(id);
  if (!convo) notFound();

  // Renter route — owner should be redirected to /owner/inquiries/[id]
  if (convo.myRole !== "renter") {
    redirect(`/owner/inquiries/${id}`);
  }

  const cityName = CITY_NAMES[convo.listing.city] ?? convo.listing.city;
  const counterpartyName = convo.owner?.business_name ?? "Owner";
  const listingHref = `/pg/${convo.listing.city}/${convo.listing.slug}`;
  const isClosed = convo.inquiry.status === "closed";

  return (
    <Container size="md" className="py-4 sm:py-6">
      {/* Back link */}
      <Link
        href="/messages"
        className="inline-flex items-center gap-1 text-xs font-medium text-[var(--color-ink-muted)] hover:text-[var(--color-brand-700)] mb-3"
      >
        <ChevronLeft size={14} aria-hidden="true" />
        All conversations
      </Link>

      {/* Header strip */}
      <header className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-elevated)] p-4 mb-3">
        <div className="flex items-start gap-3">
          <div
            className="h-12 w-12 shrink-0 rounded-2xl bg-gradient-to-br from-[var(--color-brand-300)] to-[var(--color-brand-500)] inline-flex items-center justify-center text-[var(--color-ink)] font-black text-base"
            aria-hidden="true"
          >
            {convo.listing.title.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-lg sm:text-xl font-black tracking-tight truncate">
              <Link
                href={listingHref}
                className="hover:text-[var(--color-brand-700)]"
              >
                {convo.listing.title}
              </Link>
            </h1>
            <p className="mt-0.5 text-xs text-[var(--color-ink-muted)] flex items-center gap-1.5 flex-wrap">
              <span className="inline-flex items-center gap-1">
                {counterpartyName}
                {convo.owner?.has_verification_badge && (
                  <ShieldCheck
                    size={12}
                    className="text-emerald-600"
                    aria-label="Verified owner"
                  />
                )}
              </span>
              <span className="text-[var(--color-ink-subtle)]">·</span>
              <span>
                {convo.listing.area}, {cityName}
              </span>
            </p>
          </div>
        </div>
      </header>

      {/* Safety notice */}
      <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 mb-3 flex items-center gap-2 text-xs text-[var(--color-ink-muted)]">
        <ShieldAlert size={12} className="text-amber-700" aria-hidden="true" />
        <p>
          Phone numbers, emails, UPI IDs &amp; social handles are hidden in
          both directions.
        </p>
      </div>

      <MessageThread
        inquiryId={convo.inquiry.id}
        initialMessages={convo.messages}
        currentUserId={convo.meId}
        counterpartyName={counterpartyName}
        closed={isClosed}
      />
    </Container>
  );
}
