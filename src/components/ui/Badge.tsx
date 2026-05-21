import * as React from "react";
import { cn } from "@/lib/utils";

type Tone =
  | "default"
  | "brand"
  | "couple"
  | "bachelor"
  | "pet"
  | "student"
  | "verified"
  | "warning"
  | "danger";

const toneClasses: Record<Tone, string> = {
  default:
    "bg-[var(--color-surface)] text-[var(--color-ink-muted)] border-[var(--color-border)]",
  brand:
    "bg-[var(--color-brand-100)] text-[var(--color-brand-900)] border-[var(--color-brand-300)]",
  couple:
    "bg-pink-50 text-pink-700 border-pink-200",
  bachelor:
    "bg-indigo-50 text-indigo-700 border-indigo-200",
  pet:
    "bg-teal-50 text-teal-700 border-teal-200",
  student:
    "bg-amber-50 text-amber-700 border-amber-200",
  verified:
    "bg-emerald-50 text-emerald-700 border-emerald-200",
  warning:
    "bg-amber-50 text-amber-800 border-amber-300",
  danger:
    "bg-red-50 text-red-700 border-red-200",
};

interface BadgeProps {
  tone?: Tone;
  className?: string;
  children: React.ReactNode;
  icon?: React.ReactNode;
}

export function Badge({ tone = "default", className, children, icon }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium leading-none",
        toneClasses[tone],
        className
      )}
    >
      {icon && <span className="inline-flex shrink-0">{icon}</span>}
      {children}
    </span>
  );
}
