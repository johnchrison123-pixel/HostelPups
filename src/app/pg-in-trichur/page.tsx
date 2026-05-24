import type { Metadata } from "next";
import { CityLanding } from "@/components/marketing/CityLanding";
import { buildMetadata, breadcrumbSchema } from "@/lib/seo";

// ISR: regenerate every 10 min. CityLanding uses the cookie-less public client.
export const revalidate = 600;

export const metadata: Metadata = buildMetadata({
  title: "PG in Trichur — Verified Hostels & Paying Guest Accommodations",
  description:
    "Find verified PGs in Trichur (Thrissur) — Town Hall, Medical College, Engineering College. KYC-verified owners. Direct chat.",
  path: "/pg-in-trichur",
  keywords: [
    "PG in Trichur",
    "PG in Thrissur",
    "PG near Medical College Thrissur",
    "hostel Thrissur",
    "girls PG Trichur",
  ],
});

const areas = [
  "Town Hall",
  "Medical College",
  "Engineering College",
  "Punkunnam",
  "Ayyanthole",
  "Patturaikkal",
  "Ramavarmapuram",
  "Mannuthy",
  "Kuriachira",
  "Ollur",
  "Kuttanellur",
  "West Fort",
];

export default function TrichurPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(breadcrumbSchema([
            { name: "Home", url: "/" },
            { name: "PG", url: "/search" },
            { name: "Trichur", url: "/pg-in-trichur" },
          ])),
        }}
      />
      <CityLanding
        city="trichur"
        state="Kerala"
        areas={areas}
        intro="Trichur PGs near Medical College, Engineering College, and Town Hall. Verified owners, direct chat. No brokers."
      />
    </>
  );
}
