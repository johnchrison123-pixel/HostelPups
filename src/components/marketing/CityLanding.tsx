import * as React from "react";
import Link from "next/link";
import { MapPin, ShieldCheck, ArrowRight, ArrowUpRight, Heart, Users, PawPrint } from "lucide-react";
import { Container } from "@/components/ui/Container";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { ListingGrid } from "@/components/listings/ListingGrid";
import { CITY_NAMES } from "@/lib/site";
import { getListingsByCity } from "@/lib/mockListings";

interface CityLandingProps {
  city: string;
  state?: string;
  areas: string[];
  intro?: string;
  totalListings?: number;
}

export function CityLanding({
  city,
  state = "India",
  areas,
  intro,
  totalListings,
}: CityLandingProps) {
  const cityName = CITY_NAMES[city] ?? city;
  const cityListings = getListingsByCity(city, 6);
  const totalCityListings = getListingsByCity(city).length;

  const defaultIntro = `Find verified PGs, hostels, and rental flats in ${cityName}. From budget-friendly student PGs near colleges to couple-friendly flats in tech parks — all verified, all direct from owners. No brokers. No hidden fees.`;

  return (
    <>
      {/* Hero */}
      <section className="relative pt-12 sm:pt-16 pb-12 overflow-hidden">
        <div className="absolute -top-32 right-1/3 h-96 w-96 rounded-full bg-[var(--color-brand-200)] opacity-40 blur-3xl pointer-events-none" />

        <Container className="relative">
          <div className="flex items-center gap-1.5 text-sm text-[var(--color-ink-muted)] mb-3">
            <Link href="/" className="hover:text-[var(--color-brand-700)]">Home</Link>
            <span>/</span>
            <Link href="/search" className="hover:text-[var(--color-brand-700)]">PGs</Link>
            <span>/</span>
            <span className="text-[var(--color-ink)]">{cityName}</span>
          </div>

          <div className="flex items-center gap-2 mb-4">
            <MapPin size={20} className="text-[var(--color-brand-600)]" />
            <span className="text-sm font-semibold text-[var(--color-ink-muted)]">{state}</span>
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-[1.05]">
            PG in {cityName} —{" "}
            <span className="bg-gradient-to-r from-[var(--color-brand-600)] to-[var(--color-cta)] bg-clip-text text-transparent">
              verified, no brokers
            </span>
          </h1>

          <p className="mt-6 text-lg text-[var(--color-ink-muted)] max-w-3xl leading-relaxed">
            {intro ?? defaultIntro}
          </p>

          {totalListings && (
            <p className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-full px-3 py-1.5">
              <ShieldCheck size={14} />
              {totalListings}+ verified listings in {cityName}
            </p>
          )}

          <div className="mt-8 flex flex-wrap gap-3">
            <Button href={`/search?city=${city}`} variant="cta" size="lg">
              Search {cityName} PGs
              <ArrowRight size={18} />
            </Button>
            <Button href="/signup" variant="outline" size="lg">
              Sign up to contact owners
            </Button>
          </div>
        </Container>
      </section>

      {/* Wedge filters */}
      <section className="py-8 border-y border-[var(--color-border)] bg-[var(--color-surface)]">
        <Container>
          <div className="flex items-center gap-2 mb-3 text-sm font-semibold text-[var(--color-ink-muted)]">
            Quick filters for {cityName}:
          </div>
          <div className="flex flex-wrap gap-2">
            <Link href={`/couple-friendly-pg/${city}`}>
              <Badge tone="couple" icon={<Heart size={12} />}>
                Couple-friendly PG in {cityName}
              </Badge>
            </Link>
            <Link href={`/bachelor-friendly-pg/${city}`}>
              <Badge tone="bachelor" icon={<Users size={12} />}>
                Bachelor-friendly PG in {cityName}
              </Badge>
            </Link>
            <Link href={`/pet-friendly-pg/${city}`}>
              <Badge tone="pet" icon={<PawPrint size={12} />}>
                Pet-friendly PG in {cityName}
              </Badge>
            </Link>
            <Link href={`/search?city=${city}&gender=women`}>
              <Badge>Women-only PGs</Badge>
            </Link>
            <Link href={`/search?city=${city}&gender=men`}>
              <Badge>Men-only PGs</Badge>
            </Link>
          </div>
        </Container>
      </section>

      {/* Areas */}
      <section className="py-16">
        <Container>
          <h2 className="text-3xl font-black tracking-tight mb-2">
            Popular areas in {cityName}
          </h2>
          <p className="text-[var(--color-ink-muted)] mb-8">
            Browse PGs by the most-requested neighborhoods.
          </p>

          <div className="grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {areas.map((area) => (
              <Link
                key={area}
                href={`/search?city=${city}&area=${encodeURIComponent(area.toLowerCase())}`}
                className="group rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-elevated)] p-4 hover:border-[var(--color-brand-400)] hover:shadow-[var(--shadow-sm)] transition-all"
              >
                <div className="flex items-center justify-between">
                  <span className="font-semibold">{area}</span>
                  <ArrowRight size={16} className="text-[var(--color-ink-subtle)] group-hover:text-[var(--color-brand-700)] group-hover:translate-x-0.5 transition-all" />
                </div>
                <p className="text-xs text-[var(--color-ink-muted)] mt-1">
                  PGs in {area}, {cityName}
                </p>
              </Link>
            ))}
          </div>
        </Container>
      </section>

      {/* Top listings in this city */}
      <section
        className="py-16 bg-[var(--color-bg)]"
        aria-labelledby={`top-${city}-listings-heading`}
      >
        <Container>
          <div className="flex items-end justify-between flex-wrap gap-4 mb-8">
            <div>
              <p className="text-sm font-semibold text-[var(--color-brand-700)] uppercase tracking-wider">
                Live now
              </p>
              <h2
                id={`top-${city}-listings-heading`}
                className="mt-2 text-3xl font-black tracking-tight"
              >
                Top verified PGs in {cityName}
              </h2>
              <p className="mt-2 text-[var(--color-ink-muted)] max-w-xl">
                Direct chat with KYC-verified owners. No broker fees, ever.
              </p>
            </div>
            <Link
              href={`/search?city=${city}`}
              className="inline-flex items-center gap-1 text-sm font-semibold text-[var(--color-brand-700)] hover:underline"
            >
              Show all {totalCityListings > 0 ? `${totalCityListings}+ ` : ""}
              {cityName} listings
              <ArrowUpRight size={14} aria-hidden="true" />
            </Link>
          </div>

          <ListingGrid
            listings={cityListings}
            columns={3}
            headingLevel={3}
            hideCity
            emptyMessage={`We're onboarding ${cityName} owners now — be among the first to list.`}
            emptyCtaHref="/owner/signup"
            emptyCtaLabel={`List your ${cityName} property`}
          />
        </Container>
      </section>

      {/* Why HostelPups for this city */}
      <section className="py-16 bg-[var(--color-surface)] border-y border-[var(--color-border)]">
        <Container size="md" className="text-center">
          <h2 className="text-3xl font-black tracking-tight mb-4">
            Why {cityName} renters choose HostelPups
          </h2>
          <ul className="mt-8 grid sm:grid-cols-3 gap-6 text-left">
            <li className="rounded-2xl bg-[var(--color-bg-elevated)] border border-[var(--color-border)] p-6">
              <h3 className="font-bold mb-2">100% Verified</h3>
              <p className="text-sm text-[var(--color-ink-muted)]">
                Every {cityName} owner KYC-verified via video call + Aadhaar + live location.
              </p>
            </li>
            <li className="rounded-2xl bg-[var(--color-bg-elevated)] border border-[var(--color-border)] p-6">
              <h3 className="font-bold mb-2">Direct Chat</h3>
              <p className="text-sm text-[var(--color-ink-muted)]">
                Unlock contacts for ₹99/week. Talk to {cityName} owners directly. Zero broker fees.
              </p>
            </li>
            <li className="rounded-2xl bg-[var(--color-bg-elevated)] border border-[var(--color-border)] p-6">
              <h3 className="font-bold mb-2">Move-In Guarantee</h3>
              <p className="text-sm text-[var(--color-ink-muted)]">
                If the {cityName} PG isn&apos;t as described, we refund your platform fee. No fine print.
              </p>
            </li>
          </ul>
        </Container>
      </section>
    </>
  );
}
