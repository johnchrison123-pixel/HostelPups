import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft, MapPin, ExternalLink, ShieldAlert } from "lucide-react";
import { buildMetadata } from "@/lib/seo";
import { requireAdmin } from "@/lib/admin-auth";
import { createClient } from "@/lib/supabase/server";
import { Badge } from "@/components/ui/Badge";
import { timeAgo } from "@/lib/utils";
import { InquiryDetailActions } from "./InquiryDetailActions";

export const metadata: Metadata = buildMetadata({
  title: "Inquiry detail",
  path: "/admin/inquiries/...",
  noindex: true,
});

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ id: string }>;
}

type InquiryStatus = "open" | "responded" | "closed";

function statusBadgeTone(status: string): "warning" | "verified" | "default" {
  if (status === "open") return "warning";
  if (status === "responded") return "verified";
  return "default";
}

const STATUS_LABELS: Record<string, string> = {
  open: "Open",
  responded: "Responded",
  closed: "Closed",
};

interface InquiryRow {
  id: string;
  status: string;
  created_at: string;
  user_id: string;
  listing_id: string;
  listings?: {
    title?: string | null;
    city?: string | null;
    area?: string | null;
    slug?: string | null;
    owner_id?: string | null;
  } | null;
  profiles?: { name?: string | null; email?: string | null } | null;
}

interface MessageRow {
  id: string;
  inquiry_id: string;
  sender_id: string;
  content: string;
  was_redacted: boolean | null;
  created_at: string;
}

interface OwnerProfile {
  id: string;
  name: string | null;
}

export default async function AdminInquiryDetailPage({ params }: PageProps) {
  await requireAdmin();
  const { id } = await params;

  const supabase = await createClient();

  const { data: inquiryRaw, error: inqError } = await supabase
    .from("inquiries")
    .select(
      `
      id, status, created_at, user_id, listing_id,
      listings:listing_id (title, city, area, slug, owner_id),
      profiles:user_id (name, email)
    `,
    )
    .eq("id", id)
    .maybeSingle();

  if (inqError || !inquiryRaw) notFound();
  const inquiry = inquiryRaw as unknown as InquiryRow;

  const { data: messagesRaw } = await supabase
    .from("messages")
    .select("id, inquiry_id, sender_id, content, was_redacted, created_at")
    .eq("inquiry_id", id)
    .order("created_at", { ascending: true });

  const messages = (messagesRaw ?? []) as MessageRow[];

  const ownerId = inquiry.listings?.owner_id ?? null;
  let ownerProfile: OwnerProfile | null = null;
  if (ownerId) {
    const { data: ownerRaw } = await supabase
      .from("profiles")
      .select("id, name")
      .eq("id", ownerId)
      .maybeSingle();
    if (ownerRaw) {
      ownerProfile = {
        id: String(ownerRaw.id),
        name: (ownerRaw.name as string | null) ?? null,
      };
    }
  }

  const renterName = inquiry.profiles?.name ?? null;
  const renterEmail = inquiry.profiles?.email ?? null;
  const listingTitle = inquiry.listings?.title ?? null;
  const listingCity = inquiry.listings?.city ?? null;
  const listingArea = inquiry.listings?.area ?? null;
  const listingSlug = inquiry.listings?.slug ?? null;
  const listingHref =
    listingCity && listingSlug ? `/pg/${listingCity}/${listingSlug}` : null;
  const status = inquiry.status as InquiryStatus;
  const isClosed = status === "closed";

  function senderLabel(senderId: string): string {
    if (ownerProfile && senderId === ownerProfile.id) return "Owner";
    if (senderId === inquiry.user_id) return "Renter";
    return "Admin";
  }

  function senderTone(senderId: string): "brand" | "verified" | "default" {
    if (ownerProfile && senderId === ownerProfile.id) return "brand";
    if (senderId === inquiry.user_id) return "verified";
    return "default";
  }

  return (
    <>
      {/* Back link */}
      <Link
        href="/admin/inquiries"
        className="inline-flex items-center gap-1 text-xs font-medium text-[var(--color-ink-muted)] hover:text-[var(--color-brand-700)] mb-3"
      >
        <ChevronLeft size={14} aria-hidden="true" />
        All inquiries
      </Link>

      {/* Header card */}
      <header className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-elevated)] p-4 mb-4">
        <div className="flex items-start gap-3 flex-wrap">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl sm:text-2xl font-black tracking-tight">
                {renterName ?? (
                  <span className="text-[var(--color-ink-subtle)] italic">
                    Unknown renter
                  </span>
                )}
              </h1>
              <Badge tone={statusBadgeTone(status)}>
                {STATUS_LABELS[status] ?? status}
              </Badge>
            </div>
            {renterEmail && (
              <p className="mt-0.5 text-sm text-[var(--color-ink-muted)]">
                {renterEmail}
              </p>
            )}
            <p className="mt-2 text-sm text-[var(--color-ink-muted)] flex flex-wrap items-center gap-1.5">
              <span>Inquiry on</span>
              {listingTitle ? (
                <span className="font-semibold text-[var(--color-ink)]">
                  {listingTitle}
                </span>
              ) : (
                <span className="italic text-[var(--color-ink-subtle)]">
                  Deleted listing
                </span>
              )}
              {(listingArea || listingCity) && (
                <>
                  <span className="text-[var(--color-ink-subtle)]">·</span>
                  <span className="inline-flex items-center gap-0.5 capitalize">
                    <MapPin size={11} aria-hidden="true" />
                    {[listingArea, listingCity].filter(Boolean).join(", ")}
                  </span>
                </>
              )}
            </p>
            <p className="mt-1 text-xs text-[var(--color-ink-subtle)]">
              Opened {timeAgo(inquiry.created_at)}
            </p>
            {listingHref && (
              <Link
                href={listingHref}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-[var(--color-brand-700)] hover:underline"
              >
                Linked listing
                <ExternalLink size={11} aria-hidden="true" />
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* Safety strip */}
      <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 mb-4 flex items-center gap-2 text-xs text-[var(--color-ink-muted)]">
        <ShieldAlert size={12} className="text-amber-700" aria-hidden="true" />
        <p>
          Admin read view &mdash; messages flagged{" "}
          <strong>was_redacted</strong> had contact info stripped on send.
        </p>
      </div>

      {/* Message list */}
      {messages.length === 0 ? (
        <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-elevated)] p-10 text-center">
          <p className="text-sm font-semibold">No messages in this inquiry</p>
          <p className="mt-1 text-xs text-[var(--color-ink-muted)]">
            The renter hasn&apos;t sent anything yet.
          </p>
        </div>
      ) : (
        <ol className="flex flex-col gap-3 mb-4">
          {messages.map((m) => (
            <li
              key={m.id}
              className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-elevated)] p-3"
            >
              <div className="flex items-center gap-2 flex-wrap mb-2">
                <Badge tone={senderTone(m.sender_id)}>
                  {senderLabel(m.sender_id)}
                </Badge>
                {m.was_redacted && (
                  <Badge tone="warning">redacted</Badge>
                )}
                <span className="ml-auto text-xs text-[var(--color-ink-muted)]">
                  {timeAgo(m.created_at)}
                </span>
              </div>
              <p className="text-sm whitespace-pre-wrap text-[var(--color-ink)]">
                {m.content}
              </p>
            </li>
          ))}
        </ol>
      )}

      {/* Admin footer */}
      <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4 flex items-center justify-between gap-3 flex-wrap">
        <p className="text-xs text-[var(--color-ink-muted)]">
          Admin controls
        </p>
        <InquiryDetailActions inquiryId={inquiry.id} closed={isClosed} />
      </div>
    </>
  );
}
