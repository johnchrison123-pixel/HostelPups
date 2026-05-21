import * as React from "react";
import Link from "next/link";
import { ArrowRight, ShieldCheck } from "lucide-react";
import { Container } from "@/components/ui/Container";
import { Button } from "@/components/ui/Button";
import { CITY_NAMES } from "@/lib/site";

interface WedgeLandingProps {
  city: string;
  wedge: "couple" | "bachelor" | "pet";
  wedgeLabel: string;
  wedgeIcon: React.ReactNode;
  intro: string;
  painPoints: { title: string; body: string }[];
  ourAnswer: string[];
  badgeTone: "couple" | "bachelor" | "pet";
}

export function WedgeLanding({
  city,
  wedge,
  wedgeLabel,
  wedgeIcon,
  intro,
  painPoints,
  ourAnswer,
  badgeTone,
}: WedgeLandingProps) {
  const cityName = CITY_NAMES[city] ?? city;
  const tintBg = {
    couple: "bg-pink-50 border-pink-200 text-pink-800",
    bachelor: "bg-indigo-50 border-indigo-200 text-indigo-800",
    pet: "bg-teal-50 border-teal-200 text-teal-800",
  }[badgeTone];

  return (
    <>
      {/* Hero */}
      <section className="relative pt-12 sm:pt-16 pb-12 overflow-hidden">
        <div className="absolute -top-32 right-1/3 h-96 w-96 rounded-full bg-[var(--color-brand-200)] opacity-40 blur-3xl pointer-events-none" />
        <Container className="relative">
          <div className="flex items-center gap-1.5 text-sm text-[var(--color-ink-muted)] mb-3">
            <Link href="/" className="hover:text-[var(--color-brand-700)]">Home</Link>
            <span>/</span>
            <Link href={`/pg-in-${city}`} className="hover:text-[var(--color-brand-700)]">{cityName}</Link>
            <span>/</span>
            <span className="text-[var(--color-ink)]">{wedgeLabel}</span>
          </div>

          <span className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold ${tintBg} mb-5`}>
            {wedgeIcon}
            {wedgeLabel}
          </span>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-[1.05]">
            {wedgeLabel} PG in {cityName}
          </h1>

          <p className="mt-6 text-lg text-[var(--color-ink-muted)] max-w-3xl leading-relaxed">
            {intro}
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <Button href={`/search?city=${city}&tag=${wedge}`} variant="cta" size="lg">
              View {wedgeLabel} listings in {cityName}
              <ArrowRight size={18} />
            </Button>
          </div>
        </Container>
      </section>

      {/* Pain points */}
      <section className="py-16 bg-[var(--color-surface)] border-y border-[var(--color-border)]">
        <Container>
          <h2 className="text-3xl font-black tracking-tight max-w-2xl">
            We get it. Renting in {cityName} as a {wedgeLabel.toLowerCase().replace(/-/g, " ")} renter sucks.
          </h2>
          <div className="mt-8 grid sm:grid-cols-3 gap-5">
            {painPoints.map((p) => (
              <div
                key={p.title}
                className="rounded-2xl bg-[var(--color-bg-elevated)] border border-[var(--color-border)] p-6"
              >
                <h3 className="font-bold text-lg mb-2">{p.title}</h3>
                <p className="text-sm text-[var(--color-ink-muted)] leading-relaxed">{p.body}</p>
              </div>
            ))}
          </div>
        </Container>
      </section>

      {/* Our answer */}
      <section className="py-16">
        <Container size="md">
          <p className="text-sm font-semibold text-[var(--color-brand-700)] uppercase tracking-wider">
            How HostelPups solves it
          </p>
          <h2 className="mt-2 text-3xl font-black tracking-tight mb-8">
            Built for renters like you.
          </h2>
          <ul className="space-y-4">
            {ourAnswer.map((point) => (
              <li
                key={point}
                className="flex items-start gap-3 rounded-2xl bg-[var(--color-bg-elevated)] border border-[var(--color-border)] p-5"
              >
                <ShieldCheck size={22} className="shrink-0 mt-0.5 text-emerald-600" />
                <p className="text-[var(--color-ink-muted)] leading-relaxed">{point}</p>
              </li>
            ))}
          </ul>

          <div className="mt-10 text-center">
            <Button href="/signup" variant="cta" size="lg">
              Sign Up — ₹99/week unlocks all owners
            </Button>
          </div>
        </Container>
      </section>
    </>
  );
}
