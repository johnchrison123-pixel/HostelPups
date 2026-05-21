import type { Metadata } from "next";
import { Hero } from "@/components/marketing/Hero";
import { HowItWorks } from "@/components/marketing/HowItWorks";
import { WedgeFeatures } from "@/components/marketing/WedgeFeatures";
import { CityGrid } from "@/components/marketing/CityGrid";
import { OwnerCTA } from "@/components/marketing/OwnerCTA";
import { PricingSection } from "@/components/marketing/PricingSection";
import { FaqSection } from "@/components/marketing/FaqSection";
import { FAQ_ITEMS } from "@/lib/faq";
import { buildMetadata, faqSchema } from "@/lib/seo";

export const metadata: Metadata = buildMetadata({
  title:
    "HostelPups — Find verified PGs, hostels & flats across India",
  description:
    "Find verified PGs, hostels, and rental flats in Kochi, Bangalore, Chennai, and across India. Couple-friendly, bachelor-friendly, pet-friendly listings. Talk directly to verified owners — no brokers, no hidden fees.",
  path: "/",
  keywords: [
    "PG in Kochi",
    "PG in Bangalore",
    "couple friendly PG India",
    "bachelor friendly PG",
    "pet friendly hostel",
    "no broker PG",
    "verified hostel India",
  ],
});

export default function HomePage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(faqSchema(
            FAQ_ITEMS.map((i) => ({ question: i.q, answer: i.a }))
          )),
        }}
      />
      <Hero />
      <HowItWorks />
      <WedgeFeatures />
      <CityGrid />
      <PricingSection />
      <OwnerCTA />
      <FaqSection />
    </>
  );
}
