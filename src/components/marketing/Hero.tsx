import * as React from "react";
import Link from "next/link";
import {
  ShieldCheck,
  Heart,
  PawPrint,
  Users,
  Search,
  MapPin,
  Star,
  TrendingUp,
} from "lucide-react";
import { Container } from "@/components/ui/Container";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { CITY_NAMES } from "@/lib/site";

const HERO_CITIES = ["kochi", "bangalore", "chennai", "trivandrum", "calicut", "trichur"] as const;

const PROPERTY_CHIPS = [
  { value: "pg", label: "PG" },
  { value: "hostel", label: "Hostel" },
  { value: "flat", label: "Flat" },
  { value: "couple", label: "Couples Welcome" },
  { value: "pet", label: "Pet OK" },
] as const;

export function Hero() {
  return (
    <section className="relative overflow-hidden pt-10 pb-16 sm:pt-16 sm:pb-24">
      {/* Background dot pattern */}
      <div className="absolute inset-0 bg-dot-pattern opacity-50 pointer-events-none" />

      {/* Warm yellow glow top-right */}
      <div className="absolute -top-32 right-1/4 h-[28rem] w-[28rem] rounded-full bg-[var(--color-brand-200)] opacity-40 blur-3xl pointer-events-none" />
      {/* Cool pink glow bottom-left */}
      <div className="absolute -bottom-40 -left-20 h-[24rem] w-[24rem] rounded-full bg-pink-100 opacity-50 blur-3xl pointer-events-none" />

      <Container size="xl" className="relative">
        <div className="max-w-4xl mx-auto text-center">
          {/* Trust pill */}
          <div className="inline-flex items-center gap-2 rounded-full border border-[var(--color-border-strong)] bg-[var(--color-bg-elevated)] px-4 py-2 text-xs sm:text-sm font-medium shadow-sm mb-6">
            <span className="inline-flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>
              <strong className="text-[var(--color-ink)]">Beta launch</strong>
              <span className="text-[var(--color-ink-muted)]"> — India&apos;s newest verified PG marketplace · zero brokerage</span>
            </span>
          </div>

          {/* Headline — exactly one H1 per page */}
          <h1 className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-black tracking-tight leading-[1.02] text-[var(--color-ink)]">
            Your next{" "}
            <span className="relative inline-block">
              <span className="relative z-10">PG, hostel, or flat</span>
              <span
                className="absolute inset-x-0 bottom-1 h-4 sm:h-5 lg:h-6 bg-[var(--color-brand-300)] -z-0 rounded"
                aria-hidden="true"
              />
            </span>
            <br />
            is one search away.
          </h1>

          {/* Subtitle */}
          <p className="mt-6 text-lg sm:text-xl text-[var(--color-ink-muted)] max-w-2xl mx-auto leading-relaxed">
            Verified hostels, PGs, and rental flats across India.{" "}
            <strong className="text-[var(--color-ink)]">
              Couple-friendly. Bachelor-friendly. Pet-friendly.
            </strong>{" "}
            Talk to owners directly. Zero brokers. Zero hidden fees.
          </p>

          {/* Search bar — server-side form */}
          <form
            action="/search"
            method="get"
            className="mt-8 mx-auto max-w-3xl rounded-2xl border border-[var(--color-border-strong)] bg-[var(--color-bg-elevated)] p-3 sm:p-4 shadow-[var(--shadow-lg)] focus-within:border-[var(--color-brand-500)] transition-all"
          >
            {/* Row 1: city + query + button */}
            <div className="grid grid-cols-1 sm:grid-cols-[auto_1fr_auto] gap-2 sm:gap-3 items-stretch">
              {/* City dropdown */}
              <label
                htmlFor="hero-city"
                className="sr-only"
              >
                Choose city
              </label>
              <div className="relative flex items-center gap-2 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)] pl-3 pr-2 h-12 sm:min-w-[180px]">
                <MapPin
                  size={16}
                  className="text-[var(--color-brand-700)] shrink-0"
                  aria-hidden="true"
                />
                <select
                  id="hero-city"
                  name="city"
                  defaultValue="kochi"
                  className="flex-1 bg-transparent outline-none text-sm sm:text-base font-medium appearance-none pr-6 cursor-pointer"
                >
                  {HERO_CITIES.map((c) => (
                    <option key={c} value={c}>
                      {CITY_NAMES[c]}
                    </option>
                  ))}
                </select>
                <svg
                  className="absolute right-3 pointer-events-none text-[var(--color-ink-subtle)]"
                  width="12"
                  height="12"
                  viewBox="0 0 12 12"
                  fill="none"
                  aria-hidden="true"
                >
                  <path
                    d="M3 4.5L6 7.5L9 4.5"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>

              {/* Query input */}
              <label htmlFor="hero-q" className="sr-only">
                Search by area, college, or landmark
              </label>
              <div className="flex items-center gap-2 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)] px-4 h-12">
                <Search
                  size={18}
                  className="text-[var(--color-ink-subtle)] shrink-0"
                  aria-hidden="true"
                />
                <input
                  id="hero-q"
                  type="text"
                  name="q"
                  placeholder="Area, college or landmark — e.g. Rajagiri, Kakkanad"
                  className="flex-1 bg-transparent outline-none text-sm sm:text-base placeholder:text-[var(--color-ink-subtle)]"
                  autoComplete="off"
                />
              </div>

              {/* Search button */}
              <Button type="submit" variant="cta" size="lg" className="h-12 sm:px-8 shrink-0">
                <Search size={18} />
                <span>Search</span>
              </Button>
            </div>

            {/* Row 2: property type chips (radios styled as pills) */}
            <fieldset className="mt-3 pt-3 border-t border-[var(--color-border)]">
              <legend className="sr-only">Property type</legend>
              <div className="flex items-center flex-wrap gap-2">
                <span className="text-xs font-semibold text-[var(--color-ink-muted)] mr-1">
                  Type:
                </span>
                {PROPERTY_CHIPS.map((chip) => (
                  <label
                    key={chip.value}
                    className="cursor-pointer select-none"
                  >
                    <input
                      type="radio"
                      name="type"
                      value={chip.value}
                      className="peer sr-only"
                    />
                    <span className="inline-flex items-center gap-1 rounded-full border border-[var(--color-border-strong)] bg-[var(--color-bg)] px-3 py-1.5 text-xs sm:text-sm font-medium text-[var(--color-ink-muted)] transition-all hover:border-[var(--color-brand-400)] hover:bg-[var(--color-brand-50)] peer-checked:bg-[var(--color-brand-500)] peer-checked:border-[var(--color-brand-500)] peer-checked:text-[var(--color-ink)] peer-checked:shadow-sm peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-[var(--color-brand-500)]">
                      {chip.label}
                    </span>
                  </label>
                ))}
              </div>
            </fieldset>
          </form>

          {/* Trending city pills */}
          <div className="mt-5 flex items-center justify-center flex-wrap gap-2">
            <span className="inline-flex items-center gap-1 text-xs font-semibold text-[var(--color-brand-700)] mr-1">
              <TrendingUp size={12} />
              Trending:
            </span>
            <Link href="/pg-in-kochi"><Badge tone="brand">PG in Kochi</Badge></Link>
            <Link href="/pg-in-bangalore"><Badge tone="brand">PG in Bangalore</Badge></Link>
            <Link href="/pg-in-chennai"><Badge tone="brand">PG in Chennai</Badge></Link>
            <Link href="/couple-friendly-pg/kochi"><Badge tone="couple" icon={<Heart size={12} />}>Couple-friendly</Badge></Link>
            <Link href="/bachelor-friendly-pg/kochi"><Badge tone="bachelor" icon={<Users size={12} />}>Bachelor-friendly</Badge></Link>
            <Link href="/pet-friendly-pg/kochi"><Badge tone="pet" icon={<PawPrint size={12} />}>Pet-friendly</Badge></Link>
          </div>

          {/* Trust strip — three honest signals */}
          <div className="mt-10 sm:mt-12 grid grid-cols-3 gap-4 sm:gap-8 max-w-2xl mx-auto">
            <div className="flex flex-col items-center text-center">
              <div className="inline-flex items-center gap-1.5 text-[var(--color-ink)]">
                <ShieldCheck size={18} className="text-emerald-600 shrink-0" aria-hidden="true" />
                <span className="text-lg sm:text-2xl font-black">KYC</span>
              </div>
              <span className="text-xs sm:text-sm text-[var(--color-ink-muted)] mt-0.5">
                verified owners
              </span>
            </div>
            <div className="flex flex-col items-center text-center border-x border-[var(--color-border)]">
              <div className="inline-flex items-center gap-1.5 text-[var(--color-ink)]">
                <Users size={18} className="text-[var(--color-brand-700)] shrink-0" aria-hidden="true" />
                <span className="text-lg sm:text-2xl font-black">6</span>
              </div>
              <span className="text-xs sm:text-sm text-[var(--color-ink-muted)] mt-0.5">
                cities &amp; growing
              </span>
            </div>
            <div className="flex flex-col items-center text-center">
              <div className="inline-flex items-center gap-1.5 text-[var(--color-ink)]">
                <Star size={18} className="fill-amber-400 text-amber-400 shrink-0" aria-hidden="true" />
                <span className="text-lg sm:text-2xl font-black">Rs 0</span>
              </div>
              <span className="text-xs sm:text-sm text-[var(--color-ink-muted)] mt-0.5">
                brokerage. ever.
              </span>
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}
