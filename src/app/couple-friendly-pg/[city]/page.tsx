import type { Metadata } from "next";
import { Heart } from "lucide-react";
import { WedgeLanding } from "@/components/marketing/WedgeLanding";
import { buildMetadata, breadcrumbSchema } from "@/lib/seo";
import { CITY_NAMES } from "@/lib/site";

type Props = { params: Promise<{ city: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { city } = await params;
  const cityName = CITY_NAMES[city] ?? city;
  return buildMetadata({
    title: `Couple-Friendly PG in ${cityName} — Verified Listings, No Rejection`,
    description: `Find PGs and rental flats in ${cityName} that welcome couples — married or unmarried. KYC-verified owners who actually accept couples. No awkward rejections.`,
    path: `/couple-friendly-pg/${city}`,
    keywords: [
      `couple friendly PG ${cityName}`,
      `couple friendly flat ${cityName}`,
      `unmarried couple PG ${cityName}`,
      `live in couples ${cityName}`,
    ],
  });
}

export default async function Page({ params }: Props) {
  const { city } = await params;
  const cityName = CITY_NAMES[city] ?? city;

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(
            breadcrumbSchema([
              { name: "Home", url: "/" },
              { name: cityName, url: `/pg-in-${city}` },
              {
                name: "Couple-Friendly",
                url: `/couple-friendly-pg/${city}`,
              },
            ]),
          ),
        }}
      />
      <WedgeLanding
      city={city}
      wedge="couple"
      wedgeLabel="Couple-Friendly"
      wedgeIcon={<Heart size={14} />}
      badgeTone="couple"
      intro="Married or unmarried — find PGs and flats in this city where landlords actually welcome couples. Every listing tagged 'couple-friendly' has been explicitly confirmed by the owner during onboarding. No awkward rejection conversations."
      painPoints={[
        {
          title: "Endless rejections",
          body: "Most listings refuse couples without a marriage certificate. You waste hours on calls only to hear no.",
        },
        {
          title: "Society restrictions",
          body: "Even when the landlord agrees, the society management can reject you. We pre-verify both.",
        },
        {
          title: "Hidden judgment",
          body: "Landlords agree on call, then change their mind after seeing you. We surface only confirmed couple-friendly listings.",
        },
      ]}
      ourAnswer={[
        "Owners explicitly tag their listing as couple-friendly during signup — not a checkbox they hide from you later.",
        "We verify society approval where applicable. Listings with society-side restrictions are flagged or excluded.",
        "Honest pricing: no hidden 'couple deposit' on top of standard rent.",
        "Live chat with owners before visiting. Ask any sensitive question without commitment.",
        "Refund guarantee: if the owner backtracks after you arrive, we refund your platform fee, full stop.",
      ]}
      />
    </>
  );
}

export function generateStaticParams() {
  return [
    { city: "kochi" },
    { city: "bangalore" },
    { city: "chennai" },
    { city: "trivandrum" },
    { city: "calicut" },
    { city: "trichur" },
  ];
}
