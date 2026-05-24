import type { MetadataRoute } from "next";
import { SITE } from "@/lib/site";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/api/",
          "/admin/",
          // Owner area — broad block of /owner/<anything> (defense in depth on
          // top of page-level noindex). /owner/login and /owner/signup remain
          // crawlable via the explicit Allow above.
          "/owner/dashboard",
          "/owner/onboarding",
          "/owner/listings",
          "/owner/listings/",
          "/owner/listings/new",
          "/owner/inquiries",
          "/owner/inquiries/",
          "/owner/calls",
          "/owner/profile",
          "/owner/payments",
          "/owner/reviews",
          "/owner/settings",
          // Renter private area
          "/profile",
          "/messages",
          "/messages/",
          "/saved",
          "/calls",
          // Live call URL — never indexable
          "/call/",
          // Auth callback handler — should never be hit by crawlers
          "/auth/callback",
          // Research dump
          "/research/",
        ],
      },
    ],
    sitemap: `${SITE.url}/sitemap.xml`,
    host: SITE.url,
  };
}
