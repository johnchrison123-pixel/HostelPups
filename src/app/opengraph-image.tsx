import { ImageResponse } from "next/og";

export const alt = "HostelPups — verified PGs, hostels & flats across India";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/**
 * Auto-generated Open Graph image for the site root.
 *
 * Next.js looks for this convention file and serves the rendered PNG at
 * `/opengraph-image.png` (also `/twitter-image` if present). The previous
 * static `/og-default.png` file never existed — buildMetadata pointed at
 * `${SITE.url}/og-default.png` which 404'd on every social share.
 *
 * Generating the OG image on the fly means we never have to ship a PNG and
 * the gradient/typography stay consistent with the brand.
 *
 * Override per-page by adding the same file inside any route folder.
 */

export default async function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: "80px",
          background:
            "linear-gradient(135deg, #FFFCF5 0%, #FCE588 60%, #F0B429 100%)",
          fontFamily: "sans-serif",
        }}
      >
        <div
          style={{
            position: "absolute",
            top: 60,
            left: 60,
            display: "flex",
            alignItems: "center",
            gap: 18,
          }}
        >
          <div
            style={{
              width: 64,
              height: 64,
              borderRadius: 16,
              background: "#1A1A1A",
              color: "#F0B429",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 32,
              fontWeight: 900,
              letterSpacing: -1,
            }}
          >
            HP
          </div>
          <div
            style={{
              fontSize: 28,
              fontWeight: 700,
              color: "#1A1A1A",
            }}
          >
            HostelPups
          </div>
        </div>

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            textAlign: "center",
          }}
        >
          <div
            style={{
              fontSize: 88,
              fontWeight: 900,
              color: "#1A1A1A",
              letterSpacing: -2,
              lineHeight: 1.05,
            }}
          >
            Verified PGs, hostels
          </div>
          <div
            style={{
              fontSize: 88,
              fontWeight: 900,
              color: "#1A1A1A",
              letterSpacing: -2,
              lineHeight: 1.05,
            }}
          >
            & flats across India
          </div>
          <div
            style={{
              marginTop: 36,
              fontSize: 36,
              color: "#5C5C5C",
              fontWeight: 500,
            }}
          >
            Couple · Bachelor · Pet · Student-friendly · Zero brokerage
          </div>
        </div>

        <div
          style={{
            position: "absolute",
            bottom: 60,
            display: "flex",
            alignItems: "center",
            gap: 14,
            fontSize: 24,
            color: "#1A1A1A",
            fontWeight: 600,
          }}
        >
          hostelpups.in
        </div>
      </div>
    ),
    size,
  );
}
