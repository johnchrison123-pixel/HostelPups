/**
 * Centralized site constants — change here, reflects everywhere.
 */

export const SITE = {
  name: "HostelPups",
  tagline: "India's most trusted PG, hostel & flat marketplace",
  url:
    process.env.NEXT_PUBLIC_SITE_URL ?? "https://hostelpups.com",
  domain: "hostelpups.com",
  twitter: "@hostelpups",
  email: "hello@hostelpups.com",
  // TODO: replace placeholder before launch. Currently unused in any UI —
  // do NOT render in a `tel:` link or schema until a real number is set.
  phone: "+91-XXXXX-XXXXX",
  supportEmail: "support@hostelpups.com",
  ownerEmail: "owners@hostelpups.com",

  // Marketing
  description:
    "Find verified PGs, hostels, and rental flats across India. Couple-friendly, bachelor-friendly, pet-friendly. Talk directly to verified owners — no brokers, no hidden fees.",

  // OG defaults — generated on the fly by src/app/opengraph-image.tsx via
  // Next.js's ImageResponse / Open Graph convention. Next exposes it at
  // /opengraph-image and rewrites the URL to a stable hash so social
  // scrapers cache it correctly.
  ogImage: "/opengraph-image",

  // Social
  social: {
    instagram: "https://instagram.com/hostelpups",
    facebook: "https://facebook.com/hostelpups",
    twitter: "https://twitter.com/hostelpups",
    youtube: "https://youtube.com/@hostelpups",
    linkedin: "https://linkedin.com/company/hostelpups",
  },
} as const;

// Cities live on the full-service tier (you go in person)
export const FULL_SERVICE_CITIES = [
  "kochi",
  "bangalore",
  "chennai",
] as const;

// Sub-cities within Kerala (self-service via telecallers)
export const KERALA_CITIES = [
  "kochi",
  "trivandrum",
  "calicut",
  "trichur",
  "kollam",
  "kannur",
  "kottayam",
  "palakkad",
] as const;

// Pretty city names for display
export const CITY_NAMES: Record<string, string> = {
  kochi: "Kochi",
  bangalore: "Bangalore",
  chennai: "Chennai",
  trivandrum: "Trivandrum",
  calicut: "Calicut",
  trichur: "Trichur",
  kollam: "Kollam",
  kannur: "Kannur",
  kottayam: "Kottayam",
  palakkad: "Palakkad",
  hyderabad: "Hyderabad",
  pune: "Pune",
  mumbai: "Mumbai",
  delhi: "Delhi",
  noida: "Noida",
  gurgaon: "Gurgaon",
};

// Pricing — single source of truth
export const PRICING = {
  user: {
    week: { price: 99, days: 7, label: "7-Day Access" },
    month: { price: 199, days: 30, label: "30-Day Access" },
    year: { price: 499, days: 365, label: "1-Year Access" },
    singleUnlock: { price: 29, label: "Single Contact Unlock" },
  },
  owner: {
    fullService: {
      firstYear: 1999,
      renewal: 999,
      label: "Full Service — includes photoshoot + KYC",
    },
    selfServe: {
      yearly: 999,
      label: "Self-Serve Listing",
      maxActiveListings: 3,
    },
    verification: {
      yearly: 799,
      label: "Verification Badge",
    },
    boost: {
      perDay: 99,
      perWeek: 499,
      perMonth: 1499,
    },
  },
} as const;

// Property types
export const PROPERTY_TYPES = {
  pg: "PG / Paying Guest",
  hostel: "Hostel",
  flat: "Flat / Apartment",
  house: "Independent House",
  staycation: "Staycation",
} as const;

export type PropertyType = keyof typeof PROPERTY_TYPES;

// Wedge tags — the differentiation
export const WEDGE_TAGS = {
  couple: "Couple-Friendly",
  bachelor: "Bachelor-Friendly",
  pet: "Pet-Friendly",
  student: "Student-Friendly",
  family: "Family-Friendly",
  women: "Women Only",
  men: "Men Only",
} as const;

export type WedgeTag = keyof typeof WEDGE_TAGS;

/**
 * Move-In Guarantee — single source of truth.
 *
 * Use this constant everywhere the guarantee is mentioned (marketing, FAQ,
 * terms, listing detail). Never write the guarantee text ad-hoc — copy-drift
 * is what created the mismatch between Terms, FAQ, and marketing copy.
 *
 * What the guarantee actually covers:
 *   - Scope: platform fee refund only (we don't hold rent or deposits)
 *   - Trigger: listing photos / amenities are materially misrepresented
 *     compared to the physical property on the day of your visit
 *   - Owner's token deposit is the owner's separate responsibility
 */
export const MOVE_IN_GUARANTEE_COPY =
  "Visit-protection guarantee: if a listing's photos or amenities are materially misrepresented when you visit, HostelPups refunds your platform fee. Owner is responsible for any token deposit refund separately.";

/**
 * Cities with a live landing page — used for dropdowns and sitemaps.
 * Keep in sync with pg-in-{city}/ app routes and sitemap.ts.
 */
export const LAUNCHED_CITIES = [
  "kochi",
  "trivandrum",
  "calicut",
  "trichur",
  "bangalore",
  "chennai",
] as const;

export type LaunchedCity = (typeof LAUNCHED_CITIES)[number];
