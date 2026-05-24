"use client";

import * as React from "react";
import Link from "next/link";
import { Menu, X, Search, LogOut, LayoutDashboard, User as UserIcon } from "lucide-react";
import type { User } from "@supabase/supabase-js";
import { Container } from "@/components/ui/Container";
import { Button } from "@/components/ui/Button";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

const navLinks = [
  { href: "/search", label: "Find PG" },
  { href: "/couple-friendly-pg/kochi", label: "Couple-Friendly" },
  { href: "/pet-friendly-pg/kochi", label: "Pet-Friendly" },
  { href: "/for-owners", label: "List Your Property" },
];

/**
 * Pulls a readable display name from a Supabase user.
 * Prefers user_metadata.name, then user_metadata.business_name, then the
 * email local-part, then the user id.
 */
function getDisplayName(user: User): string {
  const meta = (user.user_metadata ?? {}) as Record<string, unknown>;
  if (typeof meta.name === "string" && meta.name.trim()) return meta.name.trim();
  if (typeof meta.business_name === "string" && meta.business_name.trim())
    return meta.business_name.trim();
  if (user.email) return user.email.split("@")[0];
  return "Account";
}

function isOwnerIntent(user: User): boolean {
  const meta = (user.user_metadata ?? {}) as Record<string, unknown>;
  return meta.intent === "owner" || typeof meta.business_name === "string";
}

export function Header() {
  const [open, setOpen] = React.useState(false);
  const [scrolled, setScrolled] = React.useState(false);
  const [user, setUser] = React.useState<User | null>(null);
  const [authReady, setAuthReady] = React.useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = React.useState(false);
  const profileMenuRef = React.useRef<HTMLDivElement | null>(null);

  React.useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Subscribe to auth state changes.
  React.useEffect(() => {
    const supabase = createClient();
    let cancelled = false;
    supabase.auth.getUser().then(({ data }) => {
      if (cancelled) return;
      setUser(data.user);
      setAuthReady(true);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });
    return () => {
      cancelled = true;
      sub.subscription.unsubscribe();
    };
  }, []);

  // Close profile dropdown on outside click.
  React.useEffect(() => {
    if (!profileMenuOpen) return;
    function onDown(e: MouseEvent) {
      if (!profileMenuRef.current) return;
      if (!profileMenuRef.current.contains(e.target as Node)) {
        setProfileMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [profileMenuOpen]);

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    // Hard redirect so any server-rendered state (incl. middleware-refreshed
    // cookies) is rebuilt cleanly.
    window.location.href = "/";
  }

  const displayName = user ? getDisplayName(user) : "";
  const dashboardHref =
    user && isOwnerIntent(user) ? "/owner/dashboard" : "/search";

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
              {!authReady ? (
                // Reserve space while auth state resolves to avoid layout shift
                <div className="h-9 w-40" aria-hidden="true" />
              ) : user ? (
                <div className="relative" ref={profileMenuRef}>
                  <button
                    type="button"
                    onClick={() => setProfileMenuOpen((v) => !v)}
                    aria-haspopup="menu"
                    aria-expanded={profileMenuOpen}
                    className="inline-flex items-center gap-2 rounded-full border border-[var(--color-border-strong)] bg-white px-3 h-9 text-sm font-semibold hover:border-[var(--color-brand-500)] transition-colors"
                  >
                    <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-[var(--color-brand-500)] text-[var(--color-ink)] text-[11px] font-black">
                      {displayName.charAt(0).toUpperCase() || "U"}
                    </span>
                    <span className="max-w-[140px] truncate">{displayName}</span>
                  </button>
                  {profileMenuOpen && (
                    <div
                      role="menu"
                      className="absolute right-0 mt-2 w-56 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-elevated)] shadow-[var(--shadow-md)] overflow-hidden"
                    >
                      <div className="px-3 py-2 border-b border-[var(--color-border)]">
                        <p className="text-xs text-[var(--color-ink-subtle)] uppercase tracking-wider font-semibold">
                          Signed in as
                        </p>
                        <p className="text-sm font-medium truncate">{user.email}</p>
                      </div>
                      <Link
                        href={dashboardHref}
                        onClick={() => setProfileMenuOpen(false)}
                        role="menuitem"
                        className="flex items-center gap-2 px-3 py-2.5 text-sm font-medium hover:bg-[var(--color-brand-100)]"
                      >
                        <LayoutDashboard size={14} aria-hidden="true" />
                        {isOwnerIntent(user) ? "Owner dashboard" : "Search PGs"}
                      </Link>
                      <button
                        type="button"
                        role="menuitem"
                        onClick={handleLogout}
                        className="w-full flex items-center gap-2 px-3 py-2.5 text-sm font-medium text-left hover:bg-[var(--color-brand-100)] border-t border-[var(--color-border)]"
                      >
                        <LogOut size={14} aria-hidden="true" />
                        Logout
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <>
                  <Button href="/login" variant="ghost" size="sm">
                    Login
                  </Button>
                  <Button href="/signup" variant="primary" size="sm">
                    Sign Up
                  </Button>
                </>
              )}
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
              {!authReady ? null : user ? (
                <>
                  <div className="flex items-center gap-2 px-1 pb-1">
                    <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-[var(--color-brand-500)] text-[var(--color-ink)] font-black">
                      {displayName.charAt(0).toUpperCase() || "U"}
                    </span>
                    <div className="min-w-0">
                      <p className="text-sm font-bold truncate">{displayName}</p>
                      <p className="text-xs text-[var(--color-ink-muted)] truncate">
                        {user.email}
                      </p>
                    </div>
                  </div>
                  <Button
                    href={dashboardHref}
                    variant="primary"
                    fullWidth
                    onClick={() => setOpen(false)}
                  >
                    <LayoutDashboard size={16} aria-hidden="true" />
                    {isOwnerIntent(user) ? "Owner dashboard" : "Search PGs"}
                  </Button>
                  <Button
                    onClick={async () => {
                      setOpen(false);
                      await handleLogout();
                    }}
                    variant="outline"
                    fullWidth
                  >
                    <LogOut size={16} aria-hidden="true" />
                    Logout
                  </Button>
                </>
              ) : (
                <>
                  <Button href="/login" variant="outline" fullWidth>
                    <UserIcon size={16} aria-hidden="true" />
                    Login
                  </Button>
                  <Button href="/signup" variant="primary" fullWidth>
                    Sign Up
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
