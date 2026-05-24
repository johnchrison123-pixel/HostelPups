import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { OwnerLayout } from "@/components/owner/OwnerSidebar";
import { ListingForm } from "@/components/owner/ListingForm";
import type { UploaderPhoto } from "@/components/owner/PhotoUploader";
import { buildMetadata } from "@/lib/seo";
import {
  getCurrentOwner,
  getOwnerListingById,
} from "@/lib/owner-queries";
import type { GenderPreference, PropertyType, WedgeTag } from "@/lib/types";

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  return buildMetadata({
    title: `Edit listing ${id.slice(0, 8)}`,
    description: "Edit your HostelPups listing details, photos, rooms, and tags.",
    path: `/owner/listings/${id}/edit`,
    noindex: true,
  });
}

export default async function EditListingPage({ params }: Props) {
  const { id } = await params;

  const current = await getCurrentOwner();
  if (!current) {
    redirect(`/owner/login?next=/owner/listings/${id}/edit`);
  }
  if (!current.owner) {
    redirect("/owner/onboarding");
  }

  const listing = await getOwnerListingById(id);
  if (!listing) {
    // RLS hides listings the user doesn't own → treat as not found.
    notFound();
  }

  // Map DB shape → ListingForm shape
  const rooms = (listing.room_types ?? []).map((rt, i) => ({
    id: rt.id ?? `existing_${i}`,
    name: rt.name,
    price: String(rt.price_per_month ?? ""),
    ac: !!rt.ac,
    occupancy: String(rt.occupancy ?? 1),
    vacancies: String(rt.vacancies ?? 0),
  }));

  const existingPhotos: UploaderPhoto[] = (listing.photos ?? [])
    .slice()
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
    .map((p) => ({
      id: p.id,
      preview: p.url,
      name: p.url.split("/").pop() ?? "photo",
      isCover: p.is_cover,
      order: p.order,
    }));

  const initial = {
    title: listing.title ?? "",
    type: (listing.type as PropertyType) ?? "pg",
    city: listing.city ?? "",
    area: listing.area ?? "",
    landmark: listing.landmark ?? "",
    description: listing.description ?? "",
    rooms: rooms.length > 0 ? rooms : undefined,
    amenities: listing.amenities ?? [],
    rules: (listing.house_rules ?? []).join("\n"),
    gender_pref: (listing.gender_pref as GenderPreference) ?? "any",
    wedge_tags: (listing.wedge_tags ?? []) as WedgeTag[],
    existingPhotos,
  };

  return (
    <OwnerLayout businessName={current.owner.business_name}>
      <header className="mb-6">
        <p className="text-xs uppercase tracking-wider font-semibold text-[var(--color-ink-subtle)]">
          Editing listing
        </p>
        <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
          {listing.title}
        </h1>
        <p className="mt-1 text-sm text-[var(--color-ink-muted)]">
          Status:{" "}
          <span className="font-semibold capitalize">
            {listing.status.replace("_", " ")}
          </span>
          {" · "}
          Listing id: <code className="font-mono text-xs">{id.slice(0, 8)}</code>
        </p>
      </header>

      <ListingForm mode="edit" listingId={id} initial={initial} />
    </OwnerLayout>
  );
}
