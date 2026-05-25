"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  ClipboardList,
  MessageSquare,
  PhoneCall,
  Star,
  CreditCard,
  Building2,
  Settings,
  Menu,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { OwnerSignOutButton } from "./OwnerSignOutButton";

interface NavItem {
  href: string;
  label: string;
  Icon: React.ComponentType<{ size?: number; className?: string }>;
  pending?: boolean;
}

const NAV: NavItem[] = [
  { href: "/owner/dashboard", label: "Dashboard", Icon: LayoutDashboard },
  { href: "/owner/listings", label: "My Listings", Icon: ClipboardList },
  { href: "/owner/inquiries", label: "Inquiries", Icon: MessageSquare },
  { href: "/owner/calls", label: "Calls", Icon: PhoneCall },
  { href: "/owner/reviews", label: "Reviews", Icon: Star },
  { href: "/owner/payments", label: "Payments", Icon: CreditCard },
  { href: "/owner/profile", label: "Business Profile", Icon: Building2 },
  { href: "/owner/settings", label: "Settings", Icon: Settings },
];

interface OwnerSidebarProps {
  /** Optional business name shown at the top of the sidebar */
  businessName?: string;
}

export function OwnerSidebar({ businessName = "Your Business" }: OwnerSidebarProps) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = React.useState(false);

  // Close mobile drawer when route changes
  React.useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  function isActive(href: string) {
    if (!pathname) return false;
    if (href === "/owner/dashboard") return pathname === href;
    return pathname === href || pathname.startsWith(`${href}/`);
  }

  const NavList = (
    <nav aria-label="Owner navigation" className="flex flex-col gap-1">
      {NAV.map((item) => {
        const active = isActive(item.href);
        const Icon = item.Icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "group inline-flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
              active
                ? "bg-[var(--color-brand-100)] text-[var(--color-brand-900)]"
                : "text-[var(--color-ink-muted)] hover:bg-[var(--color-surface)] hover:text-[var(--color-ink)]",
            )}
          >
            <Icon
              size={18}
              className={cn(
                "shrink-0",
                active ? "text-[var(--color-brand-700)]" : "text-[var(--color-ink-subtle)]",
              )}
              aria-hidden="true"
            />
            <span className="flex-1">{item.label}</span>
            {item.pending && (
              <span className="rounded-full bg-amber-50 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-amber-700 border border-amber-200">
                Soon
              </span>
            )}
          </Link>
        );
      })}

      <div className="my-3 border-t border-[var(--color-border)]" />

      <OwnerSignOutButton />
    </nav>
  );

  return (
    <>
      {/* Mobile top bar with hamburger */}
      <div className="lg:hidden sticky top-16 z-20 bg-[var(--color-bg)] border-b border-[var(--color-border)]">
        <div className="flex items-center justify-between gap-3 px-4 py-3">
          <div className="min-w-0 flex-1">
            <p className="text-xs text-[var(--color-ink-subtle)] font-medium uppercase tracking-wide">
              Owner area
            </p>
            <p className="text-sm font-bold truncate">{businessName}</p>
          </div>
          <button
            type="button"
            onClick={() => setMobileOpen(true)}
            aria-label="Open owner menu"
            className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-[var(--color-border-strong)] bg-[var(--color-bg-elevated)] hover:bg-[var(--color-surface)] transition-colors"
          >
            <Menu size={18} aria-hidden="true" />
          </button>
        </div>
      </div>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setMobileOpen(false)}
            aria-hidden="true"
          />
          <aside
            className="absolute inset-y-0 left-0 w-72 max-w-[85%] bg-[var(--color-bg-elevated)] shadow-2xl p-4 flex flex-col"
            role="dialog"
            aria-label="Owner navigation"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="min-w-0">
                <p className="text-xs text-[var(--color-ink-subtle)] uppercase tracking-wide font-medium">
                  Owner
                </p>
                <p className="text-base font-bold truncate">{businessName}</p>
              </div>
              <button
                type="button"
                onClick={() => setMobileOpen(false)}
                aria-label="Close menu"
                className="inline-flex h-9 w-9 items-center justify-center rounded-full hover:bg-[var(--color-surface)]"
              >
                <X size={18} aria-hidden="true" />
              </button>
            </div>
            {NavList}
          </aside>
        </div>
      )}

      {/* Desktop sidebar */}
      <aside
        className="hidden lg:flex lg:flex-col w-60 shrink-0 sticky top-20 self-start max-h-[calc(100vh-6rem)] overflow-y-auto"
        aria-label="Owner navigation"
      >
        <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-elevated)] p-3 shadow-[var(--shadow-sm)]">
          <div className="px-3 pt-2 pb-3">
            <p className="text-xs uppercase tracking-wide font-medium text-[var(--color-ink-subtle)]">
              Owner area
            </p>
            <p className="text-sm font-bold truncate text-[var(--color-ink)]">
              {businessName}
            </p>
          </div>
          {NavList}
        </div>
      </aside>
    </>
  );
}

/**
 * Convenience wrapper: sidebar + main content area, used by owner pages.
 * Pass `businessName` if you have it; defaults to a placeholder.
 */
export function OwnerLayout({
  children,
  businessName,
}: {
  children: React.ReactNode;
  businessName?: string;
}) {
  return (
    <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
      <div className="flex flex-col lg:flex-row gap-6 lg:gap-8">
        <OwnerSidebar businessName={businessName} />
        <main className="flex-1 min-w-0">{children}</main>
      </div>
    </div>
  );
}
