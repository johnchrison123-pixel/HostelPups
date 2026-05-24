import type { Metadata } from "next";
import Link from "next/link";
import { Bookmark, Heart } from "lucide-react";
import { Container } from "@/components/ui/Container";
import { Button } from "@/components/ui/Button";
import { ListingCard } from "@/components/listings/ListingCard";
import { buildMetadata } from "@/lib/seo";
import { createClient } from "@/lib/supabase/server";
import type { Listing } from "@/lib/types";

export const metadata: Metadata = buildMetadata({
  title: "Saved Listings",
  path: "/saved",
  noindex: true,
});

// Always render dynamically — output depends on auth state.
export const dynamic = "force-dynamic";

type FavoriteRow = {
  listing_id: string;
  created_at: string;
  listings: Listing | null;
};

export default async function SavedPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    // Signed-out CTA
    return (
      <Container size="md" className="py-16 sm:py-24">
        <div className="text-center max-w-xl mx-auto">
          <div className="mx-auto inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--color-brand-100)] text-[var(--color-brand-700)] mb-6">
            <Bookmark size={28} />
          </div>
          <h1 className="text-3xl sm:text-4xl font-black tracking-tight">
            Saved Listings
          </h1>
          <p className="mt-4 text-lg text-[var(--color-ink-muted)] leading-relaxed">
            Sign in to save your favourite PGs and view them anytime — on any
            device.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Button
              href="/login?next=%2Fsaved"
              variant="cta"
              size="lg"
            >
              Sign in
            </Button>
            <Button
              href="/signup?next=%2Fsaved"
              variant="outline"
              size="lg"
            >
              Create account
            </Button>
          </div>
        </div>
      </Container>
    );
  }

  // Signed in — query favorites joined with listings (+ room_types + photos).
  let favorites: FavoriteRow[] = [];
  try {
    const { data } = await supabase
      .from("favorites")
      .select(
        `
        listing_id,
        created_at,
        listings:listing_id (
          *,
          room_types(*),
          listing_photos(*)
        )
      `,
      )
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });
    favorites = (data ?? []) as unknown as FavoriteRow[];
  } catch {
    favorites = [];
  }

  // PostgREST renames listing_photos → photos via the type system in the rest of
  // the codebase (see ListingCard). Map the joined column to the expected field
  // name so cover images render.
  const listings: Listing[] = favorites
    .map((f) => f.listings)
    .filter((l): l is Listing => !!l && l.status === "live")
    .map((l) => {
      // Supabase returns the joined table under its actual column name.
      const raw = l as Listing & {
        listing_photos?: Listing["photos"];
      };
      if (!raw.photos && raw.listing_photos) {
        return { ...raw, photos: raw.listing_photos };
      }
      return raw;
    });

  return (
    <Container size="lg" className="py-10 sm:py-14">
      <header className="mb-8">
        <div className="inline-flex items-center gap-2 rounded-full border border-[var(--color-border)] bg-[var(--color-bg-elevated)] px-3 py-1 text-xs font-semibold text-[var(--color-ink-muted)] mb-4">
          <Heart
            size={12}
            className="fill-[var(--color-cta)] text-[var(--color-cta)]"
            aria-hidden="true"
          />
          {listings.length} saved
        </div>
        <h1 className="text-3xl sm:text-4xl font-black tracking-tight">
          Your saved listings
        </h1>
        <p className="mt-2 text-base text-[var(--color-ink-muted)]">
          Listings you&apos;ve hearted across HostelPups. Tap a heart again to
          remove.
        </p>
      </header>

      {listings.length === 0 ? (
        <div className="rounded-2xl border-2 border-dashed border-[var(--color-border-strong)] bg-[var(--color-surface)] p-10 text-center">
          <div className="mx-auto inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--color-brand-100)] text-[var(--color-brand-700)] mb-4">
            <Heart size={26} aria-hidden="true" />
          </div>
          <p className="text-base font-bold mb-1">No saved listings yet</p>
          <p className="text-sm text-[var(--color-ink-muted)] max-w-md mx-auto mb-5">
            Browse listings and click the heart icon to save any PG, hostel, or
            flat that catches your eye.
          </p>
          <Link
            href="/search"
            className="inline-flex items-center gap-1 text-sm font-semibold text-[var(--color-brand-700)] hover:underline"
          >
            Browse listings
            <span aria-hidden="true">→</span>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {listings.map((l) => (
            <ListingCard
              key={l.id}
              listing={{ ...l, photos: l.photos ?? [] }}
              headingLevel={2}
              initialFavorited
            />
          ))}
        </div>
      )}
    </Container>
  );
}
