import { ImageResponse } from "next/og";

export const size = { width: 256, height: 256 };
export const contentType = "image/png";

/**
 * Auto-generated favicon / app icon at /icon.
 *
 * Next.js exposes this at /icon.png (different hash per build for cache
 * busting) and references it from the document head. Organization
 * structured data can use the same URL once we want to advertise a logo.
 *
 * Override per-route by adding the same convention file under any folder.
 *
 * Note: no `runtime = "edge"` here — Next.js's icon convention is generated
 * at build time on the default node runtime so it can be served as static
 * bytes from the CDN. The opengraph-image.tsx uses edge for parity with
 * Next.js's docs, but a 256x256 monogram doesn't need it.
 */

export default async function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#1A1A1A",
          color: "#F0B429",
          fontSize: 128,
          fontWeight: 900,
          letterSpacing: -6,
          fontFamily: "sans-serif",
          borderRadius: 56,
        }}
      >
        HP
      </div>
    ),
    size,
  );
}
