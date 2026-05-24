import * as React from "react";
import {
  CheckCircle2,
  ShieldCheck,
  Home,
  KeyRound,
  MapPin,
  Building2,
  TrendingUp,
  Sparkles,
} from "lucide-react";

interface AuthSidePanelProps {
  flavor: "renter" | "owner";
}

const RENTER_BULLETS = [
  "Talk directly to verified owners — no broker calls",
  "Zero brokerage. Ever. Pay only Rs 99/week to unlock.",
  "Move-in guarantee — refund if it isn't as described",
];

const OWNER_BULLETS = [
  "Reach 10,000+ verified renters actively searching",
  "Boost listings to top of search from Rs 99/day",
  "We handle KYC + photoshoot on the full-service tier",
];

export function AuthSidePanel({ flavor }: AuthSidePanelProps) {
  const isOwner = flavor === "owner";
  const bullets = isOwner ? OWNER_BULLETS : RENTER_BULLETS;

  return (
    <aside
      className="relative hidden lg:flex flex-col justify-between overflow-hidden rounded-3xl p-10 xl:p-12 text-[var(--color-ink)]"
      style={{
        background: isOwner
          ? "linear-gradient(135deg, #FFF3C4 0%, #FCE588 60%, #F7C948 100%)"
          : "linear-gradient(135deg, #FFFBEA 0%, #FCE588 50%, #F0B429 100%)",
      }}
      aria-hidden="false"
    >
      {/* Decorative dots overlay */}
      <div className="absolute inset-0 bg-dot-pattern opacity-30 pointer-events-none" />

      {/* Decorative pink glow */}
      <div className="absolute -top-20 -right-20 h-72 w-72 rounded-full bg-pink-200 opacity-50 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 -left-16 h-72 w-72 rounded-full bg-amber-200 opacity-60 blur-3xl pointer-events-none" />

      {/* Top: brand mark + label */}
      <div className="relative">
        <div className="inline-flex items-center gap-2 rounded-full bg-white/70 backdrop-blur-sm border border-white/80 px-3 py-1.5 text-xs font-semibold text-[var(--color-brand-800)] shadow-sm">
          <Sparkles size={14} className="text-[var(--color-brand-700)]" aria-hidden="true" />
          {isOwner ? "Owner Studio" : "Renter Hub"}
        </div>
      </div>

      {/* Middle: quote + bullets */}
      <div className="relative mt-10 mb-10">
        <h2 className="text-3xl xl:text-4xl font-black tracking-tight leading-[1.1] text-[var(--color-ink)]">
          {isOwner
            ? "Fill rooms faster, with renters who actually show up."
            : "Finding your next PG just got 10x easier."}
        </h2>
        <p className="mt-4 text-base xl:text-lg text-[var(--color-ink)]/75 leading-relaxed">
          {isOwner
            ? "Set up your listing in minutes. We bring serious renters — email-verified, ID-checked — straight to your inbox."
            : "Verified listings. Direct chat. No brokers. The way PG-hunting in India should have always been."}
        </p>

        <ul className="mt-7 space-y-3.5">
          {bullets.map((b) => (
            <li key={b} className="flex items-start gap-3">
              <span className="mt-0.5 inline-flex h-6 w-6 items-center justify-center rounded-full bg-[var(--color-success)] text-white shrink-0">
                <CheckCircle2 size={14} aria-hidden="true" strokeWidth={2.5} />
              </span>
              <span className="text-base font-medium text-[var(--color-ink)]">{b}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Bottom: decorative icon row */}
      <div className="relative flex items-center gap-6">
        {(isOwner
          ? [
              { Icon: Building2, label: "Listings" },
              { Icon: TrendingUp, label: "Boost" },
              { Icon: ShieldCheck, label: "KYC" },
            ]
          : [
              { Icon: Home, label: "Verified PGs" },
              { Icon: KeyRound, label: "Direct keys" },
              { Icon: MapPin, label: "6 cities" },
            ]
        ).map(({ Icon, label }) => (
          <div key={label} className="flex flex-col items-center gap-1.5 text-[var(--color-ink)]/70">
            <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-white/80 backdrop-blur-sm border border-white/90 shadow-sm">
              <Icon size={22} className="text-[var(--color-brand-700)]" aria-hidden="true" />
            </span>
            <span className="text-[11px] font-semibold uppercase tracking-wider">{label}</span>
          </div>
        ))}
      </div>
    </aside>
  );
}
