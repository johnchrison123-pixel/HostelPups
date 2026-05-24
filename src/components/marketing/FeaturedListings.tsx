import * as React from "react";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { Container } from "@/components/ui/Container";
import { ListingGrid } from "@/components/listings/ListingGrid";
import { getFeaturedListings } from "@/lib/mockListings";

export function FeaturedListings() {
  const featured = getFeaturedListings(8);

  return (
    <section
      className="py-16 sm:py-24 bg-[var(--color-bg)]"
      aria-labelledby="featured-listings-heading"
    >
      <Container>
        {/* Section header */}
        <div className="flex items-end justify-between flex-wrap gap-4 mb-10">
          <div>
            <p className="text-sm font-semibold text-[var(--color-brand-700)] uppercase tracking-wider">
              Fresh on HostelPups
            </p>
            <h2
              id="featured-listings-heading"
              className="mt-2 text-3xl sm:text-4xl font-black tracking-tight"
            >
              Verified PGs near you
            </h2>
            <p className="mt-3 text-base sm:text-lg text-[var(--color-ink-muted)] max-w-xl">
              Hand-picked listings across our launch cities — every one KYC-verified, no broker fees.
            </p>
          </div>
          <Link
            href="/search"
            className="inline-flex items-center gap-1 text-sm font-semibold text-[var(--color-brand-700)] hover:underline"
          >
            View all listings
            <ArrowUpRight size={16} aria-hidden="true" />
          </Link>
        </div>

        {/* Cards grid — h3 since the section heading is h2 */}
        <ListingGrid
          listings={featured}
          columns={4}
          headingLevel={3}
        />
      </Container>
    </section>
  );
}
