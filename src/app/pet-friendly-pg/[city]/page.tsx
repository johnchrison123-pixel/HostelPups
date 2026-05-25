import type { Metadata } from "next";
import { PawPrint } from "lucide-react";
import { WedgeLanding } from "@/components/marketing/WedgeLanding";
import { buildMetadata, breadcrumbSchema } from "@/lib/seo";
import { CITY_NAMES } from "@/lib/site";

// ISR: regenerate every 10 min. WedgeLanding uses the cookie-less public client.
export const revalidate = 60;

type Props = { params: Promise<{ city: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { city } = await params;
  const cityName = CITY_NAMES[city] ?? city;
  return buildMetadata({
    title: `Pet-Friendly PG in ${cityName} — Bring Your Dog, Cat, or Pet`,
    description: `Find rental flats and PGs in ${cityName} that welcome pets — dogs, cats, rabbits. KYC-verified owners. No surprises after move-in.`,
    path: `/pet-friendly-pg/${city}`,
    keywords: [
      `pet friendly PG ${cityName}`,
      `dog friendly flat ${cityName}`,
      `pet friendly rental ${cityName}`,
      `cat friendly PG ${cityName}`,
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
                name: "Pet-Friendly",
                url: `/pet-friendly-pg/${city}`,
              },
            ]),
          ),
        }}
      />
      <WedgeLanding
      city={city}
      wedge="pet"
      wedgeLabel="Pet-Friendly"
      wedgeIcon={<PawPrint size={14} />}
      badgeTone="pet"
      intro="Don't leave your dog, cat, or rabbit behind. We've curated rental flats and PGs in this city where pets are genuinely welcome — not just tolerated until your downstairs neighbor complains."
      painPoints={[
        {
          title: '"No pets allowed"',
          body: "90% of listings ban pets outright. Most of the remaining 10% will revoke the rule after move-in.",
        },
        {
          title: "Society restrictions",
          body: "Even when the landlord agrees, the apartment society can ban pets. We pre-check both.",
        },
        {
          title: "Pet deposit traps",
          body: "Landlords add absurd pet deposits ('₹50k for a small dog') with no clear refund policy. We show pet deposit upfront.",
        },
      ]}
      ourAnswer={[
        "Owners explicitly tag listings as pet-friendly and specify which pets are allowed (dogs, cats, small pets, exotic).",
        "Society approval verified for pet-friendly listings — no last-minute eviction.",
        "Transparent pet deposit shown upfront, with our owner agreement that it's refundable in full if you leave with no property damage.",
        "Filter by pet type and size — small dog vs Labrador vs cat — owners specify capacity.",
        "Move-in guarantee: if the owner backtracks on pet permission after you arrive, we refund.",
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
