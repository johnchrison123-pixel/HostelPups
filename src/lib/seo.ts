import type { Metadata } from "next";
import { SITE } from "./site";

interface BuildMetadataOptions {
  title?: string;
  description?: string;
  path?: string;
  image?: string;
  noindex?: boolean;
  keywords?: string[];
}

/**
 * Build a Next.js Metadata object with HostelPups defaults.
 * Use on every page to keep SEO consistent.
 */
export function buildMetadata({
  title,
  description = SITE.description,
  path = "/",
  image = SITE.ogImage,
  noindex = false,
  keywords = [],
}: BuildMetadataOptions = {}): Metadata {
  const fullTitle = title
    ? `${title} | ${SITE.name}`
    : `${SITE.name} — ${SITE.tagline}`;
  const url = `${SITE.url}${path}`;
  const imageUrl = image.startsWith("http") ? image : `${SITE.url}${image}`;

  return {
    metadataBase: new URL(SITE.url),
    title: fullTitle,
    description,
    keywords: [
      "PG India",
      "hostel India",
      "couple friendly PG",
      "bachelor friendly PG",
      "pet friendly PG",
      "verified PG",
      "no broker PG",
      "flat for rent India",
      ...keywords,
    ],
    authors: [{ name: SITE.name }],
    creator: SITE.name,
    publisher: SITE.name,
    alternates: { canonical: url },
    openGraph: {
      type: "website",
      locale: "en_IN",
      url,
      siteName: SITE.name,
      title: fullTitle,
      description,
      images: [
        {
          url: imageUrl,
          width: 1200,
          height: 630,
          alt: fullTitle,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      site: SITE.twitter,
      creator: SITE.twitter,
      title: fullTitle,
      description,
      images: [imageUrl],
    },
    robots: noindex
      ? { index: false, follow: false }
      : {
          index: true,
          follow: true,
          googleBot: {
            index: true,
            follow: true,
            "max-image-preview": "large",
            "max-snippet": -1,
            "max-video-preview": -1,
          },
        },
    formatDetection: {
      email: false,
      address: false,
      telephone: false,
    },
  };
}

/* ====================================================================
   Structured data (JSON-LD) helpers
   Each returns an object you spread into a <script type="application/ld+json">
   ==================================================================== */

export function organizationSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: SITE.name,
    url: SITE.url,
    logo: `${SITE.url}/logo.png`,
    sameAs: [
      SITE.social.instagram,
      SITE.social.facebook,
      SITE.social.twitter,
      SITE.social.youtube,
      SITE.social.linkedin,
    ],
    contactPoint: {
      "@type": "ContactPoint",
      contactType: "customer support",
      email: SITE.supportEmail,
      areaServed: "IN",
      availableLanguage: ["English", "Hindi", "Malayalam", "Tamil", "Kannada"],
    },
  };
}

export function websiteSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: SITE.name,
    url: SITE.url,
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${SITE.url}/search?q={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
  };
}

interface LodgingSchemaInput {
  name: string;
  description: string;
  url: string;
  image: string[];
  address: { city: string; area?: string; state?: string };
  priceFrom: number;
  amenities?: string[];
  rating?: { value: number; count: number };
}

export function lodgingSchema(l: LodgingSchemaInput) {
  return {
    "@context": "https://schema.org",
    "@type": "LodgingBusiness",
    name: l.name,
    description: l.description,
    url: l.url,
    image: l.image,
    address: {
      "@type": "PostalAddress",
      addressLocality: l.address.area ?? l.address.city,
      addressRegion: l.address.state ?? "Kerala",
      addressCountry: "IN",
    },
    priceRange: l.priceFrom > 0 ? `₹${l.priceFrom}+ per month` : "Price on request",
    amenityFeature: l.amenities?.map((name) => ({
      "@type": "LocationFeatureSpecification",
      name,
      value: true,
    })),
    aggregateRating: l.rating
      ? {
          "@type": "AggregateRating",
          ratingValue: l.rating.value,
          ratingCount: l.rating.count,
        }
      : undefined,
  };
}

interface BreadcrumbItem {
  name: string;
  url: string;
}

export function breadcrumbSchema(items: BreadcrumbItem[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.name,
      item: item.url.startsWith("http") ? item.url : `${SITE.url}${item.url}`,
    })),
  };
}

interface FaqItem {
  question: string;
  answer: string;
}

export function faqSchema(items: FaqItem[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.answer,
      },
    })),
  };
}
