import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
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
  getCurrentOwner,
  getOwnerListings,
  getOwnerStats,
  getOwnerInquiries,
} from "@/lib/owner-queries";
import { getCurrentUserCalls } from "@/lib/call-queries";
import type { Listing, RoomType } from "@/lib/types";

export const metadata: Metadata = buildMetadata({
  title: "Owner Dashboard",
  description: "Manage your HostelPups property listings, inquiries, and bookings.",
  path: "/owner/dashboard",
  noindex: true,
});

const STATUS_LABEL: Record<
  string,
  { label: string; tone: "verified" | "warning" | "default" }
> = {
  live: { label: "Live", tone: "verified" },
  pending_review: { label: "Pending review", tone: "warning" },
  paused: { label: "Paused", tone: "default" },
  draft: { label: "Draft", tone: "default" },
  full: { label: "Full", tone: "default" },
  rejected: { label: "Rejected", tone: "warning" },
};

function getMinRoomPrice(rooms: RoomType[] | undefined): number | null {
  if (!rooms || rooms.length === 0) return null;
  const prices = rooms
    .map((r) => Number(r.price_per_month))
    .filter((n) => Number.isFinite(n) && n > 0);
  if (prices.length === 0) return null;
  return Math.min(...prices);
}

function getCoverUrl(l: Listing): string | null {
  if (!l.photos || l.photos.length === 0) return null;
  const cover = l.photos.find((p) => p.is_cover) ?? l.photos[0];
  return cover?.url ?? null;
}

// Deterministic gradient seed so cover-less listings get a stable backdrop.
function gradientFor(id: string): string {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
  const hue = h % 360;
  return `linear-gradient(135deg, hsl(${hue} 70% 60%) 0%, hsl(${(hue + 40) % 360} 70% 50%) 100%)`;
}

export default async function OwnerDashboardPage() {
  const current = await getCurrentOwner();
  if (!current) {
    redirect("/owner/login?next=/owner/dashboard");
  }

  // If signed in but no owners row exists, route to onboarding.
  if (!current.owner) {
    redirect("/owner/onboarding");
  }

  const businessName = current.owner.business_name || "Your business";

  const [listings, stats, inquiries, calls] = await Promise.all([
    getOwnerListings(),
    getOwnerStats(),
    getOwnerInquiries(),
    getCurrentUserCalls(200),
  ]);

  const previewListings = listings.slice(0, 4);
  const previewInquiries = inquiries.slice(0, 3);
  const callCount = calls.length;

  return (
    <OwnerLayout businessName={businessName}>
      {/* Welcome strip */}
      <header className="rounded-2xl bg-[var(--color-brand-500)] text-[var(--color-ink)] p-6 sm:p-8 shadow-[var(--shadow-md)]">
        <p className="text-sm font-semibold opacity-80">Owner dashboard</p>
        <h1 className="mt-1 text-2xl sm:text-3xl font-black tracking-tight">
          Welcome back, {businessName}
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
            value={String(stats.totalListings)}
            caption={
              stats.totalListings === 1 ? "1 listing" : `${stats.totalListings} listings`
            }
            Icon={ClipboardList}
            tone="brand"
          />
          <StatsCard
            label="Live listings"
            value={String(stats.liveListings)}
            caption={
              stats.totalListings === 0
                ? "no listings yet"
                : `${stats.totalListings - stats.liveListings} not live`
            }
            Icon={Eye}
            tone="success"
          />
          <StatsCard
            label="Inquiries"
            value={String(stats.totalInquiries)}
            caption={`${stats.openInquiries} open`}
            Icon={MessageSquare}
            tone="cta"
          />
          <StatsCard
            label="Calls"
            value={String(callCount)}
            caption={callCount === 1 ? "1 call" : `${callCount} calls`}
            Icon={PhoneCall}
            tone="info"
          />
        </div>
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

        {previewListings.length === 0 ? (
          <div className="rounded-2xl border-2 border-dashed border-[var(--color-border-strong)] bg-[var(--color-surface)] p-8 text-center">
            <div className="mx-auto inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--color-brand-100)] text-[var(--color-brand-700)] mb-3">
              <ClipboardList size={24} aria-hidden="true" />
            </div>
            <p className="font-bold">No listings yet</p>
            <p className="mt-1 text-sm text-[var(--color-ink-muted)]">
              Create your first listing — it takes about 5 minutes.
            </p>
            <div className="mt-4">
              <Button href="/owner/listings/new" variant="cta" size="sm">
                Create your first listing
              </Button>
            </div>
          </div>
        ) : (
          <ul
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
            role="list"
          >
            {previewListings.map((l) => {
              const cityName = CITY_NAMES[l.city] ?? l.city;
              const minPrice = getMinRoomPrice(l.room_types);
              const statusKey = STATUS_LABEL[l.status] ? l.status : "draft";
              const status = STATUS_LABEL[statusKey];
              const cover = getCoverUrl(l);

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
                      className="h-28 w-full relative bg-cover bg-center"
                      style={
                        cover
                          ? { backgroundImage: `url(${cover})` }
                          : { background: gradientFor(l.id) }
                      }
                      role="img"
                      aria-label={`${l.title} cover`}
                    >
                      <span className="absolute top-2 right-2">
                        <Badge
                          tone={status.tone}
                          icon={
                            statusKey === "live" ? (
                              <CheckCircle2 size={10} />
                            ) : statusKey === "pending_review" ? (
                              <Clock size={10} />
                            ) : (
                              <Pause size={10} />
                            )
                          }
                        >
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
                    {l.status === "live" ? (
                      <Link
                        href={`/pg/${l.city}/${l.slug}`}
                        className="inline-flex items-center gap-1 text-xs font-semibold text-[var(--color-ink-muted)] hover:text-[var(--color-ink)]"
                      >
                        Public view
                        <ArrowRight size={11} aria-hidden="true" />
                      </Link>
                    ) : (
                      <span className="text-xs text-[var(--color-ink-subtle)]">not public</span>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        )}

        {listings.length > 4 && (
          <div className="mt-4">
            <Link
              href="/owner/listings"
              className="inline-flex items-center gap-1 text-sm font-semibold text-[var(--color-brand-700)] hover:underline"
            >
              View all {listings.length} listings
              <ArrowRight size={14} aria-hidden="true" />
            </Link>
          </div>
        )}
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

        {previewInquiries.length === 0 ? (
          <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-elevated)] p-6 text-center text-sm text-[var(--color-ink-muted)]">
            No inquiries yet. Once your listings go live, renters will start reaching out.
          </div>
        ) : (
          <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-elevated)] overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-[var(--color-surface)] text-[var(--color-ink-subtle)] text-xs uppercase tracking-wider">
                <tr>
                  <th scope="col" className="text-left font-semibold py-3 px-4">
                    Renter
                  </th>
                  <th
                    scope="col"
                    className="text-left font-semibold py-3 px-4 hidden sm:table-cell"
                  >
                    Listing
                  </th>
                  <th
                    scope="col"
                    className="text-left font-semibold py-3 px-4 hidden md:table-cell"
                  >
                    When
                  </th>
                  <th scope="col" className="text-right font-semibold py-3 px-4">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody>
                {previewInquiries.map((row) => (
                  <tr key={row.id} className="border-t border-[var(--color-border)]">
                    <td className="py-3 px-4">
                      <p className="font-semibold">{row.profiles?.name ?? "Renter"}</p>
                      <p className="text-xs text-[var(--color-ink-muted)] sm:hidden">
                        {row.listings?.title ?? "—"}
                      </p>
                    </td>
                    <td className="py-3 px-4 hidden sm:table-cell text-[var(--color-ink-muted)]">
                      {row.listings?.title ?? "—"}
                    </td>
                    <td className="py-3 px-4 hidden md:table-cell text-[var(--color-ink-muted)]">
                      {timeAgo(row.created_at)}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <Link
                        href={`/owner/inquiries/${row.id}`}
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
        )}
      </section>
    </OwnerLayout>
  );
}
