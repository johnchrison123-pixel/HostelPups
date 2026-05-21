import type { Metadata } from "next";
import { CityLanding } from "@/components/marketing/CityLanding";
import { buildMetadata, breadcrumbSchema } from "@/lib/seo";
import { SITE } from "@/lib/site";

export const metadata: Metadata = buildMetadata({
  title: "PG in Kochi — Verified Hostels & Paying Guest Accommodations",
  description:
    "Find verified PGs, hostels & flats in Kochi — Edappally, Kakkanad, Kaloor, Vyttila. KYC-verified owners. Couple-friendly, bachelor-friendly, pet-friendly options. Direct chat. Zero brokerage.",
  path: "/pg-in-kochi",
  keywords: [
    "PG in Kochi",
    "PG near Infopark",
    "PG near Rajagiri",
    "PG in Edappally",
    "PG in Kakkanad",
    "PG in Kaloor",
    "couple friendly PG Kochi",
    "girls PG Kochi",
    "boys PG Kochi",
    "hostel Kochi",
  ],
});

const areas = [
  "Edappally",
  "Kakkanad",
  "Kaloor",
  "Vyttila",
  "Palarivattom",
  "Aluva",
  "Tripunithura",
  "Panampilly Nagar",
  "Kadavanthra",
  "Elamakkara",
  "Thevara",
  "Fort Kochi",
];

export default function KochiPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(breadcrumbSchema([
            { name: "Home", url: "/" },
            { name: "PG", url: "/search" },
            { name: "Kochi", url: "/pg-in-kochi" },
          ])),
        }}
      />
      <CityLanding
        city="kochi"
        state="Kerala"
        areas={areas}
        totalListings={500}
        intro="Find verified PGs, hostels, and rental flats across Kochi — from budget student PGs near Rajagiri & CUSAT to couple-friendly flats in Kakkanad's tech corridor. Every listing KYC-verified, every owner reachable directly. No brokers, no hidden fees."
      />
    </>
  );
}
