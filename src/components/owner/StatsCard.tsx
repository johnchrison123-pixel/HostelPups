import * as React from "react";
import { cn } from "@/lib/utils";

interface StatsCardProps {
  label: string;
  value: string | number;
  /** Small caption shown under the value (e.g. "+2 this week", or a PENDING note) */
  caption?: string;
  Icon?: React.ComponentType<{ size?: number; className?: string }>;
  /** Color tone for the icon tile. Defaults to brand. */
  tone?: "brand" | "success" | "cta" | "info";
  className?: string;
  /** When true, the value is shown muted to indicate placeholder data. */
  placeholder?: boolean;
}

const toneClasses: Record<NonNullable<StatsCardProps["tone"]>, string> = {
  brand: "bg-[var(--color-brand-100)] text-[var(--color-brand-700)]",
  success: "bg-emerald-50 text-emerald-700",
  cta: "bg-pink-50 text-pink-700",
  info: "bg-indigo-50 text-indigo-700",
};

export function StatsCard({
  label,
  value,
  caption,
  Icon,
  tone = "brand",
  className,
  placeholder,
}: StatsCardProps) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-elevated)] p-5 shadow-[var(--shadow-sm)]",
        className,
      )}
    >
      <div className="flex items-start gap-3">
        {Icon && (
          <span
            className={cn(
              "inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl",
              toneClasses[tone],
            )}
            aria-hidden="true"
          >
            <Icon size={20} />
          </span>
        )}
        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold uppercase tracking-wider text-[var(--color-ink-subtle)]">
            {label}
          </p>
          <p
            className={cn(
              "mt-1 text-3xl font-black tracking-tight tabular-nums",
              placeholder ? "text-[var(--color-ink-muted)]" : "text-[var(--color-ink)]",
            )}
          >
            {value}
          </p>
          {caption && (
            <p className="mt-1 text-xs text-[var(--color-ink-muted)]">{caption}</p>
          )}
        </div>
      </div>
    </div>
  );
}
