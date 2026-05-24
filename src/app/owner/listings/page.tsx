import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import {
  Plus,
  Pencil,
  Pause,
  CheckCircle2,
  Clock,
  Eye,
  ClipboardList,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { OwnerLayout } from "@/components/owner/OwnerSidebar";
import { ListingRowActions } from "@/components/owner/ListingRowActions";
import { buildMetadata } from "@/lib/seo";
import { CITY_NAMES, PROPERTY_TYPES } from "@/lib/site";
import { formatPrice, timeAgo } from "@/lib/utils";
import { getCurrentOwner, getOwnerListings } from "@/lib/owner-queries";
import type { Listing, RoomType } from "@/lib/types";

export const metadata: Metadata = buildMetadata({
  title: "My Listings",
  description: "Manage all your HostelPups property listings.",
  path: "/owner/listings",
  noindex: true,
});

const STATUS_LABEL: Record<
  string,
  {
    label: string;
    tone: "verified" | "warning" | "default";
    Icon: React.ComponentType<{ size?: number; className?: string }>;
  }
> = {
  live: { label: "Live", tone: "verified", Icon: CheckCircle2 },
  pending_review: { label: "Pending review", tone: "warning", Icon: Clock },
  paused: { label: "Paused", tone: "default", Icon: Pause },
  draft: { label: "Draft", tone: "default", Icon: Clock },
  full: { label: "Full", tone: "default", Icon: Clock },
  rejected: { label: "Rejected", tone: "warning", Icon: Clock },
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

function gradientFor(id: string): string {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
  const hue = h % 360;
  return `linear-gradient(135deg, hsl(${hue} 70% 60%) 0%, hsl(${(hue + 40) % 360} 70% 50%) 100%)`;
}

export default async function OwnerListingsPage() {
  const current = await getCurrentOwner();
  if (!current) {
    redirect("/owner/login?next=/owner/listings");
  }
  if (!current.owner) {
    redirect("/owner/onboarding");
  }

  const listings = await getOwnerListings();

  return (
    <OwnerLayout businessName={current.owner.business_name}>
      <header className="flex items-end justify-between gap-3 flex-wrap mb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight">My listings</h1>
          <p className="mt-1 text-sm text-[var(--color-ink-muted)]">
            Edit, pause, or delete any of your active listings.
          </p>
        </div>
        <Button href="/owner/listings/new" variant="cta" size="md">
          <Plus size={16} aria-hidden="true" />
          New listing
        </Button>
      </header>

      {listings.length === 0 ? (
        <div className="rounded-2xl border-2 border-dashed border-[var(--color-border-strong)] bg-[var(--color-surface)] p-10 text-center">
          <div className="mx-auto inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--color-brand-100)] text-[var(--color-brand-700)] mb-4">
            <ClipboardList size={28} aria-hidden="true" />
          </div>
          <h2 className="text-xl font-black">
            You don&apos;t have any listings yet
          </h2>
          <p className="mt-2 text-sm text-[var(--color-ink-muted)] max-w-md mx-auto">
            Create your first listing — it takes about 5 minutes. We&apos;ll review it
            within 24 hours and put it live for thousands of renters.
          </p>
          <div className="mt-5">
            <Button href="/owner/listings/new" variant="cta">
              Create your first listing
            </Button>
          </div>
        </div>
      ) : (
        <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-elevated)] overflow-hidden shadow-[var(--shadow-sm)]">
          <table className="w-full text-sm">
            <thead className="bg-[var(--color-surface)] text-[var(--color-ink-subtle)] text-xs uppercase tracking-wider">
              <tr>
                <th scope="col" className="text-left font-semibold py-3 px-4">
                  Listing
                </th>
                <th
                  scope="col"
                  className="text-left font-semibold py-3 px-4 hidden sm:table-cell"
                >
                  Status
                </th>
                <th
                  scope="col"
                  className="text-left font-semibold py-3 px-4 hidden md:table-cell"
                >
                  Vacancies
                </th>
                <th
                  scope="col"
                  className="text-left font-semibold py-3 px-4 hidden lg:table-cell"
                >
                  Updated
                </th>
                <th scope="col" className="text-right font-semibold py-3 px-4">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {listings.map((l) => {
                const cityName = CITY_NAMES[l.city] ?? l.city;
                const minPrice = getMinRoomPrice(l.room_types);
                const statusKey = STATUS_LABEL[l.status] ? l.status : "draft";
                const status = STATUS_LABEL[statusKey];
                const StatusIcon = status.Icon;
                const cover = getCoverUrl(l);

                return (
                  <tr key={l.id} className="border-t border-[var(--color-border)]">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3 min-w-0">
                        <div
                          className="h-12 w-12 rounded-xl shrink-0 bg-cover bg-center"
                          style={
                            cover
                              ? { backgroundImage: `url(${cover})` }
                              : { background: gradientFor(l.id) }
                          }
                          aria-hidden="true"
                        />
                        <div className="min-w-0">
                          <Link
                            href={`/owner/listings/${l.id}/edit`}
                            className="font-bold text-[var(--color-ink)] hover:text-[var(--color-brand-700)] truncate block"
                          >
                            {l.title}
                          </Link>
                          <p className="text-xs text-[var(--color-ink-muted)] truncate">
                            {l.area}, {cityName} · {PROPERTY_TYPES[l.type]}
                            {minPrice !== null && (
                              <>
                                {" · "}
                                <span className="font-semibold">{formatPrice(minPrice)}</span>
                                <span>/mo</span>
                              </>
                            )}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4 hidden sm:table-cell">
                      <Badge tone={status.tone} icon={<StatusIcon size={10} />}>
                        {status.label}
                      </Badge>
                    </td>
                    <td className="py-3 px-4 hidden md:table-cell">
                      {l.total_vacancies ?? 0}
                      <span className="text-[var(--color-ink-subtle)] ml-1 text-xs">
                        / {l.total_beds ?? "?"}
                      </span>
                    </td>
                    <td className="py-3 px-4 hidden lg:table-cell text-[var(--color-ink-muted)]">
                      {timeAgo(l.updated_at)}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1 justify-end">
                        {l.status === "live" ? (
                          <Link
                            href={`/pg/${l.city}/${l.slug}`}
                            aria-label={`View ${l.title} public page`}
                            className="inline-flex h-8 w-8 items-center justify-center rounded-full text-[var(--color-ink-muted)] hover:bg-[var(--color-surface)] hover:text-[var(--color-ink)] transition-colors"
                            title="Public view"
                          >
                            <Eye size={14} aria-hidden="true" />
                          </Link>
                        ) : null}
                        <Link
                          href={`/owner/listings/${l.id}/edit`}
                          aria-label={`Edit ${l.title}`}
                          className="inline-flex h-8 w-8 items-center justify-center rounded-full text-[var(--color-brand-700)] hover:bg-[var(--color-brand-50)] transition-colors"
                          title="Edit"
                        >
                          <Pencil size={14} aria-hidden="true" />
                        </Link>
                        <ListingRowActions
                          id={l.id}
                          status={l.status}
                          title={l.title}
                        />
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </OwnerLayout>
  );
}
