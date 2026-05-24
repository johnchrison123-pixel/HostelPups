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
          "/owner/dashboard",
          "/owner/listings",
          "/owner/inquiries",
          "/owner/calls",
          "/owner/profile",
          "/owner/payments",
          "/owner/reviews",
          "/owner/settings",
          "/profile",
          "/messages",
          "/saved",
          "/research/",
        ],
      },
    ],
    sitemap: `${SITE.url}/sitemap.xml`,
    host: SITE.url,
  };
}
