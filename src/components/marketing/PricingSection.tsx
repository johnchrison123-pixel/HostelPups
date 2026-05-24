import * as React from "react";
import Link from "next/link";
import { Check } from "lucide-react";
import { Container } from "@/components/ui/Container";
import { Button } from "@/components/ui/Button";
import { PRICING } from "@/lib/site";
import { formatPrice } from "@/lib/utils";

// Prices come from the PRICING constant in src/lib/site.ts — single source of
// truth. Change the rupee value there, every price chip on every page updates.
const userPlans = [
  {
    name: PRICING.user.week.label,
    price: PRICING.user.week.price,
    period: "/ week",
    features: [
      "Unlock unlimited owner contacts",
      "Chat with verified owners directly",
      "Save favorites to compare later",
      "All cities & property types",
    ],
    highlighted: false,
    cta: "Start with 7 days",
  },
  {
    name: PRICING.user.month.label,
    price: PRICING.user.month.price,
    period: "/ month",
    features: [
      "Everything in weekly",
      "Best value for serious searchers",
      "Premium support — quicker response",
      "Save up to 12 shortlisted PGs",
    ],
    highlighted: true,
    cta: "Most popular",
    badge: "★ Best Value",
  },
  {
    name: PRICING.user.year.label,
    price: PRICING.user.year.price,
    period: "/ year",
    features: [
      "Everything in monthly",
      "For frequent movers, students relocating",
      "Refer friends — both get 7 days free",
      "Early access to new cities",
    ],
    highlighted: false,
    cta: "Get year-long",
  },
];

export function PricingSection() {
  return (
    <section className="py-16 sm:py-24">
      <Container>
        <div className="text-center max-w-2xl mx-auto mb-12">
          <p className="text-sm font-semibold text-[var(--color-brand-700)] uppercase tracking-wider">
            Renter Pricing
          </p>
          <h2 className="mt-2 text-3xl sm:text-4xl font-black tracking-tight">
            Pay once, find your home
          </h2>
          <p className="mt-4 text-lg text-[var(--color-ink-muted)]">
            No subscriptions. No auto-charge. Pay only when you&apos;re actively
            looking — keeps it cheap, keeps it honest.
          </p>
        </div>

        <div className="grid sm:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {userPlans.map((p) => (
            <div
              key={p.name}
              className={`relative rounded-2xl border-2 p-7 transition-all ${
                p.highlighted
                  ? "border-[var(--color-brand-500)] bg-[var(--color-bg-elevated)] shadow-[var(--shadow-lg)]"
                  : "border-[var(--color-border)] bg-[var(--color-bg-elevated)] hover:border-[var(--color-brand-300)]"
              }`}
            >
              {p.badge && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 text-xs font-bold uppercase bg-[var(--color-brand-500)] text-[var(--color-ink)] px-3 py-1 rounded-full shadow-md">
                  {p.badge}
                </span>
              )}

              <h3 className="text-lg font-bold">{p.name}</h3>
              <div className="mt-3 flex items-baseline gap-1">
                <span className="text-4xl font-black">{formatPrice(p.price)}</span>
                <span className="text-[var(--color-ink-muted)] text-sm">{p.period}</span>
              </div>

              <ul className="mt-6 space-y-3">
                {p.features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm">
                    <Check size={16} className="mt-0.5 shrink-0 text-emerald-600" />
                    <span className="text-[var(--color-ink-muted)]">{f}</span>
                  </li>
                ))}
              </ul>

              <div className="mt-7">
                <Button
                  href="/signup"
                  variant={p.highlighted ? "cta" : "outline"}
                  fullWidth
                >
                  {p.cta}
                </Button>
              </div>
            </div>
          ))}
        </div>

        <p className="mt-8 text-center text-sm text-[var(--color-ink-subtle)]">
          Just need one contact?{" "}
          <Link href="/signup" className="text-[var(--color-brand-700)] font-semibold hover:underline">
            Single unlock for {formatPrice(PRICING.user.singleUnlock.price)}
          </Link>
          .
        </p>
      </Container>
    </section>
  );
}
