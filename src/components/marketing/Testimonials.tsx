import * as React from "react";
import { Container } from "@/components/ui/Container";
import { Button } from "@/components/ui/Button";

/**
 * Testimonials — replaced with Early Adopter Program CTA.
 *
 * Reason: the original 3 testimonials (Priya Menon, Arjun Krishnan,
 * Anjali & Rohan) were fabricated personas with no real users behind them.
 * HostelPups is in beta — we have 0 verified reviews. This section is
 * honest about that and turns the trust gap into a conversion hook.
 */
export function Testimonials() {
  return (
    <section className="py-16 sm:py-24 bg-[var(--color-bg)]">
      <Container>
        <div className="text-center max-w-2xl mx-auto mb-10">
          <span className="inline-block rounded-full bg-amber-100 border border-amber-300 text-amber-700 text-xs font-bold uppercase tracking-wider px-3 py-1 mb-4">
            Reviews — Coming Soon
          </span>
          <h2 className="mt-2 text-3xl sm:text-4xl font-black tracking-tight">
            Our beta launch
          </h2>
          <p className="mt-4 text-lg text-[var(--color-ink-muted)]">
            Reviews from real renters and owners are on their way. HostelPups
            is brand new — we&apos;re onboarding our first owners and renters
            right now.
          </p>
        </div>

        <div className="max-w-2xl mx-auto rounded-2xl border-2 border-[var(--color-brand-300)] bg-[var(--color-bg-elevated)] p-8 sm:p-10 text-center shadow-[var(--shadow-md)]">
          <h3 className="text-2xl sm:text-3xl font-black tracking-tight text-[var(--color-ink)]">
            Be among our first verified renters
          </h3>
          <p className="mt-4 text-base sm:text-lg text-[var(--color-ink-muted)] leading-relaxed">
            Real reviews from real renters and owners are coming soon. Want in
            early? Get{" "}
            <strong className="text-[var(--color-ink)]">
              founding-member access — free for 6 months
            </strong>{" "}
            when you join our early adopter group.
          </p>
          <div className="mt-8">
            <Button
              href="/contact?source=adopter"
              variant="cta"
              size="lg"
            >
              Join the early adopter list
            </Button>
          </div>
          <p className="mt-4 text-sm text-[var(--color-ink-subtle)]">
            No credit card required. We&apos;ll reach out personally to get you set up.
          </p>
        </div>
      </Container>
    </section>
  );
}
