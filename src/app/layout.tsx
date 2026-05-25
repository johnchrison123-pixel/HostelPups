import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { MobileBottomNav } from "@/components/layout/MobileBottomNav";
import { GlobalCallListener } from "@/components/call/GlobalCallListener";
import { buildMetadata, organizationSchema, websiteSchema } from "@/lib/seo";
import { SITE } from "@/lib/site";
import "./globals.css";

const jakarta = Plus_Jakarta_Sans({
  variable: "--font-plus-jakarta",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  display: "swap",
});

export const metadata: Metadata = buildMetadata();

export const viewport: Viewport = {
  themeColor: "#FFFCF5",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${jakarta.variable} h-full antialiased`}>
      <head>
        {/*
          Favicon is served by Next.js convention from src/app/favicon.ico.
          The PNG monogram at /icon (src/app/icon.tsx) is also picked up
          automatically as `<link rel="icon" type="image/png" sizes="256x256">`.
          We don't ship a standalone apple-touch-icon yet — Apple will fall
          back to the favicon for now.
        */}
        <link rel="manifest" href="/manifest.webmanifest" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-title" content={SITE.name} />

        {/* JSON-LD: Organization + WebSite */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(organizationSchema()),
          }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(websiteSchema()),
          }}
        />
      </head>
      <body className="min-h-full flex flex-col">
        <Header />
        <main className="flex-1 pb-16 lg:pb-0">{children}</main>
        <Footer />
        <MobileBottomNav />
        {/*
          Subscribes (for logged-in users) to realtime INSERTs on public.calls
          where callee_id = me, and pops an IncomingCallModal when a new
          ringing call arrives. Suppressed on /call/[id] so the in-call UI
          owns the foreground.
        */}
        <GlobalCallListener />
      </body>
    </html>
  );
}
