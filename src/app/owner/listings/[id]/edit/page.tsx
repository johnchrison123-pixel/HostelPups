import type { Metadata } from "next";
import { OwnerLayout } from "@/components/owner/OwnerSidebar";
import { ListingForm } from "@/components/owner/ListingForm";
import { buildMetadata } from "@/lib/seo";

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  return buildMetadata({
    title: `Edit listing ${id}`,
    description: "Edit your HostelPups listing details, photos, rooms, and tags.",
    path: `/owner/listings/${id}/edit`,
    noindex: true,
  });
}

export default async function EditListingPage({ params }: Props) {
  const { id } = await params;

  // PENDING (Phase 1B): fetch real listing from public.listings by id.
  // For now we hydrate with placeholder values so the form is non-empty.
  const placeholderInitial = {
    title: "Sunshine PG (placeholder)",
    type: "pg" as const,
    city: "kochi",
    area: "Edappally",
    landmark: "Lulu Mall",
    description:
      "Modern PG just 8 minutes from Lulu Mall and Edappally Junction. Single and double rooms with AC, attached bathrooms, and home-cooked Kerala meals included.",
    rules:
      "No smoking\nEntry by 10:30 PM\nGuests only in common area",
  };

  return (
    <OwnerLayout>
      <header className="mb-6">
        <p className="text-xs uppercase tracking-wider font-semibold text-[var(--color-ink-subtle)]">
          Editing listing
        </p>
        <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
          {placeholderInitial.title}
        </h1>
        <p className="mt-1 text-sm text-[var(--color-ink-muted)]">
          Listing id: <code className="font-mono text-xs">{id}</code>
        </p>
        <p className="mt-2 text-[11px] uppercase tracking-wider font-bold text-amber-700">
          Pending Phase 1B — actual listing data will be fetched from Supabase
        </p>
      </header>

      <ListingForm mode="edit" listingId={id} initial={placeholderInitial} />
    </OwnerLayout>
  );
}
