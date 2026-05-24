import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  MapPin,
  ShieldCheck,
  Lock,
  Wifi,
  Car,
  UtensilsCrossed,
  Heart,
  Share2,
  Snowflake,
  Dumbbell,
  ShieldAlert,
  Droplets,
  Sparkles,
  BatteryCharging,
  BookOpen,
  ChefHat,
  TreePalm,
  ParkingCircle,
  Bed,
  CalendarClock,
  CheckCircle2,
  Users,
  PawPrint,
  GraduationCap,
} from "lucide-react";
import { Container } from "@/components/ui/Container";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { ListingGrid } from "@/components/listings/ListingGrid";
import { buildMetadata, breadcrumbSchema, lodgingSchema } from "@/lib/seo";
import { CITY_NAMES, PROPERTY_TYPES, WEDGE_TAGS } from "@/lib/site";
import {
  getAllListings,
  getListingBySlug,
  getListingsByCity,
  getListingMinPrice,
  getListingGradient,
} from "@/lib/mockListings";
import { getOwnerById } from "@/lib/mockOwners";
import { formatPrice } from "@/lib/utils";
import type { WedgeTag } from "@/lib/types";

type Props = { params: Promise<{ city: string; slug: string }> };

/* ============================================================
   Metadata + static params (every mock slug pre-renders for SEO)
   ============================================================ */

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { city, slug } = await params;
  const listing = getListingBySlug(city, slug);
  const cityName = CITY_NAMES[city] ?? city;

  if (!listing) {
    // Title still constructed from slug so 404 page has useful metadata
    const title = slug
      .split("-")
      .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
      .join(" ");
    return buildMetadata({
      title: `${title} — PG in ${cityName}`,
      description: `Listing details for ${title} in ${cityName}. KYC-verified PG, hostel, and rental options on HostelPups.`,
      path: `/pg/${city}/${slug}`,
    });
  }

  const minPrice = getListingMinPrice(listing);
  const priceCopy = minPrice !== null ? ` From ${formatPrice(minPrice)}/month.` : "";
  return buildMetadata({
    title: `${listing.title} — ${PROPERTY_TYPES[listing.type]} in ${listing.area}, ${cityName}`,
    description: `${listing.title} in ${listing.area}, ${cityName}.${priceCopy} ${listing.description}`.slice(0, 200),
    path: `/pg/${city}/${listing.slug}`,
    keywords: [
      `${listing.title}`,
      `PG in ${listing.area}`,
      `${PROPERTY_TYPES[listing.type]} ${cityName}`,
      ...listing.wedge_tags.map((t) => `${WEDGE_TAGS[t]} ${cityName}`),
    ],
  });
}

/** Pre-render every mock listing as static HTML for max SEO + speed */
export function generateStaticParams() {
  return getAllListings().map((l) => ({ city: l.city, slug: l.slug }));
}

/* ============================================================
   Amenity icon registry
   ============================================================ */

const AMENITY_REGISTRY: Record<string, { Icon: React.ComponentType<{ size?: number; className?: string }>; label: string }> = {
  wifi: { Icon: Wifi, label: "Wi-Fi" },
  food: { Icon: UtensilsCrossed, label: "Meals included" },
  ac: { Icon: Snowflake, label: "Air conditioning" },
  gym: { Icon: Dumbbell, label: "Gym access" },
  security: { Icon: ShieldAlert, label: "24/7 security" },
  hot_water: { Icon: Droplets, label: "Hot water" },
  laundry: { Icon: Sparkles, label: "Laundry service" },
  power_backup: { Icon: BatteryCharging, label: "Power backup" },
  housekeeping: { Icon: Sparkles, label: "Housekeeping" },
  study_room: { Icon: BookOpen, label: "Study room" },
  common_kitchen: { Icon: ChefHat, label: "Common kitchen" },
  balcony: { Icon: TreePalm, label: "Balcony" },
  parking: { Icon: ParkingCircle, label: "Parking" },
  terrace_access: { Icon: TreePalm, label: "Terrace access" },
};

const WEDGE_ICON: Record<WedgeTag, React.ReactNode> = {
  couple: <Heart size={11} />,
  bachelor: <Users size={11} />,
  pet: <PawPrint size={11} />,
  student: <GraduationCap size={11} />,
  family: <Users size={11} />,
  women: <Users size={11} />,
  men: <Users size={11} />,
};

const WEDGE_TONE_MAP: Record<WedgeTag, "couple" | "bachelor" | "pet" | "student" | "default"> = {
  couple: "couple",
  bachelor: "bachelor",
  pet: "pet",
  student: "student",
  family: "default",
  women: "default",
  men: "default",
};

const GENDER_LABEL: Record<string, string> = {
  any: "Co-living (any gender)",
  women: "Women only",
  men: "Men only",
  couple: "Couples welcome",
  family: "Family",
};

/* ============================================================
   Page
   ============================================================ */

export default async function ListingPage({ params }: Props) {
  const { city, slug } = await params;
  const listing = getListingBySlug(city, slug);
  if (!listing) notFound();

  const cityName = CITY_NAMES[city] ?? city;
  const minPrice = getListingMinPrice(listing);
  const owner = getOwnerById(listing.owner_id);
  const propertyTypeLabel = PROPERTY_TYPES[listing.type];

  // 3 sibling listings in the same city (excluding this one)
  const siblings = getListingsByCity(city)
    .filter((l) => l.id !== listing.id)
    .slice(0, 3);

  const gradient = getListingGradient(listing.id);

  return (
    <>
      {/* JSON-LD: breadcrumbs + LodgingBusiness */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(breadcrumbSchema([
            { name: "Home", url: "/" },
            { name: cityName, url: `/pg-in-${city}` },
            { name: listing.title, url: `/pg/${city}/${listing.slug}` },
          ])),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(lodgingSchema({
            name: listing.title,
            description: listing.description,
            url: `/pg/${city}/${listing.slug}`,
            image: listing.photos?.map((p) => p.url) ?? [],
            address: { city: cityName, area: listing.area },
            priceFrom: minPrice ?? 0,
            amenities: listing.amenities.map(
              (a) => AMENITY_REGISTRY[a]?.label ?? a,
            ),
          })),
        }}
      />

      <Container className="py-8">
        {/* Breadcrumb */}
        <nav
          aria-label="Breadcrumb"
          className="flex items-center gap-1.5 text-sm text-[var(--color-ink-muted)] mb-4 flex-wrap"
        >
          <Link href="/" className="hover:text-[var(--color-brand-700)]">Home</Link>
          <span aria-hidden="true">/</span>
          <Link href={`/pg-in-${city}`} className="hover:text-[var(--color-brand-700)]">
            PGs in {cityName}
          </Link>
          <span aria-hidden="true">/</span>
          <span className="text-[var(--color-ink)]">{listing.title}</span>
        </nav>

        {/* Gallery (gradient slideshow placeholder until real photos land) */}
        <div
          className="relative rounded-2xl overflow-hidden h-64 sm:h-80 lg:h-96 flex items-end p-6"
          style={{ background: gradient }}
          role="img"
          aria-label={`${listing.title} cover photo placeholder`}
        >
          <div className="absolute inset-0 bg-gradient-to-t from-black/35 via-black/10 to-transparent" />

          <div className="absolute top-4 left-4 flex gap-2 flex-wrap">
            {listing.is_verified && (
              <Badge tone="verified" icon={<ShieldCheck size={12} />}>
                Verified
              </Badge>
            )}
            <Badge tone="brand">{propertyTypeLabel}</Badge>
          </div>

          <div className="absolute top-4 right-4 flex gap-2">
            <button
              type="button"
              aria-label="Save to favourites"
              className="h-9 w-9 rounded-full bg-white/95 inline-flex items-center justify-center hover:bg-white transition-colors"
            >
              <Heart size={16} className="text-[var(--color-ink-muted)]" />
            </button>
            <button
              type="button"
              aria-label="Share listing"
              className="h-9 w-9 rounded-full bg-white/95 inline-flex items-center justify-center hover:bg-white transition-colors"
            >
              <Share2 size={16} className="text-[var(--color-ink-muted)]" />
            </button>
          </div>

          <p className="relative text-sm text-white/90 font-medium">
            Photo gallery loading in Phase 1 — owner pictures coming soon
          </p>
        </div>

        {/* Main + sidebar */}
        <div className="grid lg:grid-cols-3 gap-8 mt-6">
          <div className="lg:col-span-2 space-y-6">
            <header>
              <h1 className="text-3xl sm:text-4xl font-black tracking-tight">
                {listing.title}
              </h1>
              <p className="mt-2 flex items-center gap-1.5 text-[var(--color-ink-muted)]">
                <MapPin size={14} aria-hidden="true" />
                {listing.area}, {cityName}
                {listing.landmark && (
                  <span className="text-[var(--color-ink-subtle)]">
                    — near {listing.landmark}
                  </span>
                )}
              </p>

              <div className="mt-3 flex flex-wrap gap-2">
                <Badge tone="brand">{propertyTypeLabel}</Badge>
                <Badge>{GENDER_LABEL[listing.gender_pref] ?? listing.gender_pref}</Badge>
                {listing.wedge_tags.map((t) => (
                  <Badge
                    key={t}
                    tone={WEDGE_TONE_MAP[t]}
                    icon={WEDGE_ICON[t]}
                  >
                    {WEDGE_TAGS[t]}
                  </Badge>
                ))}
              </div>
            </header>

            {/* About */}
            <section
              aria-labelledby="about-heading"
              className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-elevated)] p-6"
            >
              <h2 id="about-heading" className="font-bold text-lg mb-3">
                About this place
              </h2>
              <p className="text-[var(--color-ink-muted)] leading-relaxed">
                {listing.description}
              </p>

              {/* Quick stats row */}
              <dl className="mt-5 grid grid-cols-2 sm:grid-cols-3 gap-4 text-sm">
                {listing.total_beds !== undefined && (
                  <div>
                    <dt className="text-[var(--color-ink-subtle)] text-xs uppercase tracking-wider">Total beds</dt>
                    <dd className="font-semibold mt-0.5 flex items-center gap-1.5">
                      <Bed size={14} className="text-[var(--color-brand-600)]" aria-hidden="true" />
                      {listing.total_beds}
                    </dd>
                  </div>
                )}
                {listing.total_vacancies !== undefined && (
                  <div>
                    <dt className="text-[var(--color-ink-subtle)] text-xs uppercase tracking-wider">Vacancies</dt>
                    <dd className="font-semibold mt-0.5 flex items-center gap-1.5">
                      <CheckCircle2 size={14} className="text-emerald-600" aria-hidden="true" />
                      {listing.total_vacancies} available
                    </dd>
                  </div>
                )}
                <div>
                  <dt className="text-[var(--color-ink-subtle)] text-xs uppercase tracking-wider">Available from</dt>
                  <dd className="font-semibold mt-0.5 flex items-center gap-1.5">
                    <CalendarClock size={14} className="text-[var(--color-brand-600)]" aria-hidden="true" />
                    Immediately
                  </dd>
                </div>
              </dl>
            </section>

            {/* Amenities */}
            <section
              aria-labelledby="amenities-heading"
              className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-elevated)] p-6"
            >
              <h2 id="amenities-heading" className="font-bold text-lg mb-4">
                Amenities
              </h2>
              <ul className="grid grid-cols-2 sm:grid-cols-3 gap-3" role="list">
                {listing.amenities.map((key) => {
                  const reg = AMENITY_REGISTRY[key];
                  const Icon = reg?.Icon ?? Car;
                  const label = reg?.label ?? key.replace(/_/g, " ");
                  return (
                    <li key={key} className="flex items-center gap-2 text-sm">
                      <Icon size={18} className="text-[var(--color-brand-700)]" aria-hidden="true" />
                      <span>{label}</span>
                    </li>
                  );
                })}
              </ul>
            </section>

            {/* Room types */}
            {listing.room_types && listing.room_types.length > 0 && (
              <section
                aria-labelledby="rooms-heading"
                className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-elevated)] p-6"
              >
                <h2 id="rooms-heading" className="font-bold text-lg mb-4">
                  Room types &amp; pricing
                </h2>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-left text-[var(--color-ink-subtle)] text-xs uppercase tracking-wider border-b border-[var(--color-border)]">
                        <th scope="col" className="py-2 pr-3 font-semibold">Room</th>
                        <th scope="col" className="py-2 px-3 font-semibold">AC</th>
                        <th scope="col" className="py-2 px-3 font-semibold">Occupancy</th>
                        <th scope="col" className="py-2 px-3 font-semibold">Vacancies</th>
                        <th scope="col" className="py-2 pl-3 font-semibold text-right">Price / month</th>
                      </tr>
                    </thead>
                    <tbody>
                      {listing.room_types.map((rt) => (
                        <tr key={rt.id} className="border-b border-[var(--color-border)] last:border-0">
                          <td className="py-3 pr-3 font-semibold">{rt.name}</td>
                          <td className="py-3 px-3">{rt.ac ? "Yes" : "No"}</td>
                          <td className="py-3 px-3">{rt.occupancy} person{rt.occupancy > 1 ? "s" : ""}</td>
                          <td className="py-3 px-3">
                            {rt.vacancies > 0 ? (
                              <span className="text-emerald-700 font-semibold">{rt.vacancies} left</span>
                            ) : (
                              <span className="text-[var(--color-ink-subtle)]">Full</span>
                            )}
                          </td>
                          <td className="py-3 pl-3 text-right font-black">
                            {formatPrice(rt.price_per_month)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>
            )}

            {/* House rules */}
            {listing.house_rules.length > 0 && (
              <section
                aria-labelledby="rules-heading"
                className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-elevated)] p-6"
              >
                <h2 id="rules-heading" className="font-bold text-lg mb-3">
                  House rules
                </h2>
                <ul className="space-y-2" role="list">
                  {listing.house_rules.map((r) => (
                    <li key={r} className="flex items-start gap-2 text-sm">
                      <CheckCircle2
                        size={16}
                        className="text-[var(--color-brand-600)] mt-0.5 shrink-0"
                        aria-hidden="true"
                      />
                      <span>{r}</span>
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {/* Owner card */}
            {owner && (
              <section
                aria-labelledby="owner-heading"
                className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-elevated)] p-6"
              >
                <h2 id="owner-heading" className="font-bold text-lg mb-3">
                  Hosted by
                </h2>
                <div className="flex items-center gap-3">
                  <div
                    className="h-12 w-12 rounded-full inline-flex items-center justify-center text-white font-black text-lg shrink-0"
                    style={{ background: getListingGradient(owner.id) }}
                    aria-hidden="true"
                  >
                    {owner.business_name.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold flex items-center gap-1.5">
                      {owner.business_name}
                      {owner.has_verification_badge && (
                        <ShieldCheck size={14} className="text-emerald-600" aria-label="Verified owner" />
                      )}
                    </p>
                    <p className="text-xs text-[var(--color-ink-muted)]">
                      {owner.tier === "full_service" ? "HostelPups Full-Service Partner" : "HostelPups Self-Serve Owner"}
                      <span className="mx-1.5">·</span>
                      Typically responds within 2 hours
                    </p>
                  </div>
                </div>
              </section>
            )}
          </div>

          {/* Side panel */}
          <aside className="space-y-4">
            <div className="rounded-2xl border-2 border-[var(--color-brand-300)] bg-[var(--color-bg-elevated)] p-6 sticky top-20">
              <p className="text-sm text-[var(--color-ink-muted)]">From</p>
              <p className="text-3xl font-black">
                {minPrice !== null ? formatPrice(minPrice) : "On request"}{" "}
                <span className="text-base font-medium text-[var(--color-ink-muted)]">
                  / month
                </span>
              </p>

              <div className="mt-6 rounded-xl bg-[var(--color-surface)] border border-[var(--color-border)] p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Lock size={16} className="text-[var(--color-brand-700)]" aria-hidden="true" />
                  <span className="font-semibold text-sm">Contact details locked</span>
                </div>
                <p className="text-xs text-[var(--color-ink-muted)] mb-3">
                  Unlock owner phone &amp; full address — pay {formatPrice(99)} for 7-day access to unlimited listings.
                </p>
                <Button href="/signup" variant="cta" fullWidth>
                  Unlock contact — {formatPrice(99)}
                </Button>
              </div>

              <Button href="/login" variant="outline" fullWidth className="mt-3">
                Send inquiry message
              </Button>

              <div className="mt-5 text-xs text-[var(--color-ink-subtle)] flex items-center gap-1.5">
                <ShieldCheck size={12} className="text-emerald-600" aria-hidden="true" />
                {listing.is_verified
                  ? "Owner KYC verified · Move-in guarantee"
                  : "Verification in progress — chat available after KYC"}
              </div>
            </div>
          </aside>
        </div>

        {/* Similar listings */}
        {siblings.length > 0 && (
          <section
            aria-labelledby="similar-heading"
            className="mt-16"
          >
            <h2 id="similar-heading" className="text-2xl font-black tracking-tight mb-6">
              More verified PGs in {cityName}
            </h2>
            <ListingGrid
              listings={siblings}
              columns={3}
              headingLevel={3}
              hideCity
            />
          </section>
        )}
      </Container>
    </>
  );
}
