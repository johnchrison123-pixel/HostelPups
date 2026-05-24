import type { MetadataRoute } from "next";
import { SITE } from "@/lib/site";

/**
 * Only cities with actual landing pages go in the sitemap.
 * /pg-in-kollam, /pg-in-kannur etc. don't exist yet — keep them out
 * so the sitemap doesn't promise 404 URLs.
 */
const LAUNCHED_CITIES = [
  "kochi",
  "trivandrum",
  "calicut",
  "trichur",
  "bangalore",
  "chennai",
] as const;

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  // Static marketing + indexable pages only.
  // /login, /signup, /owner/signup are noindex — excluded.
  const staticPaths: MetadataRoute.Sitemap = [
    "/",
    "/about",
    "/how-it-works",
    "/for-owners",
    "/contact",
    "/faq",
    "/privacy",
    "/terms",
    "/search",
    "/cities",
  ].map((p) => ({
    url: `${SITE.url}${p}`,
    lastModified: now,
    changeFrequency: "weekly",
    priority: p === "/" ? 1.0 : 0.7,
  }));

  // Per-city PG + wedge pages (only for cities that actually have pages)
  const cityPaths: MetadataRoute.Sitemap = LAUNCHED_CITIES.flatMap((city) => [
    {
      url: `${SITE.url}/pg-in-${city}`,
      lastModified: now,
      changeFrequency: "daily" as const,
      priority: 0.9,
    },
    {
      url: `${SITE.url}/couple-friendly-pg/${city}`,
      lastModified: now,
      changeFrequency: "weekly" as const,
      priority: 0.8,
    },
    {
      url: `${SITE.url}/bachelor-friendly-pg/${city}`,
      lastModified: now,
      changeFrequency: "weekly" as const,
      priority: 0.8,
    },
    {
      url: `${SITE.url}/pet-friendly-pg/${city}`,
      lastModified: now,
      changeFrequency: "weekly" as const,
      priority: 0.8,
    },
  ]);

  return [...staticPaths, ...cityPaths];
}
