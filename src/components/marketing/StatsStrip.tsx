import * as React from "react";
import { Users, Building2, MapPin, Ban } from "lucide-react";
import { Container } from "@/components/ui/Container";

interface Stat {
  icon: React.ComponentType<{ size?: number; className?: string }>;
  value: string;
  label: string;
  accent: string;
}

const STATS: Stat[] = [
  {
    icon: Users,
    value: "Growing",
    label: "renter community",
    accent: "text-[var(--color-brand-700)] bg-[var(--color-brand-100)]",
  },
  {
    icon: Building2,
    value: "KYC-verified",
    label: "PG owners",
    accent: "text-indigo-700 bg-indigo-50",
  },
  {
    icon: MapPin,
    value: "6 cities",
    label: "& expanding",
    accent: "text-teal-700 bg-teal-50",
  },
  {
    icon: Ban,
    value: "Rs 0",
    label: "brokerage. Ever.",
    accent: "text-pink-700 bg-pink-50",
  },
];

export function StatsStrip() {
  return (
    <section
      aria-labelledby="stats-heading"
      className="relative bg-[var(--color-surface)] border-y border-[var(--color-border)]"
    >
      <Container className="py-10 sm:py-12">
        <h2 id="stats-heading" className="sr-only">
          HostelPups by the numbers
        </h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
          {STATS.map((s) => {
            const Icon = s.icon;
            return (
              <div
                key={s.label}
                className="flex items-center gap-3 sm:gap-4"
              >
                <div
                  className={`inline-flex h-11 w-11 sm:h-12 sm:w-12 items-center justify-center rounded-xl shrink-0 ${s.accent}`}
                  aria-hidden="true"
                >
                  <Icon size={22} />
                </div>
                <div className="min-w-0">
                  <div className="text-xl sm:text-2xl font-black text-[var(--color-ink)] leading-tight">
                    {s.value}
                  </div>
                  <div className="text-xs sm:text-sm text-[var(--color-ink-muted)] leading-tight">
                    {s.label}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </Container>
    </section>
  );
}
