import * as React from "react";
import Link from "next/link";
import { ChevronDown, MapPin, Building2, Users, Tag as TagIcon, Navigation2 } from "lucide-react";
import {
  CITY_NAMES,
  KERALA_CITIES,
  FULL_SERVICE_CITIES,
} from "@/lib/site";
import { getAllListings } from "@/lib/mockListings";
import type { Listing, PropertyType, GenderPreference, WedgeTag } from "@/lib/types";
import { cn } from "@/lib/utils";

/**
 * URL search-params shape shared with the search page.
 * Kept in sync with `SearchParams` in `src/app/search/page.tsx`.
 */
export interface FilterParams {
  city?: string;
  area?: string;
  type?: PropertyType | string;
  gender?: GenderPreference | string;
  tag?: WedgeTag | string;
  q?: string;
}

interface FilterSidebarProps {
  current: FilterParams;
  /** Optional className for layout overrides (sticky/width). */
  className?: string;
  /** When true, render as a horizontal-stacked inline panel (used in mobile <details>). */
  inline?: boolean;
}

const ALL_CITIES = Array.from(
  new Set([...KERALA_CITIES, ...FULL_SERVICE_CITIES]),
);

const TYPE_OPTIONS: Array<{ value: PropertyType | string; label: string }> = [
  { value: "pg", label: "PG / Paying Guest" },
  { value: "hostel", label: "Hostel" },
  { value: "flat", label: "Flat / Apartment" },
];

const GENDER_OPTIONS: Array<{ value: GenderPreference | string; label: string }> = [
  { value: "any", label: "Co-living (any)" },
  { value: "women", label: "Women only" },
  { value: "men", label: "Men only" },
  { value: "couple", label: "Couple" },
  { value: "family", label: "Family" },
];

const TAG_OPTIONS: Array<{ value: WedgeTag | string; label: string; dot: string }> = [
  { value: "couple", label: "Couple-friendly", dot: "bg-pink-500" },
  { value: "bachelor", label: "Bachelor-friendly", dot: "bg-indigo-500" },
  { value: "pet", label: "Pet-friendly", dot: "bg-teal-500" },
  { value: "student", label: "Student-friendly", dot: "bg-amber-500" },
];

/**
 * Build a /search URL by overriding a single param. Empty values remove that key.
 * Mirrors `buildHref()` in the search page so the sidebar produces identical URLs.
 */
function buildHref(current: FilterParams, overrides: Partial<FilterParams>): string {
  const merged = { ...current, ...overrides };
  const sp = new URLSearchParams();
  for (const [k, v] of Object.entries(merged)) {
    if (v) sp.set(k, v);
  }
  const qs = sp.toString();
  return qs ? `/search?${qs}` : "/search";
}

/** Get all unique areas for a given city from mock listings. */
function getAreasForCity(city: string): string[] {
  const all: Listing[] = getAllListings();
  const set = new Set<string>();
  for (const l of all) {
    if (l.city.toLowerCase() === city.toLowerCase() && l.area) {
      set.add(l.area);
    }
  }
  return Array.from(set).sort();
}

interface GroupProps {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  defaultOpen?: boolean;
}

function FilterGroup({ title, icon, children, defaultOpen = true }: GroupProps) {
  return (
    <details
      open={defaultOpen}
      className="group border-b border-[var(--color-border)] last:border-b-0 py-4"
    >
      <summary className="flex items-center justify-between cursor-pointer list-none [&::-webkit-details-marker]:hidden min-h-[44px]">
        <span className="inline-flex items-center gap-2 text-sm font-semibold text-[var(--color-ink)]">
          <span className="text-[var(--color-brand-600)]" aria-hidden="true">
            {icon}
          </span>
          {title}
        </span>
        <ChevronDown
          size={16}
          aria-hidden="true"
          className="text-[var(--color-ink-subtle)] transition-transform group-open:rotate-180"
        />
      </summary>
      <div className="mt-3 space-y-1">{children}</div>
    </details>
  );
}

interface RadioRowProps {
  href: string;
  label: string;
  isActive: boolean;
  dot?: string;
}

function RadioRow({ href, label, isActive, dot }: RadioRowProps) {
  return (
    <Link
      href={href}
      aria-pressed={isActive}
      className={cn(
        "flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm min-h-[40px] transition-colors",
        isActive
          ? "bg-[var(--color-brand-100)] text-[var(--color-brand-900)] font-semibold"
          : "text-[var(--color-ink-muted)] hover:bg-[var(--color-surface)] hover:text-[var(--color-ink)]",
      )}
    >
      <span
        aria-hidden="true"
        className={cn(
          "inline-flex shrink-0 items-center justify-center rounded-full border-2 size-4",
          isActive
            ? "border-[var(--color-brand-600)] bg-[var(--color-brand-600)]"
            : "border-[var(--color-border-strong)] bg-transparent",
        )}
      >
        {isActive && (
          <span className="block size-1.5 rounded-full bg-white" />
        )}
      </span>
      {dot && (
        <span
          aria-hidden="true"
          className={cn("inline-block size-2 rounded-full", dot)}
        />
      )}
      <span className="flex-1 truncate">{label}</span>
    </Link>
  );
}

export function FilterSidebar({ current, className, inline = false }: FilterSidebarProps) {
  const hasFilters = Boolean(
    current.city ||
      current.area ||
      current.type ||
      current.gender ||
      current.tag,
  );

  const areas = current.city ? getAreasForCity(current.city) : [];

  return (
    <aside
      aria-label="Filter listings"
      className={cn(
        "rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-elevated)] p-4 shadow-sm",
        !inline &&
          "lg:sticky lg:top-20 lg:max-h-[calc(100vh-6rem)] lg:overflow-y-auto",
        className,
      )}
    >
      <div className="flex items-center justify-between pb-3 mb-1 border-b border-[var(--color-border)]">
        <h2 className="text-base font-bold text-[var(--color-ink)]">Filters</h2>
        {hasFilters && (
          <Link
            href="/search"
            className="text-xs font-semibold text-[var(--color-cta)] hover:underline"
          >
            Clear all
          </Link>
        )}
      </div>

      <nav aria-label="Filter groups">
        {/* City */}
        <FilterGroup title="City" icon={<MapPin size={14} />}>
          {ALL_CITIES.map((c) => {
            const isActive = current.city === c;
            // Selecting a different city clears any area selection.
            const href = buildHref(current, {
              city: isActive ? undefined : c,
              area: isActive ? undefined : undefined,
            });
            return (
              <RadioRow
                key={c}
                href={href}
                isActive={isActive}
                label={CITY_NAMES[c] ?? c}
              />
            );
          })}
        </FilterGroup>

        {/* Area (only shown if a city is selected and that city has areas in listings) */}
        {current.city && areas.length > 0 && (
          <FilterGroup
            title={`Area in ${CITY_NAMES[current.city] ?? current.city}`}
            icon={<Navigation2 size={14} />}
          >
            {areas.map((a) => {
              const isActive =
                current.area?.toLowerCase() === a.toLowerCase();
              const href = buildHref(current, {
                area: isActive ? undefined : a,
              });
              return (
                <RadioRow
                  key={a}
                  href={href}
                  isActive={isActive}
                  label={a}
                />
              );
            })}
          </FilterGroup>
        )}

        {/* Property type */}
        <FilterGroup title="Type" icon={<Building2 size={14} />}>
          {TYPE_OPTIONS.map((opt) => {
            const isActive = current.type === opt.value;
            const href = buildHref(current, {
              type: isActive ? undefined : opt.value,
            });
            return (
              <RadioRow
                key={String(opt.value)}
                href={href}
                isActive={isActive}
                label={opt.label}
              />
            );
          })}
        </FilterGroup>

        {/* Gender preference */}
        <FilterGroup title="Gender" icon={<Users size={14} />}>
          {GENDER_OPTIONS.map((opt) => {
            const isActive = current.gender === opt.value;
            const href = buildHref(current, {
              gender: isActive ? undefined : opt.value,
            });
            return (
              <RadioRow
                key={String(opt.value)}
                href={href}
                isActive={isActive}
                label={opt.label}
              />
            );
          })}
        </FilterGroup>

        {/* Wedge tag */}
        <FilterGroup title="Wedge" icon={<TagIcon size={14} />}>
          {TAG_OPTIONS.map((opt) => {
            const isActive = current.tag === opt.value;
            const href = buildHref(current, {
              tag: isActive ? undefined : opt.value,
            });
            return (
              <RadioRow
                key={String(opt.value)}
                href={href}
                isActive={isActive}
                label={opt.label}
                dot={opt.dot}
              />
            );
          })}
        </FilterGroup>

        {/* Price range (placeholder for now) */}
        <FilterGroup title="Price range" icon={<TagIcon size={14} />} defaultOpen={false}>
          <p className="px-2.5 py-2 text-xs text-[var(--color-ink-subtle)]">
            Coming soon
          </p>
        </FilterGroup>
      </nav>

      {hasFilters && (
        <div className="mt-3 pt-3 border-t border-[var(--color-border)]">
          <Link
            href="/search"
            className="block w-full rounded-lg bg-[var(--color-surface)] text-center py-2.5 text-sm font-semibold text-[var(--color-cta)] hover:bg-[var(--color-brand-100)] min-h-[44px] inline-flex items-center justify-center"
          >
            Clear all filters
          </Link>
        </div>
      )}
    </aside>
  );
}
