import * as React from "react";
import Link from "next/link";
import { Building2, ArrowRight } from "lucide-react";
import { ListingCard } from "./ListingCard";
import type { Listing } from "@/lib/types";
import { cn } from "@/lib/utils";

type Columns = 2 | 3 | 4;

const columnClasses: Record<Columns, string> = {
  2: "grid-cols-1 sm:grid-cols-2",
  3: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3",
  4: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4",
};

interface ListingGridProps {
  listings: Listing[];
  columns?: Columns;
  /** Heading level used for each card's title (h2/h3/h4). */
  headingLevel?: 2 | 3 | 4;
  variant?: "default" | "compact";
  emptyMessage?: string;
  emptyCtaHref?: string;
  emptyCtaLabel?: string;
  /** Hide city from card subtitles (use when grid lives on a city page). */
  hideCity?: boolean;
  className?: string;
}

export function ListingGrid({
  listings,
  columns = 3,
  headingLevel = 3,
  variant = "default",
  emptyMessage = "No listings yet for this filter — be the first to list yours.",
  emptyCtaHref = "/owner/signup",
  emptyCtaLabel = "List your property",
  hideCity = false,
  className,
}: ListingGridProps) {
  if (listings.length === 0) {
    return (
      <div
        className={cn(
          "rounded-2xl border border-dashed border-[var(--color-border-strong)] bg-[var(--color-surface)] p-10 text-center",
          className,
        )}
      >
        <Building2
          size={32}
          className="mx-auto text-[var(--color-brand-500)] mb-3"
          aria-hidden="true"
        />
        <p className="text-base font-semibold text-[var(--color-ink)] mb-1">
          No listings here yet
        </p>
        <p className="text-sm text-[var(--color-ink-muted)] max-w-md mx-auto mb-5">
          {emptyMessage}
        </p>
        <Link
          href={emptyCtaHref}
          className="inline-flex items-center gap-1 text-sm font-semibold text-[var(--color-brand-700)] hover:underline"
        >
          {emptyCtaLabel}
          <ArrowRight size={14} aria-hidden="true" />
        </Link>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "grid gap-5",
        variant === "compact" ? "grid-cols-1" : columnClasses[columns],
        className,
      )}
    >
      {listings.map((l) => (
        <ListingCard
          key={l.id}
          listing={l}
          headingLevel={headingLevel}
          variant={variant}
          hideCity={hideCity}
        />
      ))}
    </div>
  );
}
