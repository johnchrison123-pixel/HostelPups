"use client";

import * as React from "react";
import { ChevronDown } from "lucide-react";
import { Container } from "@/components/ui/Container";
import { cn } from "@/lib/utils";
import { FAQ_ITEMS } from "@/lib/faq";

export function FaqSection({
  items = FAQ_ITEMS,
  title = "Frequently asked questions",
}: {
  items?: typeof FAQ_ITEMS;
  title?: string;
}) {
  const [openIdx, setOpenIdx] = React.useState<number | null>(0);

  return (
    <section className="py-16 sm:py-24 bg-[var(--color-surface)] border-y border-[var(--color-border)]">
      <Container size="md">
        <div className="text-center mb-12">
          <p className="text-sm font-semibold text-[var(--color-brand-700)] uppercase tracking-wider">
            FAQ
          </p>
          <h2 className="mt-2 text-3xl sm:text-4xl font-black tracking-tight">
            {title}
          </h2>
        </div>

        <div className="flex flex-col gap-3">
          {items.map((item, i) => {
            const open = i === openIdx;
            return (
              <div
                key={item.q}
                className={cn(
                  "rounded-2xl border bg-[var(--color-bg-elevated)] overflow-hidden transition-all",
                  open
                    ? "border-[var(--color-brand-400)] shadow-[var(--shadow-md)]"
                    : "border-[var(--color-border)]"
                )}
              >
                <button
                  type="button"
                  onClick={() => setOpenIdx(open ? null : i)}
                  className="w-full px-5 sm:px-6 py-4 flex items-center justify-between gap-4 text-left"
                  aria-expanded={open}
                >
                  <span className="font-semibold text-base sm:text-lg">{item.q}</span>
                  <ChevronDown
                    size={20}
                    className={cn(
                      "shrink-0 text-[var(--color-ink-muted)] transition-transform",
                      open && "rotate-180 text-[var(--color-brand-700)]"
                    )}
                  />
                </button>
                {open && (
                  <div className="px-5 sm:px-6 pb-5 text-[var(--color-ink-muted)] leading-relaxed">
                    {item.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </Container>
    </section>
  );
}
