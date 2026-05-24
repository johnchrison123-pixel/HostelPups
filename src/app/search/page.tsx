import type { Metadata } from "next";
import Link from "next/link";
import { Search as SearchIcon, MapPin, Filter, ShieldCheck } from "lucide-react";
import { Container } from "@/components/ui/Container";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { ListingGrid } from "@/components/listings/ListingGrid";
import { buildMetadata } from "@/lib/seo";
import {
  CITY_NAMES,
  KERALA_CITIES,
  FULL_SERVICE_CITIES,
  PROPERTY_TYPES,
  WEDGE_TAGS,
} from "@/lib/site";
import { getAllListings } from "@/lib/mockListings";
import type {
  GenderPreference,
  Listing,
  PropertyType,
  WedgeTag,
} from "@/lib/types";

export const metadata: Metadata = buildMetadata({
  title: "Search PGs, Hostels & Flats Across India",
  description:
    "Search verified PGs, hostels, and rental flats by city, area, gender, budget, and amenities. Couple-friendly, bachelor-friendly, pet-friendly filters.",
  path: "/search",
  keywords: [
    "search PG India",
    "verified PG search",
    "filter PG by city",
    "couple PG search",
    "bachelor PG search",
    "pet friendly PG search",
  ],
});

interface SearchParams {
  city?: string;
  area?: string;
  type?: PropertyType | string;
  gender?: GenderPreference | string;
  tag?: WedgeTag | string;
  q?: string;
}

type Props = { searchParams: Promise<SearchParams> };

/**
 * Filter the mock listings on the server using URL search params.
 * In Phase 1 this gets replaced with a real Supabase `.from('listings').select()` chain
 * with the same filter signature — keep names in sync.
 */
function filterListings(all: Listing[], params: SearchParams): Listing[] {
  let out = all;
  if (params.city) {
    out = out.filter((l) => l.city.toLowerCase() === params.city!.toLowerCase());
  }
  if (params.area) {
    out = out.filter((l) => l.area.toLowerCase() === params.area!.toLowerCase());
  }
  if (params.type) {
    out = out.filter((l) => l.type === params.type);
  }
  if (params.gender) {
    out = out.filter((l) => l.gender_pref === params.gender);
  }
  if (params.tag) {
    out = out.filter((l) =>
      l.wedge_tags.includes(params.tag as WedgeTag),
    );
  }
  if (params.q) {
    const q = params.q.toLowerCase();
    out = out.filter((l) =>
      [l.title, l.area, l.description, CITY_NAMES[l.city] ?? l.city]
        .join(" ")
        .toLowerCase()
        .includes(q),
    );
  }
  return out;
}

/**
 * Build a query string by overriding a single param.
 * Empty value removes that key.
 */
function buildHref(current: SearchParams, overrides: Partial<SearchParams>): string {
  const merged = { ...current, ...overrides };
  const sp = new URLSearchParams();
  for (const [k, v] of Object.entries(merged)) {
    if (v) sp.set(k, v);
  }
  const qs = sp.toString();
  return qs ? `/search?${qs}` : "/search";
}

const ALL_CITIES = Array.from(
  new Set([...KERALA_CITIES, ...FULL_SERVICE_CITIES]),
);

export default async function SearchPage({ searchParams }: Props) {
  const params = await searchParams;
  const all = getAllListings();
  const results = filterListings(all, params);
  const totalCount = all.length;
  const hasFilters = Boolean(
    params.city || params.area || params.type || params.gender || params.tag || params.q,
  );

  const cityName = params.city ? CITY_NAMES[params.city] ?? params.city : null;
  const tagLabel = params.tag ? WEDGE_TAGS[params.tag as WedgeTag] : null;
  const typeLabel = params.type
    ? PROPERTY_TYPES[params.type as PropertyType]
    : null;
  const areaLabel = params.area ?? null;
  const locationLabel = cityName
    ? areaLabel
      ? `${areaLabel}, ${cityName}`
      : cityName
    : null;

  return (
    <Container className="py-10 sm:py-14">
      {/* Header */}
      <header className="mb-8">
        <h1 className="text-3xl sm:text-4xl font-black tracking-tight">
          {locationLabel
            ? `${tagLabel ?? typeLabel ?? "Verified PGs"} in ${locationLabel}`
            : "Search verified PGs, hostels & flats"}
        </h1>
        <p className="mt-2 text-[var(--color-ink-muted)]">
          {hasFilters
            ? `Showing ${results.length} of ${totalCount} verified listings`
            : `Browse all ${totalCount} verified listings across our launch cities.`}
        </p>
      </header>

      {/* Search bar */}
      <form
        action="/search"
        method="get"
        className="rounded-2xl border border-[var(--color-border-strong)] bg-[var(--color-bg-elevated)] p-3 shadow-[var(--shadow-md)]"
      >
        <div className="flex items-stretch gap-2">
          <div className="flex items-center pl-3 pr-1 text-[var(--color-ink-subtle)]">
            <SearchIcon size={20} aria-hidden="true" />
          </div>
          <label htmlFor="search-q" className="sr-only">
            Search by city, area, or property name
          </label>
          <input
            id="search-q"
            type="text"
            name="q"
            defaultValue={params.q ?? ""}
            placeholder="City, area, or property name"
            className="flex-1 bg-transparent outline-none text-base placeholder:text-[var(--color-ink-subtle)]"
          />
          {/* Persist other filters when running a new text search */}
          {params.city && <input type="hidden" name="city" value={params.city} />}
          {params.area && <input type="hidden" name="area" value={params.area} />}
          {params.type && <input type="hidden" name="type" value={params.type} />}
          {params.gender && <input type="hidden" name="gender" value={params.gender} />}
          {params.tag && <input type="hidden" name="tag" value={params.tag} />}
          <Button type="submit" variant="cta">
            Search
          </Button>
        </div>
      </form>

      {/* Filter chips */}
      <nav
        className="mt-4 flex items-center gap-2 flex-wrap"
        aria-label="Filter listings"
      >
        <span className="inline-flex items-center gap-1 text-xs font-semibold text-[var(--color-ink-muted)] uppercase tracking-wider mr-1">
          <Filter size={12} aria-hidden="true" />
          Filters
        </span>

        {/* City filter */}
        <FilterChipGroup
          label="City"
          activeValue={params.city}
          basePath="/search"
          current={params}
          paramKey="city"
          options={ALL_CITIES.map((c) => ({ value: c, label: CITY_NAMES[c] ?? c }))}
        />

        {/* Type filter */}
        <FilterChipGroup
          label="Type"
          activeValue={params.type}
          basePath="/search"
          current={params}
          paramKey="type"
          options={[
            { value: "pg", label: "PG" },
            { value: "hostel", label: "Hostel" },
            { value: "flat", label: "Flat" },
          ]}
        />

        {/* Gender filter */}
        <FilterChipGroup
          label="Gender"
          activeValue={params.gender}
          basePath="/search"
          current={params}
          paramKey="gender"
          options={[
            { value: "any", label: "Co-living" },
            { value: "women", label: "Women only" },
            { value: "men", label: "Men only" },
            { value: "couple", label: "Couple" },
            { value: "family", label: "Family" },
          ]}
        />

        {/* Wedge filter */}
        <FilterChipGroup
          label="Tag"
          activeValue={params.tag}
          basePath="/search"
          current={params}
          paramKey="tag"
          options={[
            { value: "couple", label: "Couple-friendly", tone: "couple" },
            { value: "bachelor", label: "Bachelor-friendly", tone: "bachelor" },
            { value: "pet", label: "Pet-friendly", tone: "pet" },
            { value: "student", label: "Student-friendly", tone: "student" },
          ]}
        />

        {hasFilters && (
          <Link
            href="/search"
            className="ml-auto inline-flex items-center text-xs font-semibold text-[var(--color-cta)] hover:underline"
          >
            Clear all
          </Link>
        )}
      </nav>

      {/* Results */}
      <div className="mt-8">
        <ListingGrid
          listings={results}
          columns={3}
          headingLevel={2}
          emptyMessage={
            cityName
              ? `No listings matching your filters in ${cityName}. Try clearing a filter or browse other cities.`
              : "No listings match your filters. Clear a filter or browse all cities."
          }
          emptyCtaHref="/search"
          emptyCtaLabel="Clear filters"
        />
      </div>

      {/* Popular searches */}
      <section aria-labelledby="popular-searches-heading" className="mt-16">
        <h2
          id="popular-searches-heading"
          className="font-bold text-lg mb-4 flex items-center gap-2"
        >
          <SearchIcon size={16} className="text-[var(--color-brand-600)]" aria-hidden="true" />
          Popular searches
        </h2>
        <div className="flex flex-wrap gap-2">
          <Link href="/search?city=kochi"><Badge tone="brand">PG in Kochi</Badge></Link>
          <Link href="/search?city=bangalore"><Badge tone="brand">PG in Bangalore</Badge></Link>
          <Link href="/search?city=chennai"><Badge tone="brand">PG in Chennai</Badge></Link>
          <Link href="/search?city=trivandrum&tag=student"><Badge tone="student">Student PG Trivandrum</Badge></Link>
          <Link href="/search?city=kochi&gender=women"><Badge tone="brand">Girls PG Kochi</Badge></Link>
          <Link href="/search?city=kochi&gender=men"><Badge tone="brand">Boys PG Kochi</Badge></Link>
          <Link href="/search?tag=couple"><Badge tone="couple">Couple flat India</Badge></Link>
          <Link href="/search?tag=pet"><Badge tone="pet">Pet friendly PG India</Badge></Link>
          <Link href="/search?tag=bachelor"><Badge tone="bachelor">Bachelor-friendly PG</Badge></Link>
        </div>
      </section>

      {/* Internal-linking footer for SEO */}
      <section
        aria-labelledby="search-explore-cities-heading"
        className="mt-12 rounded-2xl bg-[var(--color-surface)] border border-[var(--color-border)] p-6"
      >
        <h2
          id="search-explore-cities-heading"
          className="font-bold text-lg mb-3 flex items-center gap-2"
        >
          <MapPin size={16} className="text-[var(--color-brand-600)]" aria-hidden="true" />
          Explore PGs by city
        </h2>
        <div className="flex flex-wrap gap-2">
          {ALL_CITIES.map((c) => (
            <Link
              key={c}
              href={`/pg-in-${c}`}
              className="text-sm font-medium text-[var(--color-brand-700)] hover:underline"
            >
              PG in {CITY_NAMES[c] ?? c}
            </Link>
          ))}
        </div>
        <p className="mt-4 inline-flex items-center gap-1.5 text-xs text-[var(--color-ink-muted)]">
          <ShieldCheck size={12} className="text-emerald-600" aria-hidden="true" />
          Every owner KYC-verified before going live.
        </p>
      </section>
    </Container>
  );
}

/* ------------------------------------------------------------------ */
/* Internal: filter chip group                                          */
/* ------------------------------------------------------------------ */

type ChipTone = "default" | "brand" | "couple" | "bachelor" | "pet" | "student" | "verified" | "warning" | "danger";

interface FilterChipGroupProps {
  label: string;
  paramKey: keyof SearchParams;
  activeValue?: string;
  options: Array<{ value: string; label: string; tone?: ChipTone }>;
  basePath: string;
  current: SearchParams;
}

function FilterChipGroup({
  paramKey,
  activeValue,
  options,
  current,
}: FilterChipGroupProps) {
  return (
    <>
      {options.map((opt) => {
        const isActive = activeValue === opt.value;
        const href = buildHref(current, {
          [paramKey]: isActive ? undefined : opt.value,
        } as Partial<SearchParams>);
        return (
          <Link key={opt.value} href={href}>
            <Badge
              tone={isActive ? "brand" : opt.tone ?? "default"}
              className={
                isActive
                  ? "ring-2 ring-[var(--color-brand-400)] cursor-pointer"
                  : "cursor-pointer hover:bg-[var(--color-brand-100)]"
              }
            >
              {opt.label}
              {isActive && <span aria-hidden="true">×</span>}
            </Badge>
          </Link>
        );
      })}
    </>
  );
}
