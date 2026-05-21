/**
 * Centralized site constants — change here, reflects everywhere.
 */

export const SITE = {
  name: "HostelPups",
  tagline: "India's most trusted PG, hostel & flat marketplace",
  url:
    process.env.NEXT_PUBLIC_SITE_URL ?? "https://hostelpups.in",
  domain: "hostelpups.in",
  twitter: "@hostelpups",
  email: "hello@hostelpups.in",
  phone: "+91-XXXXX-XXXXX",
  supportEmail: "support@hostelpups.in",
  ownerEmail: "owners@hostelpups.in",

  // Marketing
  description:
    "Find verified PGs, hostels, and rental flats across India. Couple-friendly, bachelor-friendly, pet-friendly. Talk directly to verified owners — no brokers, no hidden fees.",

  // OG defaults
  ogImage: "/og-default.png",

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
