import * as React from "react";
import { Search, MessageCircle, KeyRound } from "lucide-react";
import { Container } from "@/components/ui/Container";
import { PRICING } from "@/lib/site";
import { formatPrice } from "@/lib/utils";

const steps = [
  {
    n: "01",
    icon: Search,
    title: "Search verified hostels & PGs",
    body:
      "Filter by city, area, gender, budget, and house type. Every listing is verified — photos, KYC, the works.",
  },
  {
    n: "02",
    icon: MessageCircle,
    title: "Chat directly with owners",
    body: `Unlock contact details for just ${formatPrice(PRICING.user.week.price)}/week. No brokers. No middlemen. Talk to owners straight from the app.`,
  },
  {
    n: "03",
    icon: KeyRound,
    title: "Visit, choose, move in",
    body:
      "Schedule visits through HostelPups. Negotiate directly. Visit-protection guarantee — platform fee refunded if the PG is materially misrepresented.",
  },
];

export function HowItWorks() {
  return (
    <section className="py-16 sm:py-24">
      <Container>
        <div className="text-center max-w-2xl mx-auto mb-12">
          <p className="text-sm font-semibold text-[var(--color-brand-700)] uppercase tracking-wider">
            How It Works
          </p>
          <h2 className="mt-2 text-3xl sm:text-4xl font-black tracking-tight">
            From search to keys in 3 simple steps
          </h2>
          <p className="mt-4 text-lg text-[var(--color-ink-muted)]">
            No paperwork chains. No phone tag. No agents charging you 1 month rent.
          </p>
        </div>

        <div className="grid sm:grid-cols-3 gap-6">
          {steps.map((s) => {
            const Icon = s.icon;
            return (
              <div
                key={s.n}
                className="relative rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-elevated)] p-7 hover:border-[var(--color-brand-400)] hover:shadow-[var(--shadow-md)] transition-all"
              >
                <span className="absolute top-5 right-6 text-5xl font-black text-[var(--color-brand-100)] select-none">
                  {s.n}
                </span>
                <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-[var(--color-brand-100)] text-[var(--color-brand-700)] mb-4">
                  <Icon size={22} />
                </div>
                <h3 className="text-xl font-bold mb-2">{s.title}</h3>
                <p className="text-[var(--color-ink-muted)] leading-relaxed">{s.body}</p>
              </div>
            );
          })}
        </div>
      </Container>
    </section>
  );
}
