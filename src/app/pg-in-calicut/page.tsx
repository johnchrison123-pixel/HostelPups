import type { Metadata } from "next";
import { CityLanding } from "@/components/marketing/CityLanding";
import { buildMetadata, breadcrumbSchema } from "@/lib/seo";

// ISR: regenerate every 10 min. CityLanding uses the cookie-less public client.
export const revalidate = 60;

export const metadata: Metadata = buildMetadata({
  title: "PG in Calicut — Verified Hostels Near NIT & Cyberpark",
  description:
    "Find verified PGs in Calicut — near NIT Calicut, Cyberpark, Medical College. KYC-verified owners. Direct chat.",
  path: "/pg-in-calicut",
  keywords: [
    "PG in Calicut",
    "PG near NIT Calicut",
    "PG near Cyberpark",
    "PG in Kozhikode",
    "girls PG Calicut",
    "hostel Calicut",
  ],
});

const areas = [
  "NIT Campus",
  "Cyberpark",
  "Medical College",
  "Mavoor Road",
  "Beach",
  "Kunnamangalam",
  "Mananchira",
  "Pantheerankavu",
  "Chevayur",
  "West Hill",
  "Vellayil",
  "Karaparamba",
];

export default function CalicutPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(breadcrumbSchema([
            { name: "Home", url: "/" },
            { name: "PG", url: "/search" },
            { name: "Calicut", url: "/pg-in-calicut" },
          ])),
        }}
      />
      <CityLanding
        city="calicut"
        state="Kerala"
        areas={areas}
        intro="Calicut PGs near NIT, Cyberpark, and Medical College. Direct contact with verified owners. Built for engineering students, medicos, and IT professionals."
      />
    </>
  );
}
