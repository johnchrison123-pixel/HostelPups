import type { Metadata } from "next";
import { CityLanding } from "@/components/marketing/CityLanding";
import { buildMetadata, breadcrumbSchema } from "@/lib/seo";

// ISR: regenerate every 10 min. CityLanding uses the cookie-less public client.
export const revalidate = 60;

export const metadata: Metadata = buildMetadata({
  title: "PG in Bangalore — Verified Hostels Near Tech Parks",
  description:
    "Find verified PGs in Bangalore — Marathahalli, HSR Layout, Koramangala, Whitefield. Couple-friendly, bachelor-friendly options. Talk to owners directly. Launching Q3.",
  path: "/pg-in-bangalore",
  keywords: [
    "PG in Bangalore",
    "PG near Marathahalli",
    "PG in HSR Layout",
    "PG in Koramangala",
    "PG in Whitefield",
    "couple friendly PG Bangalore",
    "pet friendly PG Bangalore",
  ],
});

const areas = [
  "Marathahalli",
  "HSR Layout",
  "Koramangala",
  "Whitefield",
  "Indiranagar",
  "BTM Layout",
  "Electronic City",
  "Bellandur",
  "Sarjapur Road",
  "Jayanagar",
  "JP Nagar",
  "Bommanahalli",
];

export default function BangalorePage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(breadcrumbSchema([
            { name: "Home", url: "/" },
            { name: "PG", url: "/search" },
            { name: "Bangalore", url: "/pg-in-bangalore" },
          ])),
        }}
      />
      <CityLanding
        city="bangalore"
        state="Karnataka"
        areas={areas}
        intro="Bangalore PG hunting without the broker hustle. From tech-park-adjacent PGs in HSR & Marathahalli to couple-friendly flats in Indiranagar — find verified listings, talk to owners directly. Launching with our first 100 verified Bangalore PGs in Q3."
      />
    </>
  );
}
