import type { Metadata } from "next";
import { Container } from "@/components/ui/Container";
import { buildMetadata } from "@/lib/seo";

export const metadata: Metadata = buildMetadata({
  title: "Privacy Policy",
  description: "How HostelPups collects, uses, and protects your personal data.",
  path: "/privacy",
});

export default function PrivacyPage() {
  return (
    <Container size="md" className="py-16 sm:py-24">
      <h1 className="text-4xl sm:text-5xl font-black tracking-tight">Privacy Policy</h1>
      <p className="mt-2 text-sm text-[var(--color-ink-subtle)]">
        Last updated: {new Date().toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}
      </p>

      <div className="mt-10 space-y-8 text-[var(--color-ink-muted)] leading-relaxed">
        <section>
          <h2 className="text-xl font-bold text-[var(--color-ink)] mb-2">1. What we collect</h2>
          <p>
            Account info (name, phone, email), profile preferences (gender, college, professional status), search behavior,
            messages sent through the platform, payment metadata (Razorpay handles card data, not us), and KYC documents
            (for owners — Aadhaar, PAN, property documents, video verification recordings).
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-[var(--color-ink)] mb-2">2. How we use it</h2>
          <p>
            To run the platform, match you with relevant listings, process payments, send transactional emails/SMS,
            verify owners, prevent fraud, and improve product (aggregated, anonymized analytics).
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-[var(--color-ink)] mb-2">3. Who we share with</h2>
          <p>
            Other users only see what your profile / listings explicitly show. We share data with: Razorpay (payments),
            MSG91 (SMS), email providers, KYC verification partners, hosting providers, and law enforcement when
            legally required. We never sell your personal data to advertisers.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-[var(--color-ink)] mb-2">4. Your rights</h2>
          <p>
            You can request a copy of your data, ask us to delete your account, opt out of marketing emails, and update
            your profile at any time. Email <a href="mailto:privacy@hostelpups.in" className="text-[var(--color-brand-700)] hover:underline">privacy@hostelpups.in</a>.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-[var(--color-ink)] mb-2">5. Cookies</h2>
          <p>
            We use essential cookies (login, session) and analytics cookies (Google Analytics 4). No third-party
            advertising cookies. You can disable cookies in your browser — some features may not work.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-[var(--color-ink)] mb-2">6. Children</h2>
          <p>
            HostelPups is intended for users 18 years and older. If you believe we have data about anyone under 18,
            please contact us and we&apos;ll delete it.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-[var(--color-ink)] mb-2">7. Updates</h2>
          <p>
            We may update this policy as the platform evolves. Material changes will be announced via email.
            Continued use after changes means you accept them.
          </p>
        </section>

        <p className="text-sm italic mt-12">
          This is a placeholder privacy policy. Before launch, have it reviewed by a qualified Indian privacy lawyer
          to ensure compliance with the DPDP Act 2023 and IT Rules.
        </p>
      </div>
    </Container>
  );
}
