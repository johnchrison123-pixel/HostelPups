import type { MetadataRoute } from "next";
import { SITE, KERALA_CITIES, FULL_SERVICE_CITIES } from "@/lib/site";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  // Static marketing pages
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
    "/login",
    "/signup",
    "/owner/signup",
  ].map((p) => ({
    url: `${SITE.url}${p}`,
    lastModified: now,
    changeFrequency: "weekly",
    priority: p === "/" ? 1.0 : 0.7,
  }));

  // Per-city PG pages (Kerala + full-service cities)
  const allCities = Array.from(new Set([...KERALA_CITIES, ...FULL_SERVICE_CITIES]));
  const cityPaths: MetadataRoute.Sitemap = allCities.flatMap((city) => [
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
