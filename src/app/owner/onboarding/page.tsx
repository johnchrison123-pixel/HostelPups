import type { Metadata } from "next";
import { Suspense } from "react";
import { redirect } from "next/navigation";
import { Container } from "@/components/ui/Container";
import { OwnerOnboardingFlow } from "@/components/owner/OwnerOnboardingFlow";
import { buildMetadata } from "@/lib/seo";
import { getCurrentOwner } from "@/lib/owner-queries";
import { getCurrentUser } from "@/lib/auth";

export const metadata: Metadata = buildMetadata({
  title: "Complete your owner setup",
  description: "Finish setting up your HostelPups owner account.",
  path: "/owner/onboarding",
  noindex: true,
});

/**
 * Landing page after password signup for owners.
 *
 * Flow:
 *   1. User signs up at /owner/signup with email + password + business_name
 *      + city + intent='owner' in user_metadata.
 *   2. Session is created immediately (no email confirmation in this build),
 *      they land here.
 *   3. We call `ensureOwnerRecord()` to create the public.owners row from
 *      that metadata (idempotent).
 *   4. They pick a tier (full_service / self_serve) — `setOwnerTier()`.
 *   5. Redirect to /owner/dashboard.
 *
 * If the user already has an owners row, jump straight to the dashboard.
 *
 * Privilege check: only accounts whose `user_metadata.intent === "owner"` can
 * reach this page. A renter visiting this URL is bounced home — they must go
 * through /owner/signup to create an owner account.
 */
export default async function OwnerOnboardingPage() {
  // Guard 1: must be signed in.
  const user = await getCurrentUser();
  if (!user) {
    redirect("/owner/login?next=/owner/onboarding");
  }
  // Guard 2: must have signed up as an owner. Default missing intent to
  // 'renter' so legacy/no-metadata accounts are treated as renters and
  // can't silently escalate to owner. Backward-compat: if a user somehow
  // already has an `owners` row (admin grant, legacy seed) we let them through.
  const intent =
    (user.user_metadata?.intent as string | undefined) ?? "renter";

  const current = await getCurrentOwner();
  if (intent !== "owner" && !current?.owner) {
    redirect("/?error=not_an_owner_account");
  }
  if (current?.owner) {
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
      {/* Suspense for useSearchParams inside OwnerOnboardingFlow. */}
      <Suspense fallback={null}>
        <OwnerOnboardingFlow />
      </Suspense>
    </Container>
  );
}
