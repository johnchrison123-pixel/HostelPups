import type { Metadata } from "next";
import Link from "next/link";
import { Search as SearchIcon, MapPin, SlidersHorizontal, ShieldCheck } from "lucide-react";
import { Container } from "@/components/ui/Container";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { ListingGrid } from "@/components/listings/ListingGrid";
import { FilterSidebar } from "@/components/listings/FilterSidebar";
import { buildMetadata } from "@/lib/seo";
import {
  CITY_NAMES,
  KERALA_CITIES,
  FULL_SERVICE_CITIES,
  PROPERTY_TYPES,
  WEDGE_TAGS,
} from "@/lib/site";
import { createClient } from "@/lib/supabase/server";
import type {
  GenderPreference,
  Listing,
  PropertyType,
  WedgeTag,
} from "@/lib/types";
import { cn } from "@/lib/utils";

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

type PillTone = "default" | "brand" | "couple" | "bachelor" | "pet" | "student";

interface ActivePill {
  key: keyof SearchParams;
  label: string;
  tone: PillTone;
}

/** Build the list of small removable active-filter pills shown above the results grid. */
function buildActivePills(params: SearchParams): ActivePill[] {
  const pills: ActivePill[] = [];

  if (params.city) {
    pills.push({
      key: "city",
      label: CITY_NAMES[params.city] ?? params.city,
      tone: "brand",
    });
  }
  if (params.area) {
    pills.push({ key: "area", label: params.area, tone: "brand" });
  }
  if (params.type) {
    pills.push({
      key: "type",
      label: PROPERTY_TYPES[params.type as PropertyType] ?? params.type,
      tone: "default",
    });
  }
  if (params.gender) {
    const map: Record<string, string> = {
      any: "Co-living",
      women: "Women only",
      men: "Men only",
      couple: "Couple",
      family: "Family",
    };
    pills.push({ key: "gender", label: map[params.gender] ?? params.gender, tone: "default" });
  }
  if (params.tag) {
    const tag = params.tag as WedgeTag;
    pills.push({
      key: "tag",
      label: WEDGE_TAGS[tag] ?? params.tag,
      tone: (tag === "couple" || tag === "bachelor" || tag === "pet" || tag === "student")
        ? (tag as PillTone)
        : "default",
    });
  }
  if (params.q) {
    pills.push({ key: "q", label: `“${params.q}”`, tone: "default" });
  }

  return pills;
}

export default async function SearchPage({ searchParams }: Props) {
  const params = await searchParams;
  const supabase = await createClient();

  // Build the filtered query. Chain conditions only when the param is set.
  let query = supabase
    .from("listings")
    .select("*, room_types(*), photos:listing_photos(*)", { count: "exact" })
    .eq("status", "live");

  if (params.city) query = query.eq("city", params.city.toLowerCase());
  if (params.area) query = query.ilike("area", params.area);
  if (params.type) query = query.eq("type", params.type);
  if (params.gender) query = query.eq("gender_pref", params.gender);
  if (params.tag) query = query.contains("wedge_tags", [params.tag]);
  if (params.q) {
    // Text search across title, area, description.
    // Escape `%` and `,` in the user input so the .or() filter parses correctly.
    const safeQ = params.q.replace(/[%,]/g, " ").trim();
    if (safeQ) {
      query = query.or(
        `title.ilike.%${safeQ}%,area.ilike.%${safeQ}%,description.ilike.%${safeQ}%`,
      );
    }
  }

  const { data: resultsRows, count: resultsCount, error: resultsError } = await query
    .order("is_verified", { ascending: false })
    .order("updated_at", { ascending: false })
    .limit(50);

  if (resultsError) {
    console.error("SearchPage results query failed:", resultsError.message);
  }

  const results = (resultsRows ?? []) as unknown as Listing[];

  // Total live-listing count (no filters) for the "X of Y" display.
  const { count: grandTotal, error: grandTotalError } = await supabase
    .from("listings")
    .select("*", { count: "exact", head: true })
    .eq("status", "live");

  if (grandTotalError) {
    console.error("SearchPage grandTotal query failed:", grandTotalError.message);
  }

  const totalCount = grandTotal ?? 0;

  // Distinct areas for the active city — to populate the Area filter group.
  let distinctAreas: string[] = [];
  if (params.city) {
    const { data: areaRows, error: areaErr } = await supabase
      .from("listings")
      .select("area")
      .eq("city", params.city.toLowerCase())
      .eq("status", "live");
    if (areaErr) {
      console.error("SearchPage area query failed:", areaErr.message);
    }
    distinctAreas = Array.from(
      new Set((areaRows ?? []).map((r) => r.area as string).filter(Boolean)),
    ).sort();
  }

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

  const activePills = buildActivePills(params);
  const activeCount = activePills.length;
  // Reflect the actual filtered count from PostgREST; falls back to in-memory length.
  const resultsTotal = resultsCount ?? results.length;

  return (
    <Container size="xl" className="py-10 sm:py-14">
      <div className="grid gap-6 lg:gap-10 lg:grid-cols-[280px_1fr]">
        {/* Sidebar — visible on desktop only */}
        <div className="hidden lg:block">
          <FilterSidebar current={params} areas={distinctAreas} />
        </div>

        {/* Main column */}
        <div className="min-w-0">
          {/* Header */}
          <header className="mb-6">
            <h1 className="text-3xl sm:text-4xl font-black tracking-tight">
              {locationLabel
                ? `${tagLabel ?? typeLabel ?? "Verified PGs"} in ${locationLabel}`
                : "Search verified PGs, hostels & flats"}
            </h1>
            <p className="mt-2 text-[var(--color-ink-muted)]">
              {hasFilters
                ? `Showing ${resultsTotal} of ${totalCount} verified listings`
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

          {/* Mobile filter trigger — wraps the same sidebar in a <details> */}
          <details className="mt-4 lg:hidden group rounded-2xl border border-[var(--color-border-strong)] bg-[var(--color-bg-elevated)]">
            <summary
              aria-label={`Show filters${activeCount > 0 ? ` (${activeCount} active)` : ""}`}
              className="flex items-center justify-between cursor-pointer list-none [&::-webkit-details-marker]:hidden px-4 py-3 min-h-[48px]"
            >
              <span className="inline-flex items-center gap-2 text-sm font-semibold text-[var(--color-ink)]">
                <SlidersHorizontal size={16} aria-hidden="true" />
                Filters
                {activeCount > 0 && (
                  <span className="inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full bg-[var(--color-brand-500)] text-[var(--color-ink)] text-[11px] font-bold leading-none">
                    {activeCount}
                  </span>
                )}
              </span>
              <span
                aria-hidden="true"
                className="text-xs text-[var(--color-ink-subtle)] transition-transform group-open:rotate-180"
              >
                ▾
              </span>
            </summary>
            <div className="px-3 pb-3 -mt-1">
              <FilterSidebar current={params} areas={distinctAreas} inline className="border-0 shadow-none p-0" />
            </div>
          </details>

          {/* Active filter pills — quick-remove individual filters */}
          {activePills.length > 0 && (
            <div
              className="mt-5 flex items-center gap-2 flex-wrap"
              aria-label="Active filters"
            >
              <span className="text-xs font-semibold text-[var(--color-ink-muted)] uppercase tracking-wider">
                Active:
              </span>
              {activePills.map((pill) => {
                const removeHref = buildHref(params, {
                  [pill.key]: undefined,
                } as Partial<SearchParams>);
                return (
                  <Link
                    key={pill.key}
                    href={removeHref}
                    aria-label={`Remove ${pill.label} filter`}
                    className={cn(
                      "group inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium leading-none transition-colors min-h-[28px]",
                      pill.tone === "brand" &&
                        "bg-[var(--color-brand-100)] text-[var(--color-brand-900)] border-[var(--color-brand-300)] hover:bg-[var(--color-brand-200)]",
                      pill.tone === "couple" &&
                        "bg-pink-50 text-pink-700 border-pink-200 hover:bg-pink-100",
                      pill.tone === "bachelor" &&
                        "bg-indigo-50 text-indigo-700 border-indigo-200 hover:bg-indigo-100",
                      pill.tone === "pet" &&
                        "bg-teal-50 text-teal-700 border-teal-200 hover:bg-teal-100",
                      pill.tone === "student" &&
                        "bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100",
                      pill.tone === "default" &&
                        "bg-[var(--color-surface)] text-[var(--color-ink-muted)] border-[var(--color-border)] hover:bg-[var(--color-bg-elevated)]",
                    )}
                  >
                    <span>{pill.label}</span>
                    <span
                      aria-hidden="true"
                      className="inline-flex items-center justify-center size-4 rounded-full bg-black/5 group-hover:bg-black/10 text-[11px] leading-none"
                    >
                      ×
                    </span>
                  </Link>
                );
              })}
              <Link
                href="/search"
                className="ml-auto inline-flex items-center text-xs font-semibold text-[var(--color-cta)] hover:underline"
              >
                Clear all
              </Link>
            </div>
          )}

          {/* Results */}
          <div className="mt-6">
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
        </div>
      </div>
    </Container>
  );
}
