import * as React from "react";
import { Star, Quote } from "lucide-react";
import { Container } from "@/components/ui/Container";

interface Testimonial {
  initials: string;
  name: string;
  role: string;
  city: string;
  quote: string;
  // Gradient backing the initials chip
  gradient: string;
}

const TESTIMONIALS: Testimonial[] = [
  {
    initials: "PM",
    name: "Priya Menon",
    role: "MCA student",
    city: "Kochi",
    quote:
      "Found a PG five minutes from Rajagiri in two days. Owner answered every WhatsApp instantly. Zero broker fee — saved me Rs 8,000.",
    gradient: "linear-gradient(135deg, #F0B429 0%, #EC4899 100%)",
  },
  {
    initials: "AK",
    name: "Arjun Krishnan",
    role: "Backend engineer",
    city: "Bangalore",
    quote:
      "I'm a bachelor and most listings used to ghost me. HostelPups filters that out — the PGs that show up actually accept me. Game changer.",
    gradient: "linear-gradient(135deg, #6366F1 0%, #14B8A6 100%)",
  },
  {
    initials: "A&R",
    name: "Anjali & Rohan",
    role: "Newly married couple",
    city: "Chennai",
    quote:
      "We searched for weeks before — landlords kept saying no. HostelPups had a couple-friendly tag right there. Booked a 1BHK in a week.",
    gradient: "linear-gradient(135deg, #EC4899 0%, #F59E0B 100%)",
  },
];

function StarRow({ value = 5 }: { value?: number }) {
  return (
    <div
      className="inline-flex items-center gap-0.5"
      role="img"
      aria-label={`${value} out of 5 stars`}
    >
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          size={14}
          className={
            i < value
              ? "fill-amber-400 text-amber-400"
              : "fill-none text-[var(--color-border-strong)]"
          }
          aria-hidden="true"
        />
      ))}
    </div>
  );
}

export function Testimonials() {
  return (
    <section className="py-16 sm:py-24 bg-[var(--color-bg)]">
      <Container>
        <div className="text-center max-w-2xl mx-auto mb-12">
          <p className="text-sm font-semibold text-[var(--color-brand-700)] uppercase tracking-wider">
            Real Renters, Real Stories
          </p>
          <h2 className="mt-2 text-3xl sm:text-4xl font-black tracking-tight">
            Loved by renters across India
          </h2>
          <p className="mt-4 text-lg text-[var(--color-ink-muted)]">
            Students, professionals, couples, pet parents — people the old brokers ignored, now finding homes in days, not months.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {TESTIMONIALS.map((t) => (
            <figure
              key={t.name}
              className="relative flex flex-col rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-elevated)] p-6 shadow-[var(--shadow-sm)] hover:shadow-[var(--shadow-md)] hover:border-[var(--color-brand-300)] transition-all"
            >
              {/* Decorative quote mark */}
              <Quote
                size={28}
                className="absolute top-4 right-4 text-[var(--color-brand-200)]"
                aria-hidden="true"
              />

              <StarRow value={5} />

              <blockquote className="mt-3 text-[var(--color-ink)] text-base leading-relaxed">
                &ldquo;{t.quote}&rdquo;
              </blockquote>

              <figcaption className="mt-5 pt-4 border-t border-[var(--color-border)] flex items-center gap-3">
                <div
                  className="h-11 w-11 rounded-full flex items-center justify-center text-white font-bold text-sm shrink-0 shadow-sm"
                  style={{ background: t.gradient }}
                  aria-hidden="true"
                >
                  {t.initials}
                </div>
                <div className="min-w-0">
                  <div className="font-semibold text-[var(--color-ink)] leading-tight">
                    {t.name}
                  </div>
                  <div className="text-xs text-[var(--color-ink-muted)] leading-tight mt-0.5">
                    {t.role} · {t.city}
                  </div>
                </div>
              </figcaption>
            </figure>
          ))}
        </div>
      </Container>
    </section>
  );
}
