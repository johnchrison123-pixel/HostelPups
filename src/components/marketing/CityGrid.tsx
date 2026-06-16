import * as React from "react";
import Link from "next/link";
import { MapPin, ArrowUpRight } from "lucide-react";
import { Container } from "@/components/ui/Container";

const cities = [
  {
    name: "Kochi",
    slug: "kochi",
    state: "Kerala",
    properties: "Curated PGs — growing daily",
    image:
      "linear-gradient(135deg, #F0B429 0%, #FCE588 100%)",
    areas: ["Edappally", "Kakkanad", "Kaloor", "Vyttila", "Palarivattom"],
    isLaunched: true,
  },
  {
    name: "Bangalore",
    slug: "bangalore",
    state: "Karnataka",
    properties: "Launching Q3",
    image:
      "linear-gradient(135deg, #6366F1 0%, #A5B4FC 100%)",
    areas: ["Marathahalli", "HSR Layout", "Whitefield", "Koramangala"],
    isLaunched: false,
  },
  {
    name: "Chennai",
    slug: "chennai",
    state: "Tamil Nadu",
    properties: "Launching Q4",
    image:
      "linear-gradient(135deg, #14B8A6 0%, #5EEAD4 100%)",
    areas: ["OMR", "Velachery", "Anna Nagar", "T. Nagar"],
    isLaunched: false,
  },
  {
    name: "Trivandrum",
    slug: "trivandrum",
    state: "Kerala",
    properties: "Self-serve listings",
    image:
      "linear-gradient(135deg, #EC4899 0%, #F9A8D4 100%)",
    areas: ["Technopark", "Kazhakuttam", "Sasthamangalam"],
    isLaunched: true,
  },
  {
    name: "Calicut",
    slug: "calicut",
    state: "Kerala",
    properties: "Self-serve listings",
    image:
      "linear-gradient(135deg, #F59E0B 0%, #FCD34D 100%)",
    areas: ["NIT Campus", "Cyberpark", "Medical College"],
    isLaunched: true,
  },
  {
    name: "Trichur",
    slug: "trichur",
    state: "Kerala",
    properties: "Self-serve listings",
    image:
      "linear-gradient(135deg, #10B981 0%, #6EE7B7 100%)",
    areas: ["Town Hall", "Medical College", "Engineering College"],
    isLaunched: true,
  },
];

export function CityGrid() {
  return (
    <section className="py-16 sm:py-24">
      <Container>
        <div className="flex items-end justify-between flex-wrap gap-4 mb-10">
          <div>
            <p className="text-sm font-semibold text-[var(--color-brand-700)] uppercase tracking-wider">
              Browse by City
            </p>
            <h2 className="mt-2 text-3xl sm:text-4xl font-black tracking-tight">
              Find PGs across India
            </h2>
          </div>
          <Link
            href="/cities"
            className="text-sm font-semibold text-[var(--color-brand-700)] hover:underline inline-flex items-center gap-1"
          >
            View all cities <ArrowUpRight size={16} />
          </Link>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {cities.map((c) => (
            <Link
              key={c.slug}
              href={`/pg-in-${c.slug}`}
              className="group relative overflow-hidden rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-elevated)] hover:border-[var(--color-brand-400)] hover:shadow-[var(--shadow-lg)] hover:-translate-y-0.5 transition-all"
            >
              {/* Visual top */}
              <div
                className="h-32 relative"
                style={{ background: c.image }}
              >
                <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
                <div className="absolute bottom-3 left-4 text-white">
                  <div className="flex items-center gap-1.5 text-xs font-medium opacity-90">
                    <MapPin size={12} />
                    {c.state}
                  </div>
                  <h3 className="text-2xl font-black mt-0.5">{c.name}</h3>
                </div>
                {c.isLaunched ? (
                  <span className="absolute top-3 right-3 text-[10px] font-semibold uppercase bg-white/95 text-emerald-700 px-2 py-1 rounded-full">
                    Live
                  </span>
                ) : (
                  <span className="absolute top-3 right-3 text-[10px] font-semibold uppercase bg-white/95 text-amber-700 px-2 py-1 rounded-full">
                    Soon
                  </span>
                )}
              </div>

              {/* Body */}
              <div className="p-4">
                <p className="text-xs font-semibold text-[var(--color-brand-700)]">
                  {c.properties}
                </p>
                <p className="mt-2 text-sm text-[var(--color-ink-muted)] line-clamp-1">
                  {c.areas.slice(0, 3).join(" • ")}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </Container>
    </section>
  );
}
