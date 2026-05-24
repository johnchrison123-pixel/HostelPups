import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { OwnerLayout } from "@/components/owner/OwnerSidebar";
import { ListingForm } from "@/components/owner/ListingForm";
import { buildMetadata } from "@/lib/seo";
import { getCurrentOwner } from "@/lib/owner-queries";

export const metadata: Metadata = buildMetadata({
  title: "Create a new listing",
  description: "Add a new PG, hostel, or rental flat to HostelPups.",
  path: "/owner/listings/new",
  noindex: true,
});

export default async function NewListingPage() {
  const current = await getCurrentOwner();
  if (!current) {
    redirect("/owner/login?next=/owner/listings/new");
  }
  if (!current.owner) {
    redirect("/owner/onboarding");
  }

  return (
    <OwnerLayout businessName={current.owner.business_name}>
      <header className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
          Create a new listing
        </h1>
        <p className="mt-1 text-sm text-[var(--color-ink-muted)]">
          Five quick steps. Save as draft any time — you can come back later to add photos.
        </p>
      </header>

      <ListingForm mode="new" />
    </OwnerLayout>
  );
}
