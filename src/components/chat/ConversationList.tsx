import * as React from "react";
import Link from "next/link";
import { ShieldCheck, MapPin, MessageSquare, CircleDot } from "lucide-react";
import { CITY_NAMES } from "@/lib/site";
import { timeAgo, truncate } from "@/lib/utils";
import type {
  RenterConversation,
  OwnerConversation,
} from "@/lib/chat-queries";

interface ConversationListProps {
  asRenter: RenterConversation[];
  asOwner: OwnerConversation[];
}

/**
 * Two-section conversation list, rendered server-side.
 *
 * Section 1 — "Inquiries on your listings" (owner side, only shown if user
 * is an owner with at least one inquiry).
 * Section 2 — "Your inquiries" (renter side, always shown to logged-in users).
 *
 * Each card links to either /owner/inquiries/{id} (owner-side) or
 * /messages/{id} (renter-side).
 */
export function ConversationList({
  asRenter,
  asOwner,
}: ConversationListProps) {
  const hasOwner = asOwner.length > 0;
  const hasRenter = asRenter.length > 0;
  const empty = !hasOwner && !hasRenter;

  if (empty) {
    return (
      <div className="rounded-2xl border-2 border-dashed border-[var(--color-border-strong)] bg-[var(--color-surface)] p-10 text-center">
        <div className="mx-auto inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--color-brand-100)] text-[var(--color-brand-700)] mb-4">
          <MessageSquare size={28} aria-hidden="true" />
        </div>
        <h2 className="text-xl font-black">No conversations yet</h2>
        <p className="mt-2 text-sm text-[var(--color-ink-muted)] max-w-md mx-auto">
          Browse listings and tap{" "}
          <span className="font-bold">Send inquiry message</span> on a PG you
          like — your conversation with the owner will appear here.
        </p>
        <Link
          href="/search"
          className="mt-5 inline-flex h-11 items-center rounded-full bg-[var(--color-brand-500)] px-5 text-sm font-bold text-[var(--color-ink)] hover:bg-[var(--color-brand-600)] shadow-[var(--shadow-md)] transition-colors"
        >
          Browse listings
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {hasOwner && (
        <section aria-labelledby="owner-conversations-heading">
          <h2
            id="owner-conversations-heading"
            className="text-sm font-bold uppercase tracking-wide text-[var(--color-ink-subtle)] mb-3"
          >
            From renters · {asOwner.length}
          </h2>
          <ul role="list" className="space-y-2">
            {asOwner.map((c) => (
              <li key={c.id}>
                <OwnerConversationCard convo={c} />
              </li>
            ))}
          </ul>
        </section>
      )}

      {hasRenter && (
        <section aria-labelledby="renter-conversations-heading">
          <h2
            id="renter-conversations-heading"
            className="text-sm font-bold uppercase tracking-wide text-[var(--color-ink-subtle)] mb-3"
          >
            Your inquiries · {asRenter.length}
          </h2>
          <ul role="list" className="space-y-2">
            {asRenter.map((c) => (
              <li key={c.id}>
                <RenterConversationCard convo={c} />
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}

function RenterConversationCard({ convo }: { convo: RenterConversation }) {
  const listingTitle = convo.listing?.title ?? "Listing removed";
  const cityName = convo.listing?.city
    ? CITY_NAMES[convo.listing.city] ?? convo.listing.city
    : null;
  const area = convo.listing?.area;
  const ownerName = convo.owner?.business_name ?? "Owner";
  const preview = previewText(convo.lastMessage);

  return (
    <Link
      href={`/messages/${convo.id}`}
      className="block rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-elevated)] p-4 sm:p-5 hover:border-[var(--color-brand-300)] hover:shadow-[var(--shadow-md)] transition-all"
    >
      <div className="flex items-start gap-3">
        <div
          className="h-12 w-12 shrink-0 rounded-2xl bg-gradient-to-br from-[var(--color-brand-300)] to-[var(--color-brand-500)] inline-flex items-center justify-center text-[var(--color-ink)] font-black text-base"
          aria-hidden="true"
        >
          {listingTitle.charAt(0).toUpperCase()}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start gap-2">
            <p className="font-bold text-[var(--color-ink)] truncate">
              {listingTitle}
            </p>
            <span className="ml-auto text-[10px] text-[var(--color-ink-subtle)] shrink-0">
              {timeAgo(convo.lastMessage?.created_at ?? convo.created_at)}
            </span>
          </div>
          <p className="mt-0.5 flex items-center gap-1.5 text-xs text-[var(--color-ink-muted)] truncate">
            <span className="inline-flex items-center gap-1">
              {ownerName}
              {convo.owner?.has_verification_badge && (
                <ShieldCheck
                  size={11}
                  className="text-emerald-600"
                  aria-label="Verified owner"
                />
              )}
            </span>
            {area && cityName && (
              <>
                <span className="text-[var(--color-ink-subtle)]">·</span>
                <span className="inline-flex items-center gap-0.5">
                  <MapPin size={10} aria-hidden="true" />
                  {area}, {cityName}
                </span>
              </>
            )}
          </p>
          <p className="mt-1.5 text-sm text-[var(--color-ink-muted)] line-clamp-1">
            {preview}
          </p>
        </div>
      </div>
    </Link>
  );
}

function OwnerConversationCard({ convo }: { convo: OwnerConversation }) {
  const renterName = convo.renter?.name ?? "Renter";
  const listingTitle = convo.listing?.title ?? "Listing";
  const cityName = convo.listing?.city
    ? CITY_NAMES[convo.listing.city] ?? convo.listing.city
    : null;
  const preview = previewText(convo.lastMessage);
  const isOpen = convo.status === "open";

  return (
    <Link
      href={`/owner/inquiries/${convo.id}`}
      className="block rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-elevated)] p-4 sm:p-5 hover:border-[var(--color-brand-300)] hover:shadow-[var(--shadow-md)] transition-all"
    >
      <div className="flex items-start gap-3">
        <div
          className="h-12 w-12 shrink-0 rounded-full bg-gradient-to-br from-pink-400 to-fuchsia-500 inline-flex items-center justify-center text-white font-black text-base"
          aria-hidden="true"
        >
          {renterName.charAt(0).toUpperCase()}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start gap-2">
            <p className="font-bold text-[var(--color-ink)] truncate inline-flex items-center gap-1.5">
              {isOpen && (
                <CircleDot
                  size={12}
                  className="text-amber-600 shrink-0"
                  aria-label="Unanswered"
                />
              )}
              {renterName}
            </p>
            <span className="ml-auto text-[10px] text-[var(--color-ink-subtle)] shrink-0">
              {timeAgo(convo.lastMessage?.created_at ?? convo.created_at)}
            </span>
          </div>
          <p className="mt-0.5 text-xs text-[var(--color-ink-muted)] truncate">
            Inquiry on{" "}
            <span className="font-semibold text-[var(--color-ink)]">
              {listingTitle}
            </span>
            {cityName && (
              <>
                {" "}
                <span className="text-[var(--color-ink-subtle)]">·</span>{" "}
                {cityName}
              </>
            )}
          </p>
          <p className="mt-1.5 text-sm text-[var(--color-ink-muted)] line-clamp-1">
            {preview}
          </p>
        </div>
      </div>
    </Link>
  );
}

function previewText(
  msg: { content: string; sender_id: string } | null,
): string {
  if (!msg) return "No messages yet — say hello.";
  return truncate(msg.content, 100);
}
