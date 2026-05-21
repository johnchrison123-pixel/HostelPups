import type { Metadata } from "next";
import Link from "next/link";
import { MapPin, ShieldCheck, Lock, Wifi, Car, UtensilsCrossed, Heart, Share2 } from "lucide-react";
import { Container } from "@/components/ui/Container";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { buildMetadata, breadcrumbSchema, lodgingSchema } from "@/lib/seo";
import { CITY_NAMES } from "@/lib/site";

type Props = { params: Promise<{ city: string; slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { city, slug } = await params;
  const cityName = CITY_NAMES[city] ?? city;
  const title = slug
    .split("-")
    .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
    .join(" ");

  return buildMetadata({
    title: `${title} — Verified PG in ${cityName}`,
    description: `${title} — verified PG in ${cityName}. Photos, amenities, prices, and direct chat with the owner. KYC-verified, no brokerage.`,
    path: `/pg/${city}/${slug}`,
  });
}

/**
 * Listing detail page — Phase 1 will fetch real data from Supabase.
 * For now this renders a coming-soon placeholder so the URL structure
 * exists for SEO indexing.
 */
export default async function ListingPage({ params }: Props) {
  const { city, slug } = await params;
  const cityName = CITY_NAMES[city] ?? city;
  const title = slug
    .split("-")
    .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
    .join(" ");

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(breadcrumbSchema([
            { name: "Home", url: "/" },
            { name: cityName, url: `/pg-in-${city}` },
            { name: title, url: `/pg/${city}/${slug}` },
          ])),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(lodgingSchema({
            name: title,
            description: `Verified PG in ${cityName}`,
            url: `/pg/${city}/${slug}`,
            image: [],
            address: { city: cityName, state: "Kerala" },
            priceFrom: 5000,
            amenities: ["WiFi", "Food", "Laundry"],
          })),
        }}
      />

      <Container className="py-8">
        <div className="flex items-center gap-1.5 text-sm text-[var(--color-ink-muted)] mb-4">
          <Link href="/" className="hover:text-[var(--color-brand-700)]">Home</Link>
          <span>/</span>
          <Link href={`/pg-in-${city}`} className="hover:text-[var(--color-brand-700)]">{cityName}</Link>
          <span>/</span>
          <span className="text-[var(--color-ink)]">{title}</span>
        </div>

        {/* Placeholder gallery */}
        <div className="rounded-2xl overflow-hidden bg-gradient-to-br from-[var(--color-brand-300)] to-[var(--color-brand-100)] h-64 sm:h-80 flex items-center justify-center text-[var(--color-brand-800)] font-semibold relative">
          <span>Photo gallery — loads in Phase 1</span>
          <div className="absolute top-4 left-4 flex gap-2">
            <Badge tone="verified" icon={<ShieldCheck size={12} />}>Verified</Badge>
          </div>
          <div className="absolute top-4 right-4 flex gap-2">
            <button className="h-9 w-9 rounded-full bg-white/95 inline-flex items-center justify-center" aria-label="Save">
              <Heart size={16} />
            </button>
            <button className="h-9 w-9 rounded-full bg-white/95 inline-flex items-center justify-center" aria-label="Share">
              <Share2 size={16} />
            </button>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-8 mt-6">
          {/* Main col */}
          <div className="lg:col-span-2 space-y-6">
            <div>
              <h1 className="text-3xl sm:text-4xl font-black">{title}</h1>
              <p className="mt-2 flex items-center gap-1.5 text-[var(--color-ink-muted)]">
                <MapPin size={14} />
                Area in {cityName} (approximate location — exact address after unlock)
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                <Badge tone="brand">PG</Badge>
                <Badge tone="couple" icon={<Heart size={10} />}>Couple-friendly</Badge>
                <Badge>Women only</Badge>
                <Badge>AC available</Badge>
              </div>
            </div>

            <section className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-elevated)] p-6">
              <h2 className="font-bold text-lg mb-3">About this place</h2>
              <p className="text-[var(--color-ink-muted)] leading-relaxed">
                Real listings will appear here in Phase 1. We&apos;re currently onboarding the
                first 500 verified PG owners in Kochi. Owner-uploaded descriptions, amenities,
                room types, and house rules will populate this section.
              </p>
            </section>

            <section className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-elevated)] p-6">
              <h2 className="font-bold text-lg mb-4">Amenities (sample)</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {[
                  { icon: Wifi, label: "WiFi" },
                  { icon: UtensilsCrossed, label: "Food included" },
                  { icon: Car, label: "Parking" },
                ].map((a) => {
                  const Icon = a.icon;
                  return (
                    <div key={a.label} className="flex items-center gap-2 text-sm">
                      <Icon size={18} className="text-[var(--color-brand-700)]" />
                      {a.label}
                    </div>
                  );
                })}
              </div>
            </section>
          </div>

          {/* Side panel */}
          <aside className="space-y-4">
            <div className="rounded-2xl border-2 border-[var(--color-brand-300)] bg-[var(--color-bg-elevated)] p-6 sticky top-20">
              <p className="text-sm text-[var(--color-ink-muted)]">From</p>
              <p className="text-3xl font-black">₹6,500 <span className="text-base font-medium text-[var(--color-ink-muted)]">/ month</span></p>

              <div className="mt-6 rounded-xl bg-[var(--color-surface)] border border-[var(--color-border)] p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Lock size={16} className="text-[var(--color-brand-700)]" />
                  <span className="font-semibold text-sm">Contact details locked</span>
                </div>
                <p className="text-xs text-[var(--color-ink-muted)] mb-3">
                  Unlock owner phone &amp; full address — pay ₹99 for 7-day access to unlimited listings.
                </p>
                <Button href="/signup" variant="cta" fullWidth>
                  Unlock contact — ₹99
                </Button>
              </div>

              <Button href="/login" variant="outline" fullWidth className="mt-3">
                Send inquiry message
              </Button>

              <div className="mt-5 text-xs text-[var(--color-ink-subtle)] flex items-center gap-1.5">
                <ShieldCheck size={12} className="text-emerald-600" />
                Owner KYC verified · Move-in guarantee
              </div>
            </div>
          </aside>
        </div>
      </Container>
    </>
  );
}
