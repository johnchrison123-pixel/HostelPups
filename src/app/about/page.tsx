import type { Metadata } from "next";
import { Container } from "@/components/ui/Container";
import { buildMetadata } from "@/lib/seo";

export const metadata: Metadata = buildMetadata({
  title: "About HostelPups",
  description:
    "HostelPups is India's first hostel and PG marketplace built for the renters everyone else ignores — couples, bachelors, students, and pet owners. Founded in Kochi, expanding across India.",
  path: "/about",
});

export default function AboutPage() {
  return (
    <Container size="md" className="py-16 sm:py-24">
      <p className="text-sm font-semibold text-[var(--color-brand-700)] uppercase tracking-wider">
        About Us
      </p>
      <h1 className="mt-2 text-4xl sm:text-5xl font-black tracking-tight">
        Built in Kochi. For India.
      </h1>

      <div className="mt-8 prose prose-lg max-w-none text-[var(--color-ink-muted)] leading-relaxed space-y-6">
        <p className="text-xl">
          HostelPups started with a simple frustration: <strong className="text-[var(--color-ink)]">
          finding a decent PG in India is awful</strong>. Brokers charge a month&apos;s
          rent. Landlords reject couples, bachelors, pet owners, and almost
          anyone who&apos;s not a married working professional. Listings are
          either fake, outdated, or hidden behind paywalls disguised as
          &quot;premium memberships&quot;.
        </p>

        <p>
          We&apos;re fixing that, one verified hostel at a time. Every owner on
          HostelPups completes KYC — government ID + video call + live location
          + Google research. Every photo is watermarked. Every listing clearly
          says who it welcomes: couples, bachelors, students, families, pet
          owners. Filters that should have existed for years finally do.
        </p>

        <p>
          And we charge renters honest, one-time prices — ₹99 for a week,
          ₹199 for a month, ₹499 for a year — instead of monthly subscriptions
          you forget to cancel. PG hunting is one-shot use. So we built one-shot
          pricing.
        </p>

        <h2 className="text-2xl font-bold text-[var(--color-ink)] mt-12">
          Why &quot;HostelPups&quot;?
        </h2>
        <p>
          Because finding a hostel shouldn&apos;t feel like an interrogation.
          It should feel like talking to a friendly pup who knows the
          neighborhood. (Also: we&apos;re proudly pet-friendly. Bring your dog,
          your cat, your hamster. We have listings for them too.)
        </p>

        <h2 className="text-2xl font-bold text-[var(--color-ink)] mt-12">
          Where we&apos;re live
        </h2>
        <p>
          <strong className="text-[var(--color-ink)]">Kochi</strong> — full-service,
          team on the ground.
          <br />
          <strong className="text-[var(--color-ink)]">Bangalore + Chennai</strong> —
          launching Q3/Q4.
          <br />
          <strong className="text-[var(--color-ink)]">All other Kerala cities</strong> —
          self-serve listings for owners.
          <br />
          <strong className="text-[var(--color-ink)]">Rest of India</strong> —
          self-serve listings expanding monthly.
        </p>
      </div>
    </Container>
  );
}
