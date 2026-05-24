import type { Metadata } from "next";
import Link from "next/link";
import {
  ClipboardList,
  Eye,
  MessageSquare,
  PhoneCall,
  Plus,
  ArrowRight,
  Pencil,
  CheckCircle2,
  Pause,
  Clock,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { OwnerLayout } from "@/components/owner/OwnerSidebar";
import { StatsCard } from "@/components/owner/StatsCard";
import { buildMetadata } from "@/lib/seo";
import { CITY_NAMES, PROPERTY_TYPES } from "@/lib/site";
import { formatPrice, timeAgo } from "@/lib/utils";
import {
  getFeaturedListings,
  getListingMinPrice,
  getListingGradient,
} from "@/lib/mockListings";

export const metadata: Metadata = buildMetadata({
  title: "Owner Dashboard",
  description: "Manage your HostelPups property listings, inquiries, and bookings.",
  path: "/owner/dashboard",
  noindex: true,
});

// PENDING (Phase 1B): replace placeholders with real owner row from public.owners
const PLACEHOLDER_BUSINESS_NAME = "Your Business";

interface InquiryRow {
  user: string;
  listing: string;
  isoDate: string;
  status: "new" | "responded";
}

const PLACEHOLDER_INQUIRIES: InquiryRow[] = [
  {
    user: "Aditya Menon",
    listing: "Sunshine PG",
    isoDate: new Date(Date.now() - 1000 * 60 * 60 * 50).toISOString(),
    status: "new",
  },
  {
    user: "Priya Nair",
    listing: "Techie Nest PG",
    isoDate: new Date(Date.now() - 1000 * 60 * 60 * 8).toISOString(),
    status: "responded",
  },
  {
    user: "Rahul Sharma",
    listing: "Casa Cozy Couple Studio",
    isoDate: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
    status: "new",
  },
];

const STATUS_LABEL: Record<string, { label: string; tone: "verified" | "warning" | "default" }> = {
  live: { label: "Live", tone: "verified" },
  pending_review: { label: "Pending review", tone: "warning" },
  paused: { label: "Paused", tone: "default" },
  draft: { label: "Draft", tone: "default" },
};

export default function OwnerDashboardPage() {
  // PENDING (Phase 1B): replace with real query: select * from listings where owner_id = auth.uid()
  const sampleListings = getFeaturedListings(4);

  return (
    <OwnerLayout businessName={PLACEHOLDER_BUSINESS_NAME}>
      {/* Welcome strip */}
      <header className="rounded-2xl bg-[var(--color-brand-500)] text-[var(--color-ink)] p-6 sm:p-8 shadow-[var(--shadow-md)]">
        <p className="text-sm font-semibold opacity-80">Owner dashboard</p>
        <h1 className="mt-1 text-2xl sm:text-3xl font-black tracking-tight">
          Welcome back, {PLACEHOLDER_BUSINESS_NAME}
        </h1>
        <p className="mt-2 text-sm opacity-90 max-w-xl">
          Here&apos;s a snapshot of your listings, recent inquiries, and what needs attention.
        </p>
        <div className="mt-4 flex items-center gap-2 flex-wrap">
          <Button href="/owner/listings/new" variant="cta">
            <Plus size={16} aria-hidden="true" />
            New listing
          </Button>
          <Button href="/owner/inquiries" variant="ghost" className="bg-white/85 hover:bg-white">
            <MessageSquare size={16} aria-hidden="true" />
            Open inquiries
          </Button>
        </div>
      </header>

      {/* Stats */}
      <section aria-labelledby="stats-heading" className="mt-6">
        <h2 id="stats-heading" className="sr-only">
          Key statistics
        </h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <StatsCard
            label="Total listings"
            value="12"
            caption="across 2 cities"
            Icon={ClipboardList}
            tone="brand"
            placeholder
          />
          <StatsCard
            label="Live listings"
            value="9"
            caption="3 paused / pending"
            Icon={Eye}
            tone="success"
            placeholder
          />
          <StatsCard
            label="Inquiries (May)"
            value="47"
            caption="+12 vs April"
            Icon={MessageSquare}
            tone="cta"
            placeholder
          />
          <StatsCard
            label="Calls (May)"
            value="—"
            caption="Phase 2 feature"
            Icon={PhoneCall}
            tone="info"
            placeholder
          />
        </div>
        <p className="mt-3 text-[11px] uppercase tracking-wider font-bold text-amber-700">
          Pending Phase 1B data wiring
        </p>
      </section>

      {/* Your Listings */}
      <section aria-labelledby="listings-heading" className="mt-8">
        <div className="flex items-end justify-between gap-3 mb-4 flex-wrap">
          <div>
            <h2 id="listings-heading" className="text-xl font-black tracking-tight">
              Your listings
            </h2>
            <p className="text-sm text-[var(--color-ink-muted)]">
              Quick edit, pause, or view stats per listing.
            </p>
          </div>
          <Button href="/owner/listings/new" variant="primary" size="sm">
            <Plus size={14} aria-hidden="true" />
            New listing
          </Button>
        </div>

        <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4" role="list">
          {sampleListings.map((l) => {
            const cityName = CITY_NAMES[l.city] ?? l.city;
            const minPrice = getListingMinPrice(l);
            // Pick a placeholder status (use real status from data, fall back)
            const statusKey =
              l.status === "live"
                ? "live"
                : l.status === "pending_review"
                  ? "pending_review"
                  : "draft";
            const status = STATUS_LABEL[statusKey];

            return (
              <li
                key={l.id}
                className="rounded-2xl overflow-hidden border border-[var(--color-border)] bg-[var(--color-bg-elevated)] shadow-[var(--shadow-sm)] hover:shadow-[var(--shadow-md)] transition-all"
              >
                <Link
                  href={`/owner/listings/${l.id}/edit`}
                  className="block"
                  aria-label={`Edit ${l.title}`}
                >
                  <div
                    className="h-28 w-full relative"
                    style={{ background: getListingGradient(l.id) }}
                    role="img"
                    aria-label={`${l.title} cover placeholder`}
                  >
                    <span className="absolute top-2 right-2">
                      <Badge tone={status.tone} icon={
                        statusKey === "live" ? <CheckCircle2 size={10} /> :
                        statusKey === "pending_review" ? <Clock size={10} /> :
                        <Pause size={10} />
                      }>
                        {status.label}
                      </Badge>
                    </span>
                  </div>
                  <div className="p-3">
                    <p className="font-bold text-sm truncate">{l.title}</p>
                    <p className="text-xs text-[var(--color-ink-muted)] mt-0.5 truncate">
                      {l.area}, {cityName} · {PROPERTY_TYPES[l.type]}
                    </p>
                    <p className="text-xs mt-1.5">
                      {minPrice !== null ? (
                        <>
                          <span className="font-bold">{formatPrice(minPrice)}</span>
                          <span className="text-[var(--color-ink-muted)]">/mo</span>
                        </>
                      ) : (
                        <span className="text-[var(--color-ink-muted)]">Price on request</span>
                      )}
                      <span className="mx-1.5 text-[var(--color-ink-subtle)]">·</span>
                      <span className="text-[var(--color-ink-muted)]">
                        {l.total_vacancies ?? 0} vacancies
                      </span>
                    </p>
                  </div>
                </Link>
                <div className="flex items-center justify-between border-t border-[var(--color-border)] px-3 py-2 bg-[var(--color-surface)]">
                  <Link
                    href={`/owner/listings/${l.id}/edit`}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-[var(--color-brand-700)] hover:underline"
                  >
                    <Pencil size={12} aria-hidden="true" />
                    Edit
                  </Link>
                  <Link
                    href={`/pg/${l.city}/${l.slug}`}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-[var(--color-ink-muted)] hover:text-[var(--color-ink)]"
                  >
                    Public view
                    <ArrowRight size={11} aria-hidden="true" />
                  </Link>
                </div>
              </li>
            );
          })}
        </ul>

        <div className="mt-4">
          <Link
            href="/owner/listings"
            className="inline-flex items-center gap-1 text-sm font-semibold text-[var(--color-brand-700)] hover:underline"
          >
            View all listings
            <ArrowRight size={14} aria-hidden="true" />
          </Link>
        </div>
      </section>

      {/* Recent inquiries */}
      <section aria-labelledby="inquiries-heading" className="mt-8">
        <div className="flex items-end justify-between gap-3 mb-4 flex-wrap">
          <div>
            <h2 id="inquiries-heading" className="text-xl font-black tracking-tight">
              Recent inquiries
            </h2>
            <p className="text-sm text-[var(--color-ink-muted)]">
              Each inquiry routes through HostelPups chat — phone numbers are never shared.
            </p>
          </div>
          <Link
            href="/owner/inquiries"
            className="text-sm font-semibold text-[var(--color-brand-700)] hover:underline inline-flex items-center gap-1"
          >
            See all
            <ArrowRight size={12} aria-hidden="true" />
          </Link>
        </div>

        <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-elevated)] overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-[var(--color-surface)] text-[var(--color-ink-subtle)] text-xs uppercase tracking-wider">
              <tr>
                <th scope="col" className="text-left font-semibold py-3 px-4">Renter</th>
                <th scope="col" className="text-left font-semibold py-3 px-4 hidden sm:table-cell">Listing</th>
                <th scope="col" className="text-left font-semibold py-3 px-4 hidden md:table-cell">When</th>
                <th scope="col" className="text-right font-semibold py-3 px-4">Action</th>
              </tr>
            </thead>
            <tbody>
              {PLACEHOLDER_INQUIRIES.map((row, i) => (
                <tr key={i} className="border-t border-[var(--color-border)]">
                  <td className="py-3 px-4">
                    <p className="font-semibold">{row.user}</p>
                    <p className="text-xs text-[var(--color-ink-muted)] sm:hidden">{row.listing}</p>
                  </td>
                  <td className="py-3 px-4 hidden sm:table-cell text-[var(--color-ink-muted)]">{row.listing}</td>
                  <td className="py-3 px-4 hidden md:table-cell text-[var(--color-ink-muted)]">
                    {timeAgo(row.isoDate)}
                  </td>
                  <td className="py-3 px-4 text-right">
                    <Link
                      href="/owner/inquiries"
                      className="inline-flex items-center gap-1 rounded-full border border-[var(--color-border-strong)] bg-white px-3 py-1.5 text-xs font-semibold text-[var(--color-ink)] hover:border-[var(--color-brand-500)] transition-colors"
                    >
                      <MessageSquare size={11} aria-hidden="true" />
                      Reply
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-3 text-[11px] uppercase tracking-wider font-bold text-amber-700">
          Pending Phase 1B inquiry table query
        </p>
      </section>
    </OwnerLayout>
  );
}
