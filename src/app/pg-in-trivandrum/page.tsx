import type { Metadata } from "next";
import { CityLanding } from "@/components/marketing/CityLanding";
import { buildMetadata, breadcrumbSchema } from "@/lib/seo";

// ISR: regenerate every 10 min. CityLanding uses the cookie-less public client.
export const revalidate = 60;

export const metadata: Metadata = buildMetadata({
  title: "PG in Trivandrum — Verified Hostels Near Technopark",
  description:
    "Find verified PGs in Trivandrum — Technopark, Kazhakuttam, Sasthamangalam. KYC-verified owners. Direct chat. No brokers.",
  path: "/pg-in-trivandrum",
  keywords: [
    "PG in Trivandrum",
    "PG near Technopark",
    "PG in Kazhakuttam",
    "PG in Thiruvananthapuram",
    "girls PG Trivandrum",
    "couple friendly PG Trivandrum",
  ],
});

const areas = [
  "Technopark",
  "Kazhakuttam",
  "Sasthamangalam",
  "Pattom",
  "Kowdiar",
  "Vellayambalam",
  "Pothencode",
  "Akkulam",
  "Sreekaryam",
  "Ulloor",
  "Medical College",
  "East Fort",
];

export default function TrivandrumPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(breadcrumbSchema([
            { name: "Home", url: "/" },
            { name: "PG", url: "/search" },
            { name: "Trivandrum", url: "/pg-in-trivandrum" },
          ])),
        }}
      />
      <CityLanding
        city="trivandrum"
        state="Kerala"
        areas={areas}
        intro="Trivandrum PGs near Technopark, Kazhakuttam, and across the city. Verified owners, direct contact, no brokerage. Perfect for techies, students, and government employees."
      />
    </>
  );
}
