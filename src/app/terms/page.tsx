import type { Metadata } from "next";
import { Container } from "@/components/ui/Container";
import { buildMetadata } from "@/lib/seo";

export const metadata: Metadata = buildMetadata({
  title: "Terms of Service",
  description: "HostelPups Terms of Service — rules for using the platform.",
  path: "/terms",
});

export default function TermsPage() {
  return (
    <Container size="md" className="py-16 sm:py-24">
      <h1 className="text-4xl sm:text-5xl font-black tracking-tight">Terms of Service</h1>
      <p className="mt-2 text-sm text-[var(--color-ink-subtle)]">
        Last updated: {new Date().toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}
      </p>

      <div className="mt-10 space-y-8 text-[var(--color-ink-muted)] leading-relaxed">
        <section>
          <h2 className="text-xl font-bold text-[var(--color-ink)] mb-2">1. What HostelPups is</h2>
          <p>
            HostelPups is a marketplace that connects renters with verified hostel/PG/flat owners. We are
            <strong className="text-[var(--color-ink)]"> not a broker, agent, landlord, or party to any rental agreement</strong>.
            Rental terms are negotiated directly between you and the owner.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-[var(--color-ink)] mb-2">2. Renter rules</h2>
          <ul className="list-disc pl-6 space-y-2">
            <li>You agree to use the platform only to find a place to live, not for commercial scraping or reselling.</li>
            <li>You must be 18+ to use HostelPups.</li>
            <li>You must not share, screenshot, or republish owner contact details obtained through the platform.</li>
            <li>Platform-fee refunds are at our discretion under the move-in guarantee — see refund policy.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-bold text-[var(--color-ink)] mb-2">3. Owner rules</h2>
          <ul className="list-disc pl-6 space-y-2">
            <li>You must own or have explicit authorization to list each property.</li>
            <li>Listings must be accurate — photos must reflect actual rooms, prices must match what you charge.</li>
            <li>You must not encourage renters to contact you outside the platform during the initial 30 days post-inquiry.</li>
            <li>You agree to KYC verification. False or expired KYC results in suspension.</li>
            <li>Three confirmed violations = permanent ban without refund of registration fee.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-bold text-[var(--color-ink)] mb-2">4. Payments &amp; refunds</h2>
          <p>
            All payments are non-refundable except: (a) duplicate charges, (b) clear platform errors, (c) the
            visit-protection guarantee — if a listing&apos;s photos or amenities are materially misrepresented
            compared to the physical property on the day of your visit, HostelPups refunds your{" "}
            <strong className="text-[var(--color-ink)]">platform fee only</strong> (we do not hold rent or
            deposits — those are between you and the owner). Refunds processed within 7 business days to the
            original payment method.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-[var(--color-ink)] mb-2">5. Disputes</h2>
          <p>
            Disputes between renters and owners are handled directly by both parties. HostelPups may, at its
            discretion, mediate but is not legally obligated to. Indian jurisdiction applies; Kochi courts have
            exclusive jurisdiction.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-[var(--color-ink)] mb-2">6. Liability</h2>
          <p>
            We try our best to verify owners and listings, but we&apos;re not liable for the actual condition,
            safety, or legality of any property. Always visit before paying any deposit to an owner.
          </p>
        </section>

        <p className="mt-12 text-sm text-[var(--color-ink-subtle)]">
          Last reviewed: {new Date().getFullYear()}. For legal concerns or
          DPDP Act 2023 compliance questions, email{" "}
          <a
            href="mailto:legal@hostelpups.com"
            className="text-[var(--color-brand-700)] hover:underline"
          >
            legal@hostelpups.com
          </a>
          .
        </p>
      </div>
    </Container>
  );
}
