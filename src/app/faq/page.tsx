import type { Metadata } from "next";
import { Container } from "@/components/ui/Container";
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
      <Container className="pt-12 sm:pt-16 pb-0" size="md">
        <h1 className="text-4xl sm:text-5xl font-black tracking-tight">
          Frequently Asked Questions
        </h1>
        <p className="mt-3 text-lg text-[var(--color-ink-muted)]">
          Common questions about HostelPups — pricing, verification, refunds, owner signup, KYC, and more.
        </p>
      </Container>
      <FaqSection title="" />
    </>
  );
}
