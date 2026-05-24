import * as React from "react";
import Link from "next/link";
import {
  ShieldCheck,
  Wifi,
  Utensils,
  Snowflake,
  Heart,
  PawPrint,
  Users,
  GraduationCap,
  ArrowUpRight,
  MapPin,
  Star,
} from "lucide-react";
import { Container } from "@/components/ui/Container";
import { Badge } from "@/components/ui/Badge";
import { formatPrice } from "@/lib/utils";

type WedgeTone = "couple" | "bachelor" | "pet" | "student";

interface FeaturedListing {
  slug: string;
  city: string;
  name: string;
  area: string;
  priceFrom: number;
  rating: number;
  wedge: { tone: WedgeTone; label: string; icon: React.ReactNode };
  // CSS gradient used as the visual placeholder until real photography lands
  gradient: string;
}

const LISTINGS: FeaturedListing[] = [
  {
    slug: "sunshine-couples-stay-edappally",
    city: "kochi",
    name: "Sunshine Couples Stay",
    area: "Edappally, Kochi",
    priceFrom: 6500,
    rating: 4.7,
    wedge: { tone: "couple", label: "Couple-friendly", icon: <Heart size={12} /> },
    gradient:
      "linear-gradient(135deg, #FB7185 0%, #F0B429 100%)",
  },
  {
    slug: "techie-nest-pg-kakkanad",
    city: "kochi",
    name: "Techie Nest PG",
    area: "Kakkanad, Kochi",
    priceFrom: 5800,
    rating: 4.5,
    wedge: { tone: "bachelor", label: "Bachelor-friendly", icon: <Users size={12} /> },
    gradient:
      "linear-gradient(135deg, #6366F1 0%, #38BDF8 100%)",
  },
  {
    slug: "pawfect-home-marathahalli",
    city: "bangalore",
    name: "Pawfect Home",
    area: "Marathahalli, Bangalore",
    priceFrom: 9200,
    rating: 4.8,
    wedge: { tone: "pet", label: "Pet-friendly", icon: <PawPrint size={12} /> },
    gradient:
      "linear-gradient(135deg, #14B8A6 0%, #84CC16 100%)",
  },
  {
    slug: "campus-corner-hostel-trivandrum",
    city: "trivandrum",
    name: "Campus Corner Hostel",
    area: "Technopark, Trivandrum",
    priceFrom: 4900,
    rating: 4.4,
    wedge: { tone: "student", label: "Student-friendly", icon: <GraduationCap size={12} /> },
    gradient:
      "linear-gradient(135deg, #F59E0B 0%, #EC4899 100%)",
  },
];

const AMENITIES = [
  { icon: Wifi, label: "Wi-Fi" },
  { icon: Utensils, label: "Meals" },
  { icon: Snowflake, label: "AC" },
];

export function FeaturedListings() {
  return (
    <section className="py-16 sm:py-24 bg-[var(--color-bg)]">
      <Container>
        {/* Section header */}
        <div className="flex items-end justify-between flex-wrap gap-4 mb-10">
          <div>
            <p className="text-sm font-semibold text-[var(--color-brand-700)] uppercase tracking-wider">
              Fresh on HostelPups
            </p>
            <h2 className="mt-2 text-3xl sm:text-4xl font-black tracking-tight">
              Verified PGs near you
            </h2>
            <p className="mt-3 text-base sm:text-lg text-[var(--color-ink-muted)] max-w-xl">
              Hand-picked listings across our launch cities — every one KYC-verified, no broker fees.
            </p>
          </div>
          <Link
            href="/pg-in-kochi"
            className="inline-flex items-center gap-1 text-sm font-semibold text-[var(--color-brand-700)] hover:underline"
          >
            View all 500+ listings in Kochi
            <ArrowUpRight size={16} aria-hidden="true" />
          </Link>
        </div>

        {/* Cards grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {LISTINGS.map((l) => (
            <article
              key={l.slug}
              className="group flex flex-col overflow-hidden rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-elevated)] shadow-[var(--shadow-sm)] hover:shadow-[var(--shadow-lg)] hover:border-[var(--color-brand-400)] hover:-translate-y-0.5 transition-all"
            >
              {/* Visual placeholder (gradient until real photography lands) */}
              <div
                className="relative h-44 w-full"
                style={{ background: l.gradient }}
                role="img"
                aria-label={`${l.name} placeholder photo`}
              >
                {/* Soft inner overlay for text legibility */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent" />

                {/* Verified badge top-right */}
                <span className="absolute top-3 right-3 inline-flex items-center gap-1 rounded-full bg-white/95 backdrop-blur-sm px-2.5 py-1 text-[10px] sm:text-xs font-bold text-emerald-700 shadow-sm">
                  <ShieldCheck size={12} className="text-emerald-600" aria-hidden="true" />
                  Verified
                </span>

                {/* Wedge tag top-left */}
                <span className="absolute top-3 left-3">
                  <Badge tone={l.wedge.tone} icon={l.wedge.icon} className="bg-white/95 backdrop-blur-sm">
                    {l.wedge.label}
                  </Badge>
                </span>

                {/* Rating bottom-left */}
                <span className="absolute bottom-3 left-3 inline-flex items-center gap-1 rounded-full bg-black/55 backdrop-blur-sm px-2 py-1 text-[11px] font-semibold text-white">
                  <Star size={11} className="fill-amber-400 text-amber-400" aria-hidden="true" />
                  {l.rating.toFixed(1)}
                </span>
              </div>

              {/* Body */}
              <div className="flex flex-1 flex-col p-4">
                <h3 className="font-bold text-base leading-tight group-hover:text-[var(--color-brand-700)] transition-colors">
                  {l.name}
                </h3>
                <p className="mt-1 inline-flex items-center gap-1 text-xs text-[var(--color-ink-muted)]">
                  <MapPin size={11} className="text-[var(--color-ink-subtle)]" aria-hidden="true" />
                  {l.area}
                </p>

                {/* Amenities */}
                <div className="mt-3 flex items-center gap-3 text-[var(--color-ink-subtle)]">
                  {AMENITIES.map((a) => {
                    const Icon = a.icon;
                    return (
                      <span
                        key={a.label}
                        className="inline-flex items-center gap-1 text-[11px]"
                        title={a.label}
                      >
                        <Icon size={13} aria-hidden="true" />
                        <span className="sr-only">{a.label}</span>
                      </span>
                    );
                  })}
                  <span className="text-[11px]">· +5 more</span>
                </div>

                {/* Price + CTA */}
                <div className="mt-4 pt-3 border-t border-[var(--color-border)] flex items-end justify-between">
                  <div>
                    <span className="block text-[10px] uppercase tracking-wider text-[var(--color-ink-subtle)] font-semibold">
                      From
                    </span>
                    <span className="text-lg font-black text-[var(--color-ink)]">
                      {formatPrice(l.priceFrom)}
                      <span className="text-xs font-medium text-[var(--color-ink-muted)]">
                        {" "}
                        /mo
                      </span>
                    </span>
                  </div>
                  <Link
                    href={`/pg/${l.city}/${l.slug}`}
                    className="inline-flex items-center gap-0.5 text-sm font-semibold text-[var(--color-brand-700)] hover:text-[var(--color-brand-800)] hover:underline"
                  >
                    View
                    <ArrowUpRight size={14} aria-hidden="true" />
                  </Link>
                </div>
              </div>
            </article>
          ))}
        </div>
      </Container>
    </section>
  );
}
