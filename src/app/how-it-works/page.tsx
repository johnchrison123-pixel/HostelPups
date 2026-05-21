import type { Metadata } from "next";
import { Container } from "@/components/ui/Container";
import { Button } from "@/components/ui/Button";
import { HowItWorks } from "@/components/marketing/HowItWorks";
import { PricingSection } from "@/components/marketing/PricingSection";
import { FaqSection } from "@/components/marketing/FaqSection";
import { buildMetadata } from "@/lib/seo";

export const metadata: Metadata = buildMetadata({
  title: "How HostelPups Works",
  description:
    "Search verified PGs, chat with owners, move in. Zero brokerage. ₹99/week for unlimited access. KYC-verified owners. Refund guarantee.",
  path: "/how-it-works",
});

export default function HowItWorksPage() {
  return (
    <>
      <Container className="pt-16 sm:pt-24 pb-8 text-center">
        <p className="text-sm font-semibold text-[var(--color-brand-700)] uppercase tracking-wider">
          How It Works
        </p>
        <h1 className="mt-2 text-4xl sm:text-5xl font-black tracking-tight">
          The fastest way to find a verified PG in India
        </h1>
        <p className="mt-4 text-lg text-[var(--color-ink-muted)] max-w-2xl mx-auto">
          No agents. No fake listings. No mid-month surprise &quot;maintenance fees&quot;.
          Just verified owners, real photos, and direct chat.
        </p>
      </Container>

      <HowItWorks />
      <PricingSection />

      <Container className="py-16 text-center" size="md">
        <h2 className="text-3xl font-black mb-4">Ready to find your next home?</h2>
        <p className="text-lg text-[var(--color-ink-muted)] mb-8">
          Verified listings. Direct chat. No brokers.
        </p>
        <Button href="/search" variant="cta" size="lg">
          Start Searching
        </Button>
      </Container>

      <FaqSection />
    </>
  );
}
