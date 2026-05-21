import * as React from "react";
import { cn } from "@/lib/utils";

interface CardProps {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
}

export function Card({ children, className, hover }: CardProps) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-elevated)] p-6 shadow-[var(--shadow-sm)]",
        hover &&
          "transition-all duration-200 hover:shadow-[var(--shadow-lg)] hover:border-[var(--color-brand-300)] hover:-translate-y-0.5",
        className
      )}
    >
      {children}
    </div>
  );
}
