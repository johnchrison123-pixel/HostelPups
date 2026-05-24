import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import {
  ShieldCheck,
  Heart,
  MapPin,
  Star,
  Wifi,
  Utensils,
  Snowflake,
  PawPrint,
  Users,
  GraduationCap,
  HomeIcon,
  Sparkles,
  Building2,
  ParkingCircle,
} from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { CITY_NAMES, PROPERTY_TYPES, WEDGE_TAGS } from "@/lib/site";
import type { Listing, WedgeTag } from "@/lib/types";
import { formatPrice, cn } from "@/lib/utils";
import {
  getListingGradient,
  getListingMinPrice,
} from "@/lib/mockListings";

type WedgeTone = "couple" | "bachelor" | "pet" | "student";

interface WedgeStyle {
  tone: WedgeTone;
  icon: React.ReactNode;
}

/**
 * Map a wedge tag to its display tone + icon. Some tags
 * (women / men / family) reuse the "default" badge tone but
 * are not "wedge" cards — return null so the card skips the overlay.
 */
function pickPrimaryWedge(tags: WedgeTag[]): { tag: WedgeTag; style: WedgeStyle } | null {
  const WEDGE_ORDER: WedgeTag[] = ["couple", "pet", "bachelor", "student"];
  const TONE_MAP: Record<string, WedgeStyle> = {
    couple: { tone: "couple", icon: <Heart size={11} /> },
    bachelor: { tone: "bachelor", icon: <Users size={11} /> },
    pet: { tone: "pet", icon: <PawPrint size={11} /> },
    student: { tone: "student", icon: <GraduationCap size={11} /> },
  };
  for (const tag of WEDGE_ORDER) {
    if (tags.includes(tag)) {
      return { tag, style: TONE_MAP[tag] };
    }
  }
  return null;
}

/** Amenity key -> icon component for the bottom-of-card row. */
const AMENITY_ICONS: Record<
  string,
  { Icon: React.ComponentType<{ size?: number; className?: string }>; label: string }
> = {
  wifi: { Icon: Wifi, label: "Wi-Fi" },
  food: { Icon: Utensils, label: "Meals" },
  ac: { Icon: Snowflake, label: "AC" },
  parking: { Icon: ParkingCircle, label: "Parking" },
  laundry: { Icon: Sparkles, label: "Laundry" },
  power_backup: { Icon: Building2, label: "Power backup" },
};

function buildAmenityChips(amenities: string[]): Array<{ key: string; label: string; Icon: React.ComponentType<{ size?: number; className?: string }> }> {
  const ORDER = ["wifi", "food", "ac", "parking", "laundry", "power_backup"];
  const picked: Array<{ key: string; label: string; Icon: React.ComponentType<{ size?: number; className?: string }> }> = [];
  for (const key of ORDER) {
    if (amenities.includes(key) && AMENITY_ICONS[key]) {
      picked.push({ key, ...AMENITY_ICONS[key] });
      if (picked.length === 3) break;
    }
  }
  return picked;
}

const GENDER_LABEL: Record<string, string> = {
  any: "Co-living",
  women: "Women only",
  men: "Men only",
  couple: "Couple",
  family: "Family",
};

interface ListingCardProps {
  listing: Listing;
  /** Render-level heading. Use 2 inside dedicated listing sections, 3 inside grids on listing pages. */
  headingLevel?: 2 | 3 | 4;
  variant?: "default" | "compact";
  className?: string;
  /** Hide the city in the title row (helpful on city-scoped pages). */
  hideCity?: boolean;
}

export function ListingCard({
  listing: l,
  headingLevel = 3,
  variant = "default",
  className,
  hideCity = false,
}: ListingCardProps) {
  const cityName = CITY_NAMES[l.city] ?? l.city;
  const minPrice = getListingMinPrice(l);
  const wedge = pickPrimaryWedge(l.wedge_tags);
  const wedgeLabel = wedge ? WEDGE_TAGS[wedge.tag] : null;
  const amenityChips = buildAmenityChips(l.amenities);
  const remainingAmenityCount = Math.max(0, l.amenities.length - amenityChips.length);
  const detailHref = `/pg/${l.city}/${l.slug}`;
  const propertyTypeLabel = PROPERTY_TYPES[l.type];
  const HeadingTag = (`h${headingLevel}` as "h2" | "h3" | "h4");
  const cover = l.photos?.find((p) => p.is_cover) ?? l.photos?.[0];

  /* Compact variant — used in dashboards / search list */
  if (variant === "compact") {
    return (
      <article
        className={cn(
          "group flex flex-col sm:flex-row gap-4 rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-elevated)] p-3 shadow-[var(--shadow-sm)] hover:shadow-[var(--shadow-md)] hover:border-[var(--color-brand-400)] transition-all",
          className,
        )}
        itemScope
        itemType="https://schema.org/LodgingBusiness"
      >
        <Link
          href={detailHref}
          aria-label={`View ${l.title} in ${l.area}, ${cityName}`}
          className="relative h-32 sm:h-28 sm:w-44 shrink-0 rounded-xl overflow-hidden"
        >
          {cover?.url ? (
            <Image
              src={cover.url}
              alt={`${l.title} — ${l.area}, ${cityName}`}
              fill
              sizes="(max-width: 640px) 100vw, 176px"
              className="object-cover"
            />
          ) : (
            <div
              className="absolute inset-0"
              style={{ background: getListingGradient(l.id) }}
              role="img"
              aria-label={`${l.title} photo placeholder`}
            />
          )}
          {l.is_verified && (
            <span className="absolute top-1.5 right-1.5 inline-flex items-center gap-1 rounded-full bg-white/95 backdrop-blur-sm px-1.5 py-0.5 text-[9px] font-bold text-emerald-700 shadow-sm">
              <ShieldCheck size={9} className="text-emerald-600" aria-hidden="true" />
              Verified
            </span>
          )}
        </Link>

        <div className="flex flex-1 flex-col">
          <div className="flex items-start justify-between gap-2">
            <HeadingTag className="font-bold text-base leading-snug group-hover:text-[var(--color-brand-700)] transition-colors" itemProp="name">
              <Link href={detailHref}>{l.title}</Link>
            </HeadingTag>
            {wedgeLabel && wedge && (
              <Badge tone={wedge.style.tone} icon={wedge.style.icon} className="shrink-0">
                {wedgeLabel}
              </Badge>
            )}
          </div>
          <p className="mt-0.5 inline-flex items-center gap-1 text-xs text-[var(--color-ink-muted)]">
            <MapPin size={11} className="text-[var(--color-ink-subtle)]" aria-hidden="true" />
            <span itemProp="address">
              {l.area}{!hideCity && `, ${cityName}`}
            </span>
            <span className="mx-1.5">·</span>
            {propertyTypeLabel}
            <span className="mx-1.5">·</span>
            {GENDER_LABEL[l.gender_pref] ?? l.gender_pref}
          </p>

          {minPrice !== null && (
            <p className="mt-auto pt-2 text-sm">
              <span className="text-[var(--color-ink-muted)]">From</span>{" "}
              <span className="text-base font-black text-[var(--color-ink)]">
                {formatPrice(minPrice)}
              </span>
              <span className="text-xs font-medium text-[var(--color-ink-muted)]">/mo</span>
            </p>
          )}
        </div>
      </article>
    );
  }

  /* Default variant — used in grids */
  return (
    <article
      className={cn(
        "group relative flex flex-col overflow-hidden rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-elevated)] shadow-[var(--shadow-sm)] hover:shadow-[var(--shadow-lg)] hover:border-[var(--color-brand-400)] hover:-translate-y-0.5 transition-all",
        className,
      )}
      itemScope
      itemType="https://schema.org/LodgingBusiness"
    >
      {/* Cover image / gradient placeholder (non-link to avoid nested anchors with title link) */}
      <div className="relative h-44 w-full">
        {cover?.url ? (
          <Image
            src={cover.url}
            alt={`${l.title} — ${propertyTypeLabel} in ${l.area}, ${cityName}`}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 360px"
            className="object-cover"
          />
        ) : (
          <div
            className="absolute inset-0"
            style={{ background: getListingGradient(l.id) }}
            role="img"
            aria-label={`${l.title} photo placeholder`}
          />
        )}

        {/* Soft inner overlay for legibility */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent pointer-events-none" />

        {/* Wedge tag top-left */}
        {wedgeLabel && wedge && (
          <span className="absolute top-3 left-3 z-10">
            <Badge
              tone={wedge.style.tone}
              icon={wedge.style.icon}
              className="bg-white/95 backdrop-blur-sm"
            >
              {wedgeLabel}
            </Badge>
          </span>
        )}

        {/* Verified badge top-right */}
        {l.is_verified && (
          <span className="absolute top-3 right-3 z-10 inline-flex items-center gap-1 rounded-full bg-white/95 backdrop-blur-sm px-2.5 py-1 text-[10px] sm:text-xs font-bold text-emerald-700 shadow-sm">
            <ShieldCheck size={12} className="text-emerald-600" aria-hidden="true" />
            Verified
          </span>
        )}

        {/* Property type chip bottom-left */}
        <span className="absolute bottom-3 left-3 inline-flex items-center gap-1 rounded-full bg-black/55 backdrop-blur-sm px-2 py-1 text-[11px] font-semibold text-white">
          <HomeIcon size={11} className="text-white/90" aria-hidden="true" />
          {propertyTypeLabel}
        </span>

        {/* Save / favourite button (top-right, separate from verified badge) */}
        <button
          type="button"
          aria-label={`Save ${l.title} to favourites`}
          className={cn(
            "absolute z-10 inline-flex h-8 w-8 items-center justify-center rounded-full bg-white/90 backdrop-blur-sm text-[var(--color-ink-muted)] shadow-sm hover:text-[var(--color-cta)] hover:bg-white transition-colors",
            l.is_verified ? "top-12 right-3" : "top-3 right-3",
          )}
        >
          <Heart size={14} />
        </button>
      </div>

      {/* Body */}
      <div className="flex flex-1 flex-col p-4">
        <HeadingTag
          className="font-bold text-base leading-tight group-hover:text-[var(--color-brand-700)] transition-colors"
          itemProp="name"
        >
          {/* Whole-card click target — overlay sits above the photo div but below the heart button (z-10 on heart) */}
          <Link href={detailHref} className="after:absolute after:inset-0 after:content-[''] after:rounded-2xl">
            {l.title}
          </Link>
        </HeadingTag>

        <p className="mt-1 inline-flex items-center gap-1 text-xs text-[var(--color-ink-muted)]">
          <MapPin size={11} className="text-[var(--color-ink-subtle)]" aria-hidden="true" />
          <span itemProp="address">
            {l.area}{!hideCity && `, ${cityName}`}
          </span>
        </p>

        {/* Chips row: gender + rating filler */}
        <div className="mt-2 flex items-center gap-2 flex-wrap">
          <span className="inline-flex items-center gap-1 rounded-full bg-[var(--color-surface)] px-2 py-0.5 text-[10px] font-semibold text-[var(--color-ink-muted)] uppercase tracking-wide">
            {GENDER_LABEL[l.gender_pref] ?? l.gender_pref}
          </span>
          {l.is_verified && (
            <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-[var(--color-ink-muted)]">
              <Star size={10} className="fill-amber-400 text-amber-400" aria-hidden="true" />
              4.{(parseInt(l.id.replace(/\D/g, "")) % 9) + 1} (new)
            </span>
          )}
        </div>

        {/* Amenities */}
        {amenityChips.length > 0 && (
          <div className="mt-3 flex items-center gap-3 text-[var(--color-ink-subtle)]">
            {amenityChips.map((a) => {
              const Icon = a.Icon;
              return (
                <span
                  key={a.key}
                  className="inline-flex items-center gap-1 text-[11px]"
                  title={a.label}
                >
                  <Icon size={13} aria-hidden="true" />
                  <span className="sr-only">{a.label}</span>
                </span>
              );
            })}
            {remainingAmenityCount > 0 && (
              <span className="text-[11px]">· +{remainingAmenityCount} more</span>
            )}
          </div>
        )}

        {/* Price footer */}
        <div className="mt-4 pt-3 border-t border-[var(--color-border)] flex items-end justify-between">
          <div>
            <span className="block text-[10px] uppercase tracking-wider text-[var(--color-ink-subtle)] font-semibold">
              From
            </span>
            <span className="text-lg font-black text-[var(--color-ink)]" itemProp="priceRange">
              {minPrice !== null ? formatPrice(minPrice) : "On request"}
              {minPrice !== null && (
                <span className="text-xs font-medium text-[var(--color-ink-muted)]"> /mo</span>
              )}
            </span>
          </div>
          <span className="text-sm font-semibold text-[var(--color-brand-700)] group-hover:underline">
            View
          </span>
        </div>
      </div>
    </article>
  );
}

/* Re-exports so callers do not need to dig into mockListings just to render gradient bg */
export { getListingGradient };
