import type { Metadata } from "next";
import { Users } from "lucide-react";
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
    title: `Bachelor-Friendly PG in ${cityName} — Verified Listings`,
    description: `Find PGs and rental flats in ${cityName} that openly welcome bachelors and bachelorettes. Skip the 'working professionals only' frustration. KYC-verified owners.`,
    path: `/bachelor-friendly-pg/${city}`,
    keywords: [
      `bachelor friendly PG ${cityName}`,
      `bachelorette PG ${cityName}`,
      `single PG ${cityName}`,
      `bachelor flat ${cityName}`,
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
                name: "Bachelor-Friendly",
                url: `/bachelor-friendly-pg/${city}`,
              },
            ]),
          ),
        }}
      />
      <WedgeLanding
      city={city}
      wedge="bachelor"
      wedgeLabel="Bachelor-Friendly"
      wedgeIcon={<Users size={14} />}
      badgeTone="bachelor"
      intro="Tired of 'working professionals only' listings that reject you the moment you say you're a bachelor? We've curated PGs and flats where single men and women are explicitly welcome — students, freshers, freelancers, all of you."
      painPoints={[
        {
          title: '"Working professionals only"',
          body: "A polite way of saying 'no bachelors'. Half the listings in your city have this restriction.",
        },
        {
          title: "Group size questions",
          body: "Looking for a 2-3 BHK with friends? Most landlords refuse bachelor groups. We tag the ones who allow it.",
        },
        {
          title: "Security deposit gouging",
          body: "Bachelors often get charged 2-3x security deposit. Our owners post transparent deposit upfront — no surprises.",
        },
      ]}
      ourAnswer={[
        "Owners flag their listing as bachelor-friendly explicitly. No surprise rejections after you reach out.",
        "Filter by group size — 1 bachelor, 2-3 friends, or larger bachelor groups.",
        "Transparent deposit info — see total deposit upfront before paying anything.",
        "Direct chat: ask about visitor rules, food rules, late-hour entry — get clear answers in writing.",
        "Move-in guarantee: if the property isn't as described, we refund your platform fee.",
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
