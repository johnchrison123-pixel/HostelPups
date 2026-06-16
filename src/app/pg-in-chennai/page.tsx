import type { Metadata } from "next";
import { CityLanding } from "@/components/marketing/CityLanding";
import { buildMetadata, breadcrumbSchema } from "@/lib/seo";

// ISR: regenerate every 10 min. CityLanding uses the cookie-less public client.
export const revalidate = 60;

export const metadata: Metadata = buildMetadata({
  title: "PG in Chennai — Verified Hostels Across OMR & City",
  description:
    "Find verified PGs in Chennai — OMR, Velachery, Anna Nagar, T. Nagar. Direct chat with KYC-verified owners. Live now, supply growing daily.",
  path: "/pg-in-chennai",
  keywords: [
    "PG in Chennai",
    "PG in OMR",
    "PG in Velachery",
    "PG in Anna Nagar",
    "girls PG Chennai",
    "couple friendly PG Chennai",
  ],
});

const areas = [
  "OMR",
  "Velachery",
  "Anna Nagar",
  "T. Nagar",
  "Adyar",
  "Tambaram",
  "Pallikaranai",
  "Sholinganallur",
  "Porur",
  "Guindy",
  "Mylapore",
  "Mogappair",
];

export default function ChennaiPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(breadcrumbSchema([
            { name: "Home", url: "/" },
            { name: "PG", url: "/search" },
            { name: "Chennai", url: "/pg-in-chennai" },
          ])),
        }}
      />
      <CityLanding
        city="chennai"
        state="Tamil Nadu"
        areas={areas}
        intro="Chennai PGs without the runaround. From OMR tech-corridor PGs to family-friendly flats in Anna Nagar — find verified listings, chat with owners directly. Live and growing — verified Chennai PGs onboarding now."
      />
    </>
  );
}
