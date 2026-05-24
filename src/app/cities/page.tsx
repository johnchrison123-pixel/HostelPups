import type { Metadata } from "next";
import Link from "next/link";
import { MapPin, Clock } from "lucide-react";
import { Container } from "@/components/ui/Container";
import { buildMetadata, breadcrumbSchema } from "@/lib/seo";

export const metadata: Metadata = buildMetadata({
  title: "All Cities — HostelPups",
  description:
    "Browse verified PG and hostel listings across Kochi, Bangalore, Chennai, and other cities in India.",
  path: "/cities",
  keywords: [
    "PG cities India",
    "PG locations",
    "verified PG cities",
    "hostel cities India",
  ],
});

interface LaunchedCity {
  slug: string;
  name: string;
  state: string;
  blurb: string;
  gradient: string;
}

interface ComingCity {
  slug: string;
  name: string;
  state: string;
}

const LAUNCHED: LaunchedCity[] = [
  {
    slug: "kochi",
    name: "Kochi",
    state: "Kerala",
    blurb: "Edappally, Kakkanad, Kaloor, Vyttila and more",
    gradient: "linear-gradient(135deg, #F0B429 0%, #FCE588 100%)",
  },
  {
    slug: "bangalore",
    name: "Bangalore",
    state: "Karnataka",
    blurb: "Marathahalli, HSR Layout, Whitefield, Koramangala",
    gradient: "linear-gradient(135deg, #6366F1 0%, #A5B4FC 100%)",
  },
  {
    slug: "chennai",
    name: "Chennai",
    state: "Tamil Nadu",
    blurb: "OMR, Velachery, Anna Nagar, T. Nagar",
    gradient: "linear-gradient(135deg, #14B8A6 0%, #5EEAD4 100%)",
  },
  {
    slug: "trivandrum",
    name: "Trivandrum",
    state: "Kerala",
    blurb: "Technopark, Kazhakuttam, Sasthamangalam",
    gradient: "linear-gradient(135deg, #EC4899 0%, #F9A8D4 100%)",
  },
  {
    slug: "calicut",
    name: "Calicut",
    state: "Kerala",
    blurb: "NIT Campus, Cyberpark, Medical College",
    gradient: "linear-gradient(135deg, #F59E0B 0%, #FCD34D 100%)",
  },
  {
    slug: "trichur",
    name: "Trichur",
    state: "Kerala",
    blurb: "Town Hall, Medical College, Engineering College",
    gradient: "linear-gradient(135deg, #10B981 0%, #6EE7B7 100%)",
  },
];

const COMING: ComingCity[] = [
  { slug: "kollam", name: "Kollam", state: "Kerala" },
  { slug: "kannur", name: "Kannur", state: "Kerala" },
  { slug: "kottayam", name: "Kottayam", state: "Kerala" },
  { slug: "palakkad", name: "Palakkad", state: "Kerala" },
];

export default function CitiesPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(
            breadcrumbSchema([
              { name: "Home", url: "/" },
              { name: "Cities", url: "/cities" },
            ]),
          ),
        }}
      />
      <Container className="py-12 sm:py-16">
        <header className="max-w-3xl">
          <p className="text-sm font-semibold text-[var(--color-brand-700)] uppercase tracking-wider">
            Browse by City
          </p>
          <h1 className="mt-2 text-4xl sm:text-5xl font-black tracking-tight">
            All Cities on HostelPups
          </h1>
          <p className="mt-4 text-lg text-[var(--color-ink-muted)] leading-relaxed">
            Verified PGs, hostels, and rental flats across India. Every owner KYC-verified
            before going live. No brokers, no hidden fees.
          </p>
        </header>

        {/* Launched cities */}
        <section aria-labelledby="launched-cities-heading" className="mt-12">
          <h2
            id="launched-cities-heading"
            className="font-bold text-xl mb-5 flex items-center gap-2"
          >
            <MapPin size={18} className="text-[var(--color-brand-600)]" aria-hidden="true" />
            Live now
          </h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {LAUNCHED.map((c) => (
              <Link
                key={c.slug}
                href={`/pg-in-${c.slug}`}
                className="group relative overflow-hidden rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-elevated)] hover:border-[var(--color-brand-400)] hover:shadow-[var(--shadow-lg)] hover:-translate-y-0.5 transition-all"
              >
                <div className="h-32 relative" style={{ background: c.gradient }}>
                  <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
                  <div className="absolute bottom-3 left-4 text-white">
                    <div className="flex items-center gap-1.5 text-xs font-medium opacity-90">
                      <MapPin size={12} />
                      {c.state}
                    </div>
                    <h3 className="text-2xl font-black mt-0.5">{c.name}</h3>
                  </div>
                  <span className="absolute top-3 right-3 text-[10px] font-semibold uppercase bg-white/95 text-emerald-700 px-2 py-1 rounded-full">
                    Live
                  </span>
                </div>
                <div className="p-4">
                  <p className="text-sm text-[var(--color-ink-muted)] line-clamp-1">
                    {c.blurb}
                  </p>
                  <p className="mt-2 text-xs font-semibold text-[var(--color-brand-700)]">
                    View PGs in {c.name} →
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* Coming soon */}
        <section aria-labelledby="coming-cities-heading" className="mt-16">
          <h2
            id="coming-cities-heading"
            className="font-bold text-xl mb-5 flex items-center gap-2"
          >
            <Clock size={18} className="text-[var(--color-ink-muted)]" aria-hidden="true" />
            Coming soon
          </h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {COMING.map((c) => (
              <div
                key={c.slug}
                aria-disabled="true"
                className="rounded-2xl border border-dashed border-[var(--color-border)] bg-[var(--color-surface)] p-5 opacity-70"
              >
                <div className="flex items-center gap-1.5 text-xs font-medium text-[var(--color-ink-subtle)]">
                  <MapPin size={12} />
                  {c.state}
                </div>
                <h3 className="mt-1 text-xl font-black text-[var(--color-ink-muted)]">
                  {c.name}
                </h3>
                <p className="mt-2 text-xs font-semibold text-[var(--color-ink-subtle)] uppercase tracking-wider">
                  Launching soon
                </p>
              </div>
            ))}
          </div>
          <p className="mt-6 text-sm text-[var(--color-ink-muted)]">
            We&apos;re expanding fast across Kerala and pan-India.{" "}
            <Link href="/contact" className="text-[var(--color-brand-700)] font-semibold hover:underline">
              Tell us your city
            </Link>{" "}
            and we&apos;ll prioritise it.
          </p>
        </section>
      </Container>
    </>
  );
}
