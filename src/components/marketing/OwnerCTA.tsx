import * as React from "react";
import { Building2, BadgeCheck, TrendingUp, Camera } from "lucide-react";
import { Container } from "@/components/ui/Container";
import { Button } from "@/components/ui/Button";
import { PRICING } from "@/lib/site";
import { formatPrice } from "@/lib/utils";

const benefits = [
  {
    icon: Building2,
    title: "Reach 10,000+ verified renters",
    body: "Students, professionals, couples — all actively searching.",
  },
  {
    icon: BadgeCheck,
    title: "Verified badge = more inquiries",
    body: "KYC-verified owners get 3.2x more contacts than unverified.",
  },
  {
    icon: Camera,
    title: "Free pro photoshoot",
    body: "Full-service plan includes a HostelPups photoshoot. Real photos = real bookings.",
  },
  {
    icon: TrendingUp,
    title: "Boost when vacancies hit",
    body: "Promote to the top of search results during peak rental season.",
  },
];

export function OwnerCTA() {
  return (
    <section className="py-16 sm:py-24 bg-[var(--color-ink)] text-white relative overflow-hidden">
      {/* Decoration */}
      <div className="absolute -top-32 -right-32 h-96 w-96 rounded-full bg-[var(--color-brand-500)] opacity-30 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-32 -left-32 h-96 w-96 rounded-full bg-[var(--color-cta)] opacity-20 blur-3xl pointer-events-none" />

      <Container className="relative">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left */}
          <div>
            <p className="text-sm font-semibold text-[var(--color-brand-300)] uppercase tracking-wider">
              For Hostel & PG Owners
            </p>
            <h2 className="mt-2 text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight leading-[1.1]">
              List once. Fill rooms{" "}
              <span className="text-[var(--color-brand-400)]">all year.</span>
            </h2>
            <p className="mt-4 text-lg text-zinc-300 leading-relaxed max-w-xl">
              India&apos;s fastest-growing hostel marketplace. {formatPrice(PRICING.owner.fullService.firstYear)} for
              full-service registration with photoshoot, KYC, and verification. Or {formatPrice(PRICING.owner.selfServe.yearly)}/year
              self-serve with up to {PRICING.owner.selfServe.maxActiveListings} active listings.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <Button href="/for-owners" variant="primary" size="lg">
                List Your Property
              </Button>
              <Button
                href="/for-owners#pricing"
                variant="outline"
                size="lg"
                className="!text-white !border-white/30 hover:!bg-white/10"
              >
                See Pricing
              </Button>
            </div>

            <p className="mt-6 text-sm text-zinc-400">
              <strong className="text-white">No setup fee</strong> for first 50 owners in
              every city. Founding member pricing locked in.
            </p>
          </div>

          {/* Right — benefits grid */}
          <div className="grid sm:grid-cols-2 gap-4">
            {benefits.map((b) => {
              const Icon = b.icon;
              return (
                <div
                  key={b.title}
                  className="rounded-2xl bg-white/5 border border-white/10 p-5 backdrop-blur-sm hover:bg-white/10 transition-colors"
                >
                  <div className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-[var(--color-brand-500)] text-[var(--color-ink)] mb-3">
                    <Icon size={18} />
                  </div>
                  <h3 className="font-bold mb-1.5">{b.title}</h3>
                  <p className="text-sm text-zinc-400 leading-relaxed">{b.body}</p>
                </div>
              );
            })}
          </div>
        </div>
      </Container>
    </section>
  );
}
