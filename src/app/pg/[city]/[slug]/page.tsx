import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
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
import { CITY_NAMES, PROPERTY_TYPES, WEDGE_TAGS, PRICING } from "@/lib/site";
import {
  getListingMinPrice,
  getListingGradient,
} from "@/lib/mockListings";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth";
import { formatPrice } from "@/lib/utils";
import { InquiryStartButton } from "@/components/chat/InquiryStartButton";
import { CallButton } from "@/components/call/CallButton";
import type { Listing, WedgeTag, PropertyType, RoomType } from "@/lib/types";

type Props = { params: Promise<{ city: string; slug: string }> };

/**
 * Owner data shape returned from the joined `owners:owner_id (...)` select.
 *
 * NOTE: `contact_phone` is intentionally NOT selected — it must never be sent
 * to the public page (admin/paying-user-only). Anti-disintermediation rule.
 */
interface JoinedOwner {
  id: string;
  business_name: string;
  has_verification_badge: boolean;
  tier: "self_serve" | "full_service";
}

/* ============================================================
   Metadata + static params (every live slug pre-renders for SEO)
   ============================================================ */

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { city, slug } = await params;
  const cityName = CITY_NAMES[city] ?? city;
  const supabase = await createClient();

  const { data: listing, error } = await supabase
    .from("listings")
    .select("title, description, area, type, wedge_tags, room_types(price_per_month)")
    .eq("city", city)
    .eq("slug", slug)
    .maybeSingle();

  if (error) {
    console.error("generateMetadata listing query failed:", error.message);
  }

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
      noindex: true,
    });
  }

  const roomPrices = (listing.room_types ?? []) as Array<{ price_per_month: number }>;
  const minPrice = roomPrices.length
    ? Math.min(...roomPrices.map((rt) => Number(rt.price_per_month)))
    : null;
  const priceCopy = minPrice !== null ? ` From ${formatPrice(minPrice)}/month.` : "";
  const typeLabel = PROPERTY_TYPES[listing.type as PropertyType] ?? listing.type;
  const wedgeTags = (listing.wedge_tags ?? []) as WedgeTag[];

  return buildMetadata({
    title: `${listing.title} — ${typeLabel} in ${listing.area}, ${cityName}`,
    description: `${listing.title} in ${listing.area}, ${cityName}.${priceCopy} ${listing.description ?? ""}`.slice(0, 200),
    path: `/pg/${city}/${slug}`,
    keywords: [
      `${listing.title}`,
      `PG in ${listing.area}`,
      `${typeLabel} ${cityName}`,
      ...wedgeTags.map((t) => `${WEDGE_TAGS[t] ?? t} ${cityName}`),
    ],
  });
}

/**
 * Pre-render every live listing as static HTML for max SEO + speed.
 *
 * Note: `generateStaticParams` runs at build time without an HTTP request, so
 * we can't use the cookie-aware server client (cookies() throws here). Use a
 * plain anon client instead — listings with status='live' are public via RLS,
 * so anonymous access is sufficient.
 */
export async function generateStaticParams() {
  const { createClient: createAnonClient } = await import("@supabase/supabase-js");
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseAnon) {
    // Env not set at build time — fall back to empty static params so build
    // doesn't break. Pages still render on-demand via fallback.
    return [];
  }
  const supabase = createAnonClient(supabaseUrl, supabaseAnon, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data, error } = await supabase
    .from("listings")
    .select("city, slug")
    .eq("status", "live");

  if (error) {
    console.error("generateStaticParams query failed:", error.message);
    return [];
  }

  return (data ?? []).map((l) => ({ city: l.city as string, slug: l.slug as string }));
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
  const supabase = await createClient();
  // We need the auth state at render time so the "Send inquiry message" button
  // can decide whether to open the inquiry-modal (logged in) or route to /login.
  const currentUser = await getCurrentUser();

  // Fetch the listing with relations
  const { data: rawListing, error: listingError } = await supabase
    .from("listings")
    .select(
      `*,
       room_types (*),
       photos:listing_photos (*),
       owners:owner_id (
         id,
         business_name,
         has_verification_badge,
         tier
       )`,
    )
    .eq("city", city)
    .eq("slug", slug)
    .maybeSingle();

  if (listingError) {
    console.error("ListingPage listing query failed:", listingError.message);
  }
  if (!rawListing) notFound();

  const listing = rawListing as unknown as Listing & { owners?: JoinedOwner | null };
  const owner: JoinedOwner | null = listing.owners ?? null;

  const cityName = CITY_NAMES[city] ?? city;
  const minPrice = getListingMinPrice(listing);
  const propertyTypeLabel = PROPERTY_TYPES[listing.type];

  // 3 sibling listings in the same city (excluding this one)
  const { data: siblingRows, error: siblingsError } = await supabase
    .from("listings")
    .select("*, room_types(*), photos:listing_photos(*)")
    .eq("city", city)
    .eq("status", "live")
    .neq("id", listing.id)
    .order("is_verified", { ascending: false })
    .order("updated_at", { ascending: false })
    .limit(3);

  if (siblingsError) {
    console.error("ListingPage siblings query failed:", siblingsError.message);
  }

  const siblings = (siblingRows ?? []) as unknown as Listing[];

  const gradient = getListingGradient(listing.id);
  const roomTypes: RoomType[] = (listing.room_types ?? []) as RoomType[];
  const houseRules = listing.house_rules ?? [];
  const wedgeTags = listing.wedge_tags ?? [];

  // Photos: sort ascending by display_order, then pick cover-tagged photo as
  // hero (falling back to the first photo). The remaining (up to 4) render in
  // a thumbnail strip beside the hero on desktop / below it on mobile.
  const sortedPhotos = [...(listing.photos ?? [])].sort(
    (a, b) => (a.display_order ?? 0) - (b.display_order ?? 0),
  );
  const coverPhoto =
    sortedPhotos.find((p) => p.is_cover) ?? sortedPhotos[0] ?? null;
  const thumbPhotos = sortedPhotos
    .filter((p) => p.id !== coverPhoto?.id)
    .slice(0, 4);
  const hasPhotos = sortedPhotos.length > 0;

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

        {/* Gallery — real owner photos when available, gradient placeholder when not */}
        {hasPhotos && coverPhoto ? (
          <div className="grid lg:grid-cols-[2fr_1fr] gap-2 lg:gap-3">
            {/* Hero photo */}
            <div className="relative rounded-2xl overflow-hidden h-64 sm:h-80 lg:h-[28rem] bg-[var(--color-surface)]">
              <Image
                src={coverPhoto.url}
                alt={`${listing.title} — cover photo (${listing.area}, ${cityName})`}
                fill
                priority
                sizes="(max-width: 1024px) 100vw, 66vw"
                className="object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/35 via-black/5 to-transparent pointer-events-none" />

              {/* Top-left badges */}
              <div className="absolute top-4 left-4 flex gap-2 flex-wrap">
                {listing.is_verified && (
                  <Badge tone="verified" icon={<ShieldCheck size={12} />}>
                    Verified
                  </Badge>
                )}
                <Badge tone="brand">{propertyTypeLabel}</Badge>
              </div>

              {/* Top-right actions */}
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

              {/* Total photo count */}
              {sortedPhotos.length > 1 && (
                <p className="absolute bottom-4 right-4 rounded-full bg-black/55 backdrop-blur-sm px-3 py-1 text-xs font-semibold text-white">
                  {sortedPhotos.length} photos
                </p>
              )}
            </div>

            {/* Thumbnail grid — desktop only, max 4 thumbs */}
            {thumbPhotos.length > 0 && (
              <div className="hidden lg:grid grid-cols-2 grid-rows-2 gap-2 lg:gap-3 h-[28rem]">
                {thumbPhotos.map((p, idx) => (
                  <div
                    key={p.id}
                    className="relative rounded-2xl overflow-hidden bg-[var(--color-surface)]"
                  >
                    <Image
                      src={p.url}
                      alt={`${listing.title} — photo ${idx + 2}`}
                      fill
                      sizes="(max-width: 1024px) 50vw, 25vw"
                      className="object-cover"
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          // No photos uploaded yet — keep gradient placeholder with "coming soon" badge
          <div
            className="relative rounded-2xl overflow-hidden h-64 sm:h-80 lg:h-96 flex items-end p-6"
            style={{ background: gradient }}
            role="img"
            aria-label={`${listing.title} photo placeholder`}
          >
            <div className="absolute inset-0 bg-gradient-to-t from-black/35 via-black/10 to-transparent" />

            <div className="absolute top-4 left-4 flex gap-2 flex-wrap">
              {listing.is_verified && (
                <Badge tone="verified" icon={<ShieldCheck size={12} />}>
                  Verified
                </Badge>
              )}
              <Badge tone="brand">{propertyTypeLabel}</Badge>
              <span className="inline-flex items-center gap-1 rounded-full bg-white/95 px-3 py-1 text-xs font-semibold text-[var(--color-ink-muted)]">
                Photos coming soon
              </span>
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
              Owner photos coming soon — message below to ask the owner for pictures.
            </p>
          </div>
        )}

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
                {wedgeTags.map((t) => (
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
                {listing.total_beds !== undefined && listing.total_beds !== null && (
                  <div>
                    <dt className="text-[var(--color-ink-subtle)] text-xs uppercase tracking-wider">Total beds</dt>
                    <dd className="font-semibold mt-0.5 flex items-center gap-1.5">
                      <Bed size={14} className="text-[var(--color-brand-600)]" aria-hidden="true" />
                      {listing.total_beds}
                    </dd>
                  </div>
                )}
                {listing.total_vacancies !== undefined && listing.total_vacancies !== null && (
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
            {roomTypes.length > 0 && (
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
                      {roomTypes.map((rt) => (
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
                            {formatPrice(Number(rt.price_per_month))}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>
            )}

            {/* House rules */}
            {houseRules.length > 0 && (
              <section
                aria-labelledby="rules-heading"
                className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-elevated)] p-6"
              >
                <h2 id="rules-heading" className="font-bold text-lg mb-3">
                  House rules
                </h2>
                <ul className="space-y-2" role="list">
                  {houseRules.map((r) => (
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

            {/* Owner card — never expose contact_phone in public UI */}
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
                  Unlock owner phone &amp; full address — pay {formatPrice(PRICING.user.week.price)} for 7-day access to unlimited listings.
                </p>
                <Button
                  href={`/signup?next=${encodeURIComponent(`/pg/${city}/${slug}`)}`}
                  variant="cta"
                  fullWidth
                >
                  Unlock contact — {formatPrice(PRICING.user.week.price)}
                </Button>
              </div>

              <InquiryStartButton
                listingId={listing.id}
                listingTitle={listing.title}
                ownerName={owner?.business_name ?? "the owner"}
                userIsAuthed={Boolean(currentUser)}
                loginNext={`/pg/${city}/${slug}`}
              />

              {/* In-app voice call — no phone number exposed. Routes via WebRTC. */}
              <div className="mt-3">
                <CallButton
                  listingId={listing.id}
                  listingCity={city}
                  listingSlug={slug}
                  variant="primary"
                  fullWidth
                />
              </div>

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
