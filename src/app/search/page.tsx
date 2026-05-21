import type { Metadata } from "next";
import { Search as SearchIcon, MapPin, Filter } from "lucide-react";
import { Container } from "@/components/ui/Container";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { buildMetadata } from "@/lib/seo";

export const metadata: Metadata = buildMetadata({
  title: "Search PGs, Hostels & Flats Across India",
  description:
    "Search verified PGs, hostels, and rental flats by city, area, gender, budget, and amenities. Couple-friendly, bachelor-friendly, pet-friendly filters.",
  path: "/search",
});

export default function SearchPage() {
  return (
    <Container className="py-12 sm:py-16">
      {/* Search bar */}
      <div className="rounded-2xl border border-[var(--color-border-strong)] bg-[var(--color-bg-elevated)] p-3 shadow-[var(--shadow-md)]">
        <form className="flex items-stretch gap-2">
          <div className="flex items-center pl-3 pr-1 text-[var(--color-ink-subtle)]">
            <SearchIcon size={20} />
          </div>
          <input
            type="text"
            name="q"
            placeholder="City, area, or college name"
            className="flex-1 bg-transparent outline-none text-base placeholder:text-[var(--color-ink-subtle)]"
          />
          <Button type="submit" variant="cta">
            Search
          </Button>
        </form>
      </div>

      {/* Filters preview */}
      <div className="mt-4 flex items-center gap-2 flex-wrap">
        <Button variant="outline" size="sm">
          <Filter size={14} /> Filters
        </Button>
        <Badge>PG</Badge>
        <Badge>Hostel</Badge>
        <Badge>Flat</Badge>
        <Badge tone="couple">Couple-friendly</Badge>
        <Badge tone="bachelor">Bachelor-friendly</Badge>
        <Badge tone="pet">Pet-friendly</Badge>
      </div>

      {/* Placeholder content */}
      <div className="mt-12 rounded-2xl bg-[var(--color-surface)] border border-[var(--color-border)] p-12 text-center">
        <MapPin size={40} className="mx-auto text-[var(--color-brand-500)] mb-4" />
        <h2 className="text-2xl font-bold mb-2">Listings launching soon</h2>
        <p className="text-[var(--color-ink-muted)] max-w-md mx-auto">
          We&apos;re onboarding the first 500 verified PG owners in Kochi right now.
          Live search results will appear here in <strong>September 2026</strong>.
        </p>
        <div className="mt-6 flex justify-center gap-3">
          <Button href="/signup" variant="cta">
            Get launch alerts
          </Button>
          <Button href="/for-owners" variant="outline">
            Are you an owner? List here
          </Button>
        </div>
      </div>

      {/* Popular searches */}
      <div className="mt-12">
        <h3 className="font-bold text-lg mb-4">Popular searches</h3>
        <div className="flex flex-wrap gap-2">
          <Badge tone="brand">PG in Kochi</Badge>
          <Badge tone="brand">PG near Infopark</Badge>
          <Badge tone="brand">PG near Rajagiri</Badge>
          <Badge tone="brand">Hostels Kakkanad</Badge>
          <Badge tone="brand">Girls PG Edappally</Badge>
          <Badge tone="brand">Boys PG Kaloor</Badge>
          <Badge tone="couple">Couple flat Kochi</Badge>
          <Badge tone="pet">Pet friendly PG Kochi</Badge>
        </div>
      </div>
    </Container>
  );
}
