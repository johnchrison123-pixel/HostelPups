"use client";

import * as React from "react";
import Link from "next/link";
import { Menu, X, Search } from "lucide-react";
import { Container } from "@/components/ui/Container";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";

const navLinks = [
  { href: "/search", label: "Find PG" },
  { href: "/couple-friendly-pg/kochi", label: "Couple-Friendly" },
  { href: "/pet-friendly-pg/kochi", label: "Pet-Friendly" },
  { href: "/for-owners", label: "List Your Property" },
];

export function Header() {
  const [open, setOpen] = React.useState(false);
  const [scrolled, setScrolled] = React.useState(false);

  React.useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={cn(
        "sticky top-0 z-40 transition-all duration-200",
        scrolled
          ? "bg-[var(--color-bg)]/90 backdrop-blur-md border-b border-[var(--color-border)]"
          : "bg-transparent"
      )}
    >
      <Container size="xl">
        <nav className="flex h-16 items-center justify-between gap-4">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 font-bold text-xl shrink-0">
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--color-brand-500)] text-[var(--color-ink)] font-black">
              HP
            </span>
            <span className="hidden sm:inline">HostelPups</span>
          </Link>

          {/* Desktop nav */}
          <ul className="hidden lg:flex items-center gap-7 text-sm font-medium">
            {navLinks.map((l) => (
              <li key={l.href}>
                <Link
                  href={l.href}
                  className="text-[var(--color-ink-muted)] hover:text-[var(--color-ink)] transition-colors"
                >
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>

          {/* Right actions */}
          <div className="flex items-center gap-2">
            <Link
              href="/search"
              aria-label="Search"
              className="inline-flex lg:hidden h-10 w-10 items-center justify-center rounded-full hover:bg-[var(--color-brand-100)]"
            >
              <Search size={20} />
            </Link>
            <div className="hidden sm:flex items-center gap-2">
              <Button href="/login" variant="ghost" size="sm">
                Login
              </Button>
              <Button href="/signup" variant="primary" size="sm">
                Sign Up
              </Button>
            </div>
            <button
              type="button"
              aria-label="Open menu"
              onClick={() => setOpen(true)}
              className="inline-flex lg:hidden h-10 w-10 items-center justify-center rounded-full hover:bg-[var(--color-brand-100)]"
            >
              <Menu size={22} />
            </button>
          </div>
        </nav>
      </Container>

      {/* Mobile drawer */}
      {open && (
        <div
          className="fixed inset-0 z-50 lg:hidden"
          onClick={() => setOpen(false)}
        >
          <div className="absolute inset-0 bg-black/40" />
          <div
            className="absolute right-0 top-0 h-full w-80 max-w-[85vw] bg-[var(--color-bg)] shadow-2xl flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-4 border-b border-[var(--color-border)]">
              <span className="font-bold text-lg">Menu</span>
              <button
                aria-label="Close menu"
                onClick={() => setOpen(false)}
                className="inline-flex h-10 w-10 items-center justify-center rounded-full hover:bg-[var(--color-brand-100)]"
              >
                <X size={20} />
              </button>
            </div>
            <ul className="flex flex-col gap-1 p-4 flex-1">
              {navLinks.map((l) => (
                <li key={l.href}>
                  <Link
                    href={l.href}
                    onClick={() => setOpen(false)}
                    className="block rounded-lg px-3 py-3 text-base font-medium hover:bg-[var(--color-brand-100)]"
                  >
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
            <div className="flex flex-col gap-2 p-4 border-t border-[var(--color-border)]">
              <Button href="/login" variant="outline" fullWidth>
                Login
              </Button>
              <Button href="/signup" variant="primary" fullWidth>
                Sign Up
              </Button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
