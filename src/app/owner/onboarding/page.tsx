import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Container } from "@/components/ui/Container";
import { OwnerOnboardingFlow } from "@/components/owner/OwnerOnboardingFlow";
import { buildMetadata } from "@/lib/seo";
import { getCurrentOwner } from "@/lib/owner-queries";

export const metadata: Metadata = buildMetadata({
  title: "Complete your owner setup",
  description: "Finish setting up your HostelPups owner account.",
  path: "/owner/onboarding",
  noindex: true,
});

/**
 * Landing page after the magic-link callback for owners.
 *
 * Flow:
 *   1. User signs up at /owner/signup (which sends a magic link with
 *      business_name + city stashed in user_metadata).
 *   2. They click the link → /auth/callback → exchanges code → redirects here.
 *   3. We call `ensureOwnerRecord()` to create the public.owners row from
 *      that metadata (idempotent).
 *   4. They pick a tier (full_service / self_serve) — `setOwnerTier()`.
 *   5. Redirect to /owner/dashboard.
 *
 * If the user already has an owners row, jump straight to the dashboard.
 */
export default async function OwnerOnboardingPage() {
  const current = await getCurrentOwner();
  if (!current) {
    redirect("/owner/login?next=/owner/onboarding");
  }
  if (current.owner) {
    // Already onboarded — straight to the dashboard.
    redirect("/owner/dashboard");
  }

  // Pull metadata stashed at signup, if present.
  // We can't access user_metadata via getCurrentOwner — it only returns the
  // profile row. ensureOwnerRecord reads metadata server-side instead.
  return (
    <Container size="md" className="py-10 sm:py-16">
      <header className="text-center mb-8">
        <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-[var(--color-ink)]">
          One last step
        </h1>
        <p className="mt-2 text-[var(--color-ink-muted)]">
          Pick a tier and we&apos;ll have your account ready in a few seconds.
          You can switch tiers later — billing only kicks in when you publish
          your first listing.
        </p>
      </header>
      <OwnerOnboardingFlow />
    </Container>
  );
}
