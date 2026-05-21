import type { Metadata } from "next";
import { FaqSection } from "@/components/marketing/FaqSection";
import { FAQ_ITEMS } from "@/lib/faq";
import { buildMetadata, faqSchema } from "@/lib/seo";

export const metadata: Metadata = buildMetadata({
  title: "FAQ — Frequently Asked Questions",
  description:
    "Common questions about HostelPups — pricing, verification, refunds, owner signup, KYC, and more.",
  path: "/faq",
});

export default function FaqPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(faqSchema(
            FAQ_ITEMS.map((i) => ({ question: i.q, answer: i.a }))
          )),
        }}
      />
      <FaqSection />
    </>
  );
}
