import * as React from "react";
import Link from "next/link";
import { Building2, Home, Heart, PawPrint, ArrowUpRight } from "lucide-react";
import { Container } from "@/components/ui/Container";
import { createClient } from "@/lib/supabase/server";

interface Category {
  title: string;
  href: string;
  Icon: React.ComponentType<{ size?: number; className?: string }>;
  description: string;
  count: number;
  /** CSS gradient for the card background. */
  gradient: string;
  /** Tailwind text/border colour on the icon chip. */
  iconBg: string;
  iconText: string;
}

export async function BrowseCategories() {
  const supabase = await createClient();

  // Run all four counts in parallel — none of them needs the others.
  const [pgRes, hostelRes, coupleRes, petRes] = await Promise.all([
    supabase
      .from("listings")
      .select("*", { count: "exact", head: true })
      .eq("status", "live")
      .eq("type", "pg"),
    supabase
      .from("listings")
      .select("*", { count: "exact", head: true })
      .eq("status", "live")
      .eq("type", "hostel"),
    supabase
      .from("listings")
      .select("*", { count: "exact", head: true })
      .eq("status", "live")
      .contains("wedge_tags", ["couple"]),
    supabase
      .from("listings")
      .select("*", { count: "exact", head: true })
      .eq("status", "live")
      .contains("wedge_tags", ["pet"]),
  ]);

  const pgCount = pgRes.count ?? 0;
  const hostelCount = hostelRes.count ?? 0;
  const coupleCount = coupleRes.count ?? 0;
  const petCount = petRes.count ?? 0;

  const CATEGORIES: Category[] = [
    {
      title: "PGs",
      href: "/search?type=pg",
      Icon: Building2,
      description: "Single, double, triple sharing — meals included.",
      count: pgCount,
      gradient: "linear-gradient(135deg, #FFFBEA 0%, #FCE588 100%)",
      iconBg: "bg-[var(--color-brand-100)]",
      iconText: "text-[var(--color-brand-700)]",
    },
    {
      title: "Hostels",
      href: "/search?type=hostel",
      Icon: Home,
      description: "Budget triple / quad / dorm sharing for students.",
      count: hostelCount,
      gradient: "linear-gradient(135deg, #F0F9FF 0%, #BAE6FD 100%)",
      iconBg: "bg-sky-100",
      iconText: "text-sky-700",
    },
    {
      title: "Couple-Friendly Flats",
      href: "/couple-friendly-pg/kochi",
      Icon: Heart,
      description: "Society-approved, no rejection on arrival.",
      count: coupleCount,
      gradient: "linear-gradient(135deg, #FDF2F8 0%, #FBCFE8 100%)",
      iconBg: "bg-pink-100",
      iconText: "text-pink-700",
    },
    {
      title: "Pet-Friendly Stays",
      href: "/pet-friendly-pg/kochi",
      Icon: PawPrint,
      description: "Bring your dog, cat, or rabbit without negotiation.",
      count: petCount,
      gradient: "linear-gradient(135deg, #F0FDFA 0%, #99F6E4 100%)",
      iconBg: "bg-teal-100",
      iconText: "text-teal-700",
    },
  ];

  return (
    <section
      aria-labelledby="browse-categories-heading"
      className="py-16 sm:py-20 bg-[var(--color-surface)] border-y border-[var(--color-border)]"
    >
      <Container>
        <div className="mb-10 max-w-2xl">
          <p className="text-sm font-semibold text-[var(--color-brand-700)] uppercase tracking-wider">
            Find what fits
          </p>
          <h2
            id="browse-categories-heading"
            className="mt-2 text-3xl sm:text-4xl font-black tracking-tight"
          >
            Browse listings by category
          </h2>
          <p className="mt-3 text-base sm:text-lg text-[var(--color-ink-muted)]">
            Whatever your stay style — budget hostel, working-professional PG, couple flat, or
            pet-friendly rental — we&apos;ve curated every category with KYC-verified owners.
          </p>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {CATEGORIES.map((c) => {
            const Icon = c.Icon;
            return (
              <Link
                key={c.title}
                href={c.href}
                className="group relative flex flex-col justify-between rounded-2xl border border-[var(--color-border)] p-5 lg:p-6 min-h-[200px] lg:min-h-[240px] overflow-hidden hover:border-[var(--color-brand-400)] hover:-translate-y-1 hover:shadow-[var(--shadow-lg)] transition-all"
                style={{ background: c.gradient }}
              >
                {/* Decorative ring */}
                <div className="absolute -top-12 -right-12 h-32 w-32 rounded-full bg-white/40 blur-2xl pointer-events-none" aria-hidden="true" />

                <div className="relative">
                  <span
                    className={`inline-flex h-11 w-11 items-center justify-center rounded-xl ${c.iconBg} ${c.iconText} mb-3 shadow-sm`}
                    aria-hidden="true"
                  >
                    <Icon size={22} />
                  </span>
                  <h3 className="text-lg lg:text-xl font-black leading-tight">
                    {c.title}
                  </h3>
                  <p className="mt-1 text-xs lg:text-sm text-[var(--color-ink-muted)] leading-snug">
                    {c.description}
                  </p>
                </div>

                <div className="relative mt-4 flex items-center justify-between">
                  <span className="text-xs font-semibold text-[var(--color-ink-muted)]">
                    {c.count}+ verified
                  </span>
                  <span className="inline-flex items-center gap-1 text-sm font-semibold text-[var(--color-brand-700)] group-hover:underline">
                    Browse
                    <ArrowUpRight size={14} aria-hidden="true" />
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      </Container>
    </section>
  );
}
