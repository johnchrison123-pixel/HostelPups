import type { Metadata } from "next";
import { Mail, MessageSquare, Building } from "lucide-react";
import { Container } from "@/components/ui/Container";
import { buildMetadata } from "@/lib/seo";
import { SITE } from "@/lib/site";

export const metadata: Metadata = buildMetadata({
  title: "Contact HostelPups",
  description: "Get in touch with HostelPups — owner support, renter support, partnerships.",
  path: "/contact",
});

const channels = [
  {
    icon: MessageSquare,
    title: "Renter support",
    desc: "Issues with a listing, refund queries, account help.",
    contact: SITE.supportEmail,
  },
  {
    icon: Building,
    title: "Owner support",
    desc: "Listing setup, KYC, photoshoot scheduling, payments.",
    contact: SITE.ownerEmail,
  },
  {
    icon: Mail,
    title: "Partnerships",
    desc: "Press, advertising, brand collaborations.",
    contact: SITE.email,
  },
];

export default function ContactPage() {
  return (
    <Container size="md" className="py-16 sm:py-24">
      <p className="text-sm font-semibold text-[var(--color-brand-700)] uppercase tracking-wider">
        Get in touch
      </p>
      <h1 className="mt-2 text-4xl sm:text-5xl font-black tracking-tight">
        We&apos;re here to help.
      </h1>
      <p className="mt-4 text-lg text-[var(--color-ink-muted)]">
        Pick the right channel below — we typically reply within 24 hours on
        weekdays.
      </p>

      <div className="mt-12 grid sm:grid-cols-3 gap-5">
        {channels.map((c) => {
          const Icon = c.icon;
          return (
            <div
              key={c.title}
              className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-elevated)] p-6"
            >
              <div className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-[var(--color-brand-100)] text-[var(--color-brand-700)] mb-4">
                <Icon size={20} />
              </div>
              <h3 className="font-bold mb-1">{c.title}</h3>
              <p className="text-sm text-[var(--color-ink-muted)] mb-3 leading-relaxed">{c.desc}</p>
              <a
                href={`mailto:${c.contact}`}
                className="text-sm font-semibold text-[var(--color-brand-700)] hover:underline break-all"
              >
                {c.contact}
              </a>
            </div>
          );
        })}
      </div>

      <div className="mt-16 rounded-2xl bg-[var(--color-surface)] border border-[var(--color-border)] p-8">
        <h2 className="font-bold text-lg">Office (Kochi HQ)</h2>
        <p className="mt-2 text-[var(--color-ink-muted)] leading-relaxed">
          HostelPups Technologies Pvt. Ltd.
          <br />
          Kochi, Kerala, India
          <br />
          Address details available upon request — please email{" "}
          <a
            href={`mailto:${SITE.email}`}
            className="text-[var(--color-brand-700)] hover:underline"
          >
            {SITE.email}
          </a>
        </p>
      </div>
    </Container>
  );
}
