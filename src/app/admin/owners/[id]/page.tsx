import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  Building2,
  Calendar,
  CheckCircle2,
  FileText,
  Mail,
  MessageSquare,
  Phone,
  ShieldCheck,
  XCircle,
} from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { buildMetadata } from "@/lib/seo";
import {
  getOwnerById,
  searchAdminListings,
  searchInquiries,
  type AdminListingRow,
  type AdminInquiryRow,
} from "@/lib/admin-queries";
import { createClient } from "@/lib/supabase/server";
import { CITY_NAMES } from "@/lib/site";
import { timeAgo } from "@/lib/utils";
import { OwnerActions } from "@/components/admin/OwnerActions";

export const metadata: Metadata = buildMetadata({
  title: "Owner detail — Admin",
  description: "HostelPups admin: owner CRM detail and KYC review.",
  path: "/admin/owners",
  noindex: true,
});

interface KycDoc {
  type?: string;
  url?: string;
  uploaded_at?: string;
}

function kycTone(
  status: string,
): "default" | "verified" | "warning" | "danger" {
  switch (status) {
    case "verified":
      return "verified";
    case "pending":
      return "warning";
    case "rejected":
      return "danger";
    default:
      return "default";
  }
}

function kycLabel(status: string): string {
  switch (status) {
    case "verified":
      return "KYC verified";
    case "pending":
      return "KYC pending review";
    case "rejected":
      return "KYC rejected";
    case "not_submitted":
    default:
      return "KYC not submitted";
  }
}

function tierLabel(tier: string | null): string {
  if (tier === "self_serve") return "Self-serve";
  if (tier === "full_service") return "Full service";
  return "Unassigned";
}

function listingStatusBadge(status: string): {
  tone: "default" | "brand" | "verified" | "warning" | "danger";
  label: string;
} {
  switch (status) {
    case "live":
      return { tone: "verified", label: "Live" };
    case "paused":
      return { tone: "warning", label: "Paused" };
    case "draft":
      return { tone: "default", label: "Draft" };
    case "pending_review":
      return { tone: "warning", label: "Pending review" };
    case "full":
      return { tone: "brand", label: "Full" };
    case "rejected":
      return { tone: "danger", label: "Rejected" };
    default:
      return { tone: "default", label: status };
  }
}

function inquiryStatusBadge(status: string): {
  tone: "default" | "brand" | "verified" | "warning" | "danger";
  label: string;
} {
  switch (status) {
    case "open":
      return { tone: "warning", label: "Open" };
    case "responded":
      return { tone: "brand", label: "Responded" };
    case "closed":
      return { tone: "default", label: "Closed" };
    default:
      return { tone: "default", label: status };
  }
}

interface Props {
  params: Promise<{ id: string }>;
}

async function fetchKycDocs(id: string): Promise<KycDoc[]> {
  try {
    const supabase = await createClient();
    const { data } = await supabase
      .from("owners")
      .select("kyc_documents")
      .eq("id", id)
      .maybeSingle();
    const raw = (data?.kyc_documents ?? null) as unknown;
    if (!Array.isArray(raw)) return [];
    return raw as KycDoc[];
  } catch {
    return [];
  }
}

export default async function AdminOwnerDetailPage({ params }: Props) {
  const { id } = await params;
  const owner = await getOwnerById(id);
  if (!owner) notFound();

  const [kycDocs, listingsRes, inquiriesRes] = await Promise.all([
    fetchKycDocs(id),
    searchAdminListings({ owner_id: id, limit: 100, offset: 0 }),
    searchInquiries({ limit: 200, offset: 0 }),
  ]);

  // The query helper filters inquiries by user — but we want inquiries
  // *received* by this owner. Filter on the joined owner_id field.
  const ownerInquiries: AdminInquiryRow[] = inquiriesRes.rows
    .filter((r) => r.owner_id === id)
    .slice(0, 10);

  const businessName =
    owner.business_name && owner.business_name.trim().length > 0
      ? owner.business_name
      : "(unnamed business)";

  return (
    <>
      <div className="mb-4">
        <Link
          href="/admin/owners"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-[var(--color-ink-muted)] hover:text-[var(--color-brand-700)] transition-colors"
        >
          <ArrowLeft size={12} aria-hidden="true" />
          Back to owners
        </Link>
      </div>

      {/* Header card */}
      <section
        aria-label="Owner summary"
        className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-elevated)] p-5 sm:p-6 shadow-[var(--shadow-sm)]"
      >
        <div className="flex items-start gap-4 flex-wrap">
          <span className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--color-brand-100)] text-[var(--color-brand-700)] shrink-0">
            <Building2 size={26} aria-hidden="true" />
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex items-start flex-wrap gap-2">
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight min-w-0 break-words">
                {businessName}
              </h1>
              <div className="flex flex-wrap gap-1.5 pt-1">
                <Badge tone={kycTone(owner.kyc_status)}>
                  {kycLabel(owner.kyc_status)}
                </Badge>
                {owner.has_verification_badge && (
                  <Badge
                    tone="verified"
                    icon={<ShieldCheck size={11} aria-hidden="true" />}
                  >
                    Verification badge
                  </Badge>
                )}
                {owner.is_banned && <Badge tone="danger">User banned</Badge>}
              </div>
            </div>

            <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-[var(--color-ink-muted)]">
              <span className="font-semibold text-[var(--color-ink)]">
                {owner.name ?? "(no profile name)"}
              </span>
              {owner.email && (
                <span className="inline-flex items-center gap-1">
                  <Mail size={12} aria-hidden="true" />
                  <a
                    href={`mailto:${owner.email}`}
                    className="hover:underline hover:text-[var(--color-brand-700)]"
                  >
                    {owner.email}
                  </a>
                </span>
              )}
              {owner.contact_phone && (
                <span className="inline-flex items-center gap-1">
                  <Phone size={12} aria-hidden="true" />
                  <a
                    href={`tel:${owner.contact_phone}`}
                    className="hover:underline hover:text-[var(--color-brand-700)]"
                  >
                    {owner.contact_phone}
                  </a>
                </span>
              )}
            </div>

            <p className="mt-2 text-xs text-[var(--color-ink-muted)]">
              Tier:{" "}
              <span className="font-semibold text-[var(--color-ink)]">
                {tierLabel(owner.tier)}
              </span>
              {owner.registered_at && (
                <>
                  {" · "}Registered{" "}
                  <span className="inline-flex items-center gap-1">
                    <Calendar size={11} aria-hidden="true" />
                    {timeAgo(owner.registered_at)}
                  </span>
                </>
              )}
            </p>
          </div>
        </div>

        {/* Counts strip */}
        <div className="mt-5 grid grid-cols-2 sm:grid-cols-4 gap-3">
          <CountStat
            label="Listings"
            value={owner.listing_count}
            href={`/admin/listings?owner_id=${owner.id}`}
          />
          <CountStat
            label="Inquiries received"
            value={owner.inquiry_count}
          />
          <CountStat
            label="KYC docs uploaded"
            value={kycDocs.length}
          />
          <CountStat
            label="Verification badge"
            value={owner.has_verification_badge ? "Yes" : "No"}
          />
        </div>
      </section>

      {/* KYC documents (only useful while review is pending/rejected/not submitted) */}
      <section
        aria-label="KYC documents"
        className="mt-6 rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-elevated)] p-4 sm:p-5 shadow-[var(--shadow-sm)]"
      >
        <div className="flex items-start gap-3">
          <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--color-brand-100)] text-[var(--color-brand-700)] shrink-0">
            <FileText size={16} aria-hidden="true" />
          </span>
          <div className="min-w-0 flex-1">
            <h2 className="text-sm font-bold">KYC documents</h2>
            <p className="text-xs text-[var(--color-ink-muted)] mt-0.5">
              Links open in a new tab. Approve / reject controls are below.
            </p>
          </div>
        </div>
        {kycDocs.length === 0 ? (
          <p className="mt-3 text-sm text-[var(--color-ink-muted)] italic">
            No documents uploaded yet.
          </p>
        ) : (
          <ul role="list" className="mt-3 divide-y divide-[var(--color-border)]">
            {kycDocs.map((doc, i) => {
              const docType = doc.type?.trim() || "Document";
              const url = doc.url?.trim();
              return (
                <li
                  key={`${docType}-${i}`}
                  className="py-2.5 flex items-center justify-between gap-3 text-sm flex-wrap"
                >
                  <div className="min-w-0 flex items-center gap-2">
                    <FileText
                      size={14}
                      className="text-[var(--color-ink-subtle)] shrink-0"
                      aria-hidden="true"
                    />
                    <span className="font-semibold capitalize">{docType}</span>
                    {doc.uploaded_at && (
                      <span className="text-xs text-[var(--color-ink-muted)]">
                        · uploaded {timeAgo(doc.uploaded_at)}
                      </span>
                    )}
                  </div>
                  {url ? (
                    <a
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 rounded-full border border-[var(--color-border-strong)] bg-[var(--color-bg)] px-3 py-1 text-xs font-semibold text-[var(--color-brand-700)] hover:bg-[var(--color-brand-50)] transition-colors"
                    >
                      Open
                    </a>
                  ) : (
                    <span className="text-xs text-[var(--color-ink-subtle)] italic">
                      missing URL
                    </span>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </section>

      {/* Admin action panels (client) */}
      <section aria-label="Owner admin actions" className="mt-6">
        <OwnerActions owner={owner} />
      </section>

      {/* Listings */}
      <section
        aria-labelledby="owner-listings-heading"
        className="mt-8 rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-elevated)] overflow-hidden shadow-[var(--shadow-sm)]"
      >
        <div className="p-4 sm:p-5 flex items-start justify-between gap-3 flex-wrap border-b border-[var(--color-border)]">
          <div>
            <h2
              id="owner-listings-heading"
              className="text-base font-bold flex items-center gap-2"
            >
              <Building2 size={16} aria-hidden="true" />
              Owner&apos;s listings
            </h2>
            <p className="text-xs text-[var(--color-ink-muted)] mt-0.5">
              {listingsRes.total.toLocaleString("en-IN")}{" "}
              {listingsRes.total === 1 ? "listing" : "listings"} on file
            </p>
          </div>
        </div>
        {listingsRes.rows.length === 0 ? (
          <p className="p-5 text-sm text-[var(--color-ink-muted)] italic">
            This owner hasn&apos;t created any listings yet.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-[var(--color-surface)] text-left text-xs font-semibold uppercase tracking-wide text-[var(--color-ink-subtle)]">
                  <th className="px-4 py-3">Title</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">City</th>
                  <th className="px-4 py-3 text-right">Vacancies</th>
                  <th className="px-4 py-3">Updated</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--color-border)]">
                {listingsRes.rows.map((row) => (
                  <ListingRow key={row.id} row={row} />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Recent inquiries */}
      <section
        aria-labelledby="owner-inquiries-heading"
        className="mt-6 rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-elevated)] overflow-hidden shadow-[var(--shadow-sm)]"
      >
        <div className="p-4 sm:p-5 flex items-start justify-between gap-3 flex-wrap border-b border-[var(--color-border)]">
          <div>
            <h2
              id="owner-inquiries-heading"
              className="text-base font-bold flex items-center gap-2"
            >
              <MessageSquare size={16} aria-hidden="true" />
              Recent inquiries
            </h2>
            <p className="text-xs text-[var(--color-ink-muted)] mt-0.5">
              Last {ownerInquiries.length} inquiry
              {ownerInquiries.length === 1 ? "" : "ies"} received by this owner
            </p>
          </div>
        </div>
        {ownerInquiries.length === 0 ? (
          <p className="p-5 text-sm text-[var(--color-ink-muted)] italic">
            No inquiries received yet.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-[var(--color-surface)] text-left text-xs font-semibold uppercase tracking-wide text-[var(--color-ink-subtle)]">
                  <th className="px-4 py-3">Renter</th>
                  <th className="px-4 py-3">Listing</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">When</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--color-border)]">
                {ownerInquiries.map((row) => (
                  <InquiryRow key={row.id} row={row} />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </>
  );
}

/* ---------------- subcomponents ---------------- */

function CountStat({
  label,
  value,
  href,
}: {
  label: string;
  value: string | number;
  href?: string;
}) {
  const inner = (
    <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-3">
      <p className="text-[10px] uppercase tracking-wide font-semibold text-[var(--color-ink-subtle)]">
        {label}
      </p>
      <p className="mt-1 text-xl font-black tracking-tight">{value}</p>
    </div>
  );
  return href ? (
    <Link
      href={href}
      className="block focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-brand-500)] rounded-xl hover:bg-[var(--color-brand-50)] transition-colors"
    >
      {inner}
    </Link>
  ) : (
    inner
  );
}

function ListingRow({ row }: { row: AdminListingRow }) {
  const status = listingStatusBadge(row.status);
  const cityName = CITY_NAMES[row.city] ?? row.city;
  const detailHref = `/pg/${row.city}/${row.slug}`;
  return (
    <tr className="hover:bg-[var(--color-surface)] transition-colors">
      <td className="px-4 py-3 align-top">
        <Link
          href={detailHref}
          className="font-semibold text-[var(--color-ink)] hover:text-[var(--color-brand-700)] hover:underline"
        >
          {row.title}
        </Link>
        <div className="mt-0.5 text-xs text-[var(--color-ink-muted)] flex flex-wrap gap-1.5 items-center">
          {row.is_verified && (
            <Badge
              tone="verified"
              icon={
                <CheckCircle2 size={10} aria-hidden="true" />
              }
            >
              Verified
            </Badge>
          )}
          {row.is_boosted_until &&
            new Date(row.is_boosted_until).getTime() > Date.now() && (
              <Badge tone="brand">Boosted</Badge>
            )}
        </div>
      </td>
      <td className="px-4 py-3 align-top">
        <Badge tone={status.tone}>{status.label}</Badge>
      </td>
      <td className="px-4 py-3 align-top text-[var(--color-ink-muted)]">
        {cityName}
        {row.area ? (
          <span className="block text-xs">{row.area}</span>
        ) : null}
      </td>
      <td className="px-4 py-3 align-top text-right font-mono">
        {row.total_vacancies ?? "—"}
      </td>
      <td className="px-4 py-3 align-top text-xs text-[var(--color-ink-muted)]">
        {timeAgo(row.updated_at)}
      </td>
    </tr>
  );
}

function InquiryRow({ row }: { row: AdminInquiryRow }) {
  const status = inquiryStatusBadge(row.status);
  return (
    <tr className="hover:bg-[var(--color-surface)] transition-colors">
      <td className="px-4 py-3 align-top">
        <span className="font-semibold">
          {row.user_name ?? "(unknown renter)"}
        </span>
      </td>
      <td className="px-4 py-3 align-top text-[var(--color-ink-muted)]">
        {row.listing_title ? (
          <span className="block max-w-[28ch] truncate">
            {row.listing_title}
          </span>
        ) : (
          <span className="italic">(deleted listing)</span>
        )}
        {row.city && (
          <span className="block text-xs">{CITY_NAMES[row.city] ?? row.city}</span>
        )}
      </td>
      <td className="px-4 py-3 align-top">
        {row.status === "closed" ? (
          <Badge
            tone={status.tone}
            icon={<XCircle size={10} aria-hidden="true" />}
          >
            {status.label}
          </Badge>
        ) : (
          <Badge tone={status.tone}>{status.label}</Badge>
        )}
      </td>
      <td className="px-4 py-3 align-top text-xs text-[var(--color-ink-muted)]">
        {timeAgo(row.created_at)}
      </td>
    </tr>
  );
}
