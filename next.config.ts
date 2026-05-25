import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Allow images from Supabase storage + future CDN domains
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**.supabase.co",
      },
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
      },
    ],
    formats: ["image/avif", "image/webp"],
  },

  // SEO + security headers
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          {
            // First-party allowlist: the site itself can request mic + camera
            // (needed for WebRTC voice calls today + future video features).
            // An empty allowlist `()` would block getUserMedia EVERYWHERE,
            // including the first-party page — that breaks the call flow.
            key: "Permissions-Policy",
            value: "camera=(self), microphone=(self), geolocation=(self)",
          },
        ],
      },
    ];
  },

  // Trailing slash off for cleaner URLs
  trailingSlash: false,

  // Compress responses
  compress: true,

  // Build-time logging
  logging: {
    fetches: { fullUrl: false },
  },
};

export default nextConfig;
