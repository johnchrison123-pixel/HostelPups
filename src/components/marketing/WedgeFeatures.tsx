import * as React from "react";
import Link from "next/link";
import {
  Heart,
  Users,
  PawPrint,
  GraduationCap,
  ShieldCheck,
  Ban,
} from "lucide-react";
import { Container } from "@/components/ui/Container";
import { PRICING } from "@/lib/site";
import { formatPrice } from "@/lib/utils";

const wedges = [
  {
    icon: Heart,
    title: "Couple-Friendly PGs",
    body:
      "Married or unmarried — verified landlords who actually accept couples. No awkward rejections.",
    href: "/couple-friendly-pg/kochi",
    tint: "bg-pink-50 text-pink-700 border-pink-200",
  },
  {
    icon: Users,
    title: "Bachelor-Friendly",
    body:
      "Tired of \"working professionals only\"? Find PGs and flats that openly welcome single men and women.",
    href: "/bachelor-friendly-pg/kochi",
    tint: "bg-indigo-50 text-indigo-700 border-indigo-200",
  },
  {
    icon: PawPrint,
    title: "Pet-Friendly Rentals",
    body:
      "Bring your dog, cat, or rabbit. Landlords who say YES to pets — verified, no surprises later.",
    href: "/pet-friendly-pg/kochi",
    tint: "bg-teal-50 text-teal-700 border-teal-200",
  },
  {
    icon: GraduationCap,
    title: "Near Top Colleges",
    body:
      "Walking distance to Rajagiri, CUSAT, MEC, NIT, IIT, Christ. Filter by your campus.",
    href: "/search?tag=student",
    tint: "bg-amber-50 text-amber-700 border-amber-200",
  },
  {
    icon: ShieldCheck,
    title: "100% KYC Verified",
    body:
      "Every owner verified via video call + government ID + live location. No fake listings, ever.",
    href: "/how-it-works#verification",
    tint: "bg-emerald-50 text-emerald-700 border-emerald-200",
  },
  {
    icon: Ban,
    title: "Zero Brokerage",
    body: `Pay ${formatPrice(PRICING.user.week.price)} for a week. Talk to as many owners as you want. No 1-month-rent broker fees. Ever.`,
    href: "/how-it-works#pricing",
    tint: "bg-rose-50 text-rose-700 border-rose-200",
  },
];

export function WedgeFeatures() {
  return (
    <section className="py-16 sm:py-24 bg-[var(--color-surface)] border-y border-[var(--color-border)]">
      <Container>
        <div className="text-center max-w-3xl mx-auto mb-12">
          <p className="text-sm font-semibold text-[var(--color-brand-700)] uppercase tracking-wider">
            Why HostelPups
          </p>
          <h2 className="mt-2 text-3xl sm:text-4xl font-black tracking-tight">
            Built for the renters every other platform ignores
          </h2>
          <p className="mt-4 text-lg text-[var(--color-ink-muted)]">
            Couples, bachelors, students, pet parents — we made HostelPups for you, because nobody else did.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {wedges.map((w) => {
            const Icon = w.icon;
            return (
              <Link
                key={w.title}
                href={w.href}
                className="group rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-elevated)] p-6 hover:border-[var(--color-brand-400)] hover:shadow-[var(--shadow-md)] hover:-translate-y-0.5 transition-all"
              >
                <div className={`inline-flex h-11 w-11 items-center justify-center rounded-xl border ${w.tint} mb-4`}>
                  <Icon size={20} />
                </div>
                <h3 className="font-bold text-lg mb-1.5 group-hover:text-[var(--color-brand-700)] transition-colors">
                  {w.title}
                </h3>
                <p className="text-sm text-[var(--color-ink-muted)] leading-relaxed">{w.body}</p>
              </Link>
            );
          })}
        </div>
      </Container>
    </section>
  );
}
