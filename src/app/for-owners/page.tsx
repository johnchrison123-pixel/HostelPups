import type { Metadata } from "next";
import { Check, Camera, ShieldCheck, Zap, Crown } from "lucide-react";
import { Container } from "@/components/ui/Container";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { buildMetadata } from "@/lib/seo";
import { PRICING } from "@/lib/site";
import { formatPrice } from "@/lib/utils";

// NOTE: meta description is a static string. Prices below are sourced from
// PRICING — keep them in sync with `src/lib/site.ts` PRICING.owner when the
// numbers change.
export const metadata: Metadata = buildMetadata({
  title: "List Your PG / Hostel / Flat — HostelPups for Owners",
  description:
    "Reach 10,000+ verified renters in Kochi, Bangalore, Chennai. Full-service includes photoshoot + KYC + verification. Self-serve from Rs 999/year. Founding owner pricing.",
  path: "/for-owners",
});

const ownerPlans = [
  {
    id: "full-service",
    name: "Full Service",
    price: formatPrice(PRICING.owner.fullService.firstYear),
    pricePeriod: `first year • ${formatPrice(PRICING.owner.fullService.renewal)}/year renewal`,
    description: "For PG & hostel owners in Kochi, Bangalore & Chennai",
    badge: "Most Popular",
    features: [
      "Professional photoshoot included (worth Rs 2,499)",
      "On-ground KYC + in-person verification",
      "Unlimited listings",
      "Verified badge from day 1",
      "Priority placement in search",
      "Dedicated relationship manager",
      "Free directory listings on partner sites",
      "Photo IP belongs to you — used only by HostelPups",
    ],
    cta: "Get Full Service",
    highlighted: true,
  },
  {
    id: "self-serve",
    name: "Self Serve",
    price: formatPrice(PRICING.owner.selfServe.yearly),
    pricePeriod: "per year",
    description: "For owners in any other Indian city",
    badge: null,
    features: [
      `Up to ${PRICING.owner.selfServe.maxActiveListings} active listings`,
      "Upload your own photos (we provide upload guidelines)",
      "Receive unlimited inquiries",
      "Standard search visibility",
      `Optional verification badge (${formatPrice(PRICING.owner.verification.yearly)}/yr add-on)`,
      `Boost any listing for ${formatPrice(PRICING.owner.boost.perDay)}/day`,
      "Email support",
    ],
    cta: "Start Self-Serve",
    highlighted: false,
  },
];

const addOns = [
  {
    icon: ShieldCheck,
    title: "Verification Badge",
    price: `${formatPrice(PRICING.owner.verification.yearly)} / year`,
    body: "Video call + live location + Google research. Verified owners get 3.2x more inquiries.",
  },
  {
    icon: Zap,
    title: "Boost Listing",
    price: `${formatPrice(PRICING.owner.boost.perDay)} / day`,
    body: `Top of search results in your area for 24 hours. Or ${formatPrice(PRICING.owner.boost.perWeek)}/week, ${formatPrice(PRICING.owner.boost.perMonth)}/month.`,
  },
  {
    icon: Camera,
    title: "Professional Photoshoot",
    price: "Rs 1,499 add-on",
    body: "For self-serve owners who want pro photos. Cost: Rs 500-800 photographer + your margin. 30% more click-throughs.",
  },
];

export default function ForOwnersPage() {
  return (
    <>
      {/* Hero */}
      <Container className="pt-16 sm:pt-24 pb-12 text-center" size="md">
        <p className="text-sm font-semibold text-[var(--color-brand-700)] uppercase tracking-wider">
          For Owners
        </p>
        <h1 className="mt-2 text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-[1.05]">
          List your property.
          <br />
          <span className="bg-gradient-to-r from-[var(--color-brand-600)] to-[var(--color-cta)] bg-clip-text text-transparent">
            Fill rooms all year.
          </span>
        </h1>
        <p className="mt-6 text-lg sm:text-xl text-[var(--color-ink-muted)] max-w-2xl mx-auto leading-relaxed">
          India&apos;s fastest-growing hostel marketplace. <strong className="text-[var(--color-ink)]">
          10,000+ verified renters actively searching.</strong> Direct chat. Zero brokerage. KYC trust signal.
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Button href="/owner/signup" variant="cta" size="lg">
            Get Started — Free Sign Up
          </Button>
          <Button href="#pricing" variant="outline" size="lg">
            See Pricing
          </Button>
        </div>
      </Container>

      {/* Pricing plans */}
      <section id="pricing" className="py-16 sm:py-24 bg-[var(--color-surface)] border-y border-[var(--color-border)]">
        <Container>
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="text-3xl sm:text-4xl font-black tracking-tight">
              Choose your plan
            </h2>
            <p className="mt-4 text-lg text-[var(--color-ink-muted)]">
              Honest, one-time annual fees. No commission on rent. Ever.
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-6 max-w-5xl mx-auto">
            {ownerPlans.map((p) => (
              <div
                key={p.id}
                id={p.id}
                className={`relative rounded-2xl border-2 p-8 bg-[var(--color-bg-elevated)] transition-all ${
                  p.highlighted
                    ? "border-[var(--color-brand-500)] shadow-[var(--shadow-lg)]"
                    : "border-[var(--color-border)] hover:border-[var(--color-brand-300)]"
                }`}
              >
                {p.badge && (
                  <Badge tone="brand" className="absolute -top-3 left-8">
                    <Crown size={12} /> {p.badge}
                  </Badge>
                )}
                <h3 className="text-2xl font-bold">{p.name}</h3>
                <p className="text-sm text-[var(--color-ink-muted)] mt-1">{p.description}</p>

                <div className="mt-5 flex items-baseline gap-2">
                  <span className="text-5xl font-black">{p.price}</span>
                </div>
                <p className="text-sm text-[var(--color-ink-subtle)] mt-1">{p.pricePeriod}</p>

                <ul className="mt-7 space-y-3">
                  {p.features.map((f) => (
                    <li key={f} className="flex items-start gap-2.5 text-sm">
                      <Check size={18} className="mt-0.5 shrink-0 text-emerald-600" />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>

                <div className="mt-8">
                  <Button
                    href="/owner/signup"
                    variant={p.highlighted ? "cta" : "primary"}
                    fullWidth
                    size="lg"
                  >
                    {p.cta}
                  </Button>
                </div>
              </div>
            ))}
          </div>

          <p className="mt-10 text-center text-sm text-[var(--color-ink-muted)]">
            <strong className="text-[var(--color-ink)]">First 50 owners in every city get free signup.</strong>{" "}
            Limited time — founding member pricing locked in.
          </p>
        </Container>
      </section>

      {/* Add-ons */}
      <section id="verification" className="py-16 sm:py-24">
        <Container>
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="text-3xl sm:text-4xl font-black tracking-tight">Add-ons</h2>
            <p className="mt-4 text-lg text-[var(--color-ink-muted)]">
              Optional upgrades available to all owners.
            </p>
          </div>

          <div className="grid sm:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {addOns.map((a) => {
              const Icon = a.icon;
              return (
                <div
                  key={a.title}
                  className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-elevated)] p-6"
                >
                  <div className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-[var(--color-brand-100)] text-[var(--color-brand-700)] mb-4">
                    <Icon size={20} />
                  </div>
                  <h3 className="font-bold text-lg">{a.title}</h3>
                  <p className="text-[var(--color-brand-700)] font-semibold mt-1">{a.price}</p>
                  <p className="text-sm text-[var(--color-ink-muted)] mt-3 leading-relaxed">{a.body}</p>
                </div>
              );
            })}
          </div>
        </Container>
      </section>

      {/* Final CTA */}
      <section className="py-20 bg-[var(--color-ink)] text-white text-center">
        <Container size="md">
          <h2 className="text-3xl sm:text-4xl font-black mb-4">
            Ready to fill your vacancies?
          </h2>
          <p className="text-lg text-zinc-300 mb-8">
            Sign up free. List your property in minutes. Talk to verified renters today.
          </p>
          <Button href="/owner/signup" variant="primary" size="lg">
            List Your Property Now
          </Button>
        </Container>
      </section>
    </>
  );
}
