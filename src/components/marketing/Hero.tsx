import * as React from "react";
import Link from "next/link";
import { ShieldCheck, Heart, PawPrint, Users, Search } from "lucide-react";
import { Container } from "@/components/ui/Container";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";

export function Hero() {
  return (
    <section className="relative overflow-hidden pt-8 pb-16 sm:pt-16 sm:pb-24">
      {/* Background dots */}
      <div className="absolute inset-0 bg-dot-pattern opacity-50 pointer-events-none" />

      {/* Brand glow */}
      <div className="absolute -top-32 right-1/3 h-96 w-96 rounded-full bg-[var(--color-brand-200)] opacity-40 blur-3xl pointer-events-none" />

      <Container size="xl" className="relative">
        <div className="max-w-4xl mx-auto text-center">
          {/* Trust bar */}
          <div className="inline-flex items-center gap-2 rounded-full border border-[var(--color-border-strong)] bg-[var(--color-bg-elevated)] px-4 py-2 text-xs sm:text-sm font-medium shadow-sm mb-6">
            <span className="inline-flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>
              <strong className="text-[var(--color-ink)]">10,000+</strong>
              <span className="text-[var(--color-ink-muted)]"> renters served • verified owners only</span>
            </span>
          </div>

          {/* Headline */}
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-[1.05] text-[var(--color-ink)]">
            Find your next{" "}
            <span className="relative inline-block">
              <span className="relative z-10">PG, hostel, or flat</span>
              <span className="absolute inset-x-0 bottom-1 h-4 sm:h-5 bg-[var(--color-brand-300)] -z-0 rounded" />
            </span>
            <br />
            without dealing with brokers.
          </h1>

          {/* Subtitle */}
          <p className="mt-6 text-lg sm:text-xl text-[var(--color-ink-muted)] max-w-2xl mx-auto leading-relaxed">
            Verified hostels, PGs, and rental flats across India.{" "}
            <strong className="text-[var(--color-ink)]">
              Couple-friendly, bachelor-friendly, pet-friendly listings
            </strong>{" "}
            — talk directly to verified owners. Zero brokerage. No hidden fees.
          </p>

          {/* Search bar */}
          <form
            action="/search"
            className="mt-8 mx-auto max-w-2xl flex items-stretch gap-2 rounded-2xl border border-[var(--color-border-strong)] bg-[var(--color-bg-elevated)] p-2 shadow-[var(--shadow-md)] focus-within:border-[var(--color-brand-500)] focus-within:shadow-[var(--shadow-lg)] transition-all"
          >
            <div className="flex items-center pl-3 pr-1 text-[var(--color-ink-subtle)]">
              <Search size={20} />
            </div>
            <input
              type="text"
              name="q"
              placeholder="Search city, area or college  e.g. PG near Rajagiri, Kochi"
              className="flex-1 bg-transparent outline-none text-base placeholder:text-[var(--color-ink-subtle)]"
              autoComplete="off"
            />
            <Button type="submit" variant="cta" size="md" className="shrink-0">
              Search
            </Button>
          </form>

          {/* Quick chips */}
          <div className="mt-5 flex items-center justify-center flex-wrap gap-2">
            <span className="text-xs text-[var(--color-ink-subtle)] mr-1">Popular:</span>
            <Link href="/pg-in-kochi"><Badge tone="brand">PG in Kochi</Badge></Link>
            <Link href="/pg-in-bangalore"><Badge tone="brand">PG in Bangalore</Badge></Link>
            <Link href="/couple-friendly-pg/kochi"><Badge tone="couple" icon={<Heart size={12} />}>Couple-friendly</Badge></Link>
            <Link href="/bachelor-friendly-pg/kochi"><Badge tone="bachelor" icon={<Users size={12} />}>Bachelor-friendly</Badge></Link>
            <Link href="/pet-friendly-pg/kochi"><Badge tone="pet" icon={<PawPrint size={12} />}>Pet-friendly</Badge></Link>
          </div>

          {/* Trust marks */}
          <div className="mt-12 flex items-center justify-center flex-wrap gap-x-6 gap-y-3 text-sm text-[var(--color-ink-muted)]">
            <div className="inline-flex items-center gap-1.5">
              <ShieldCheck size={16} className="text-emerald-600" />
              <span>KYC-verified owners</span>
            </div>
            <div className="inline-flex items-center gap-1.5">
              <ShieldCheck size={16} className="text-emerald-600" />
              <span>Direct chat — no brokers</span>
            </div>
            <div className="inline-flex items-center gap-1.5">
              <ShieldCheck size={16} className="text-emerald-600" />
              <span>Move-in guarantee</span>
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}
