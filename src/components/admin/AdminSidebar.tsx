"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  Building2,
  ClipboardList,
  MessageSquare,
  PhoneCall,
  CreditCard,
  Flag,
  ScrollText,
  ArrowLeft,
  Menu,
  X,
  ShieldCheck,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { AdminSignOutButton } from "./AdminSignOutButton";

interface NavItem {
  href: string;
  label: string;
  Icon: React.ComponentType<{ size?: number; className?: string }>;
  badgeKey?: keyof AdminBadges;
}

export interface AdminBadges {
  pendingKyc?: number;
  openReports?: number;
  openInquiries?: number;
}

const NAV: NavItem[] = [
  { href: "/admin", label: "Dashboard", Icon: LayoutDashboard },
  { href: "/admin/users", label: "Users", Icon: Users },
  { href: "/admin/owners", label: "Owners", Icon: Building2, badgeKey: "pendingKyc" },
  { href: "/admin/listings", label: "Listings", Icon: ClipboardList },
  { href: "/admin/inquiries", label: "Inquiries", Icon: MessageSquare, badgeKey: "openInquiries" },
  { href: "/admin/calls", label: "Calls", Icon: PhoneCall },
  { href: "/admin/payments", label: "Payments", Icon: CreditCard },
  { href: "/admin/reports", label: "Reports", Icon: Flag, badgeKey: "openReports" },
  { href: "/admin/audit", label: "Audit log", Icon: ScrollText },
];

interface AdminSidebarProps {
  adminName?: string;
  badges?: AdminBadges;
}

export function AdminSidebar({
  adminName = "Admin",
  badges = {},
}: AdminSidebarProps) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = React.useState(false);

  React.useEffect(() => {
    // Close mobile drawer on route change — intentional setState sync to URL.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMobileOpen(false);
  }, [pathname]);

  function isActive(href: string) {
    if (!pathname) return false;
    if (href === "/admin") return pathname === href;
    return pathname === href || pathname.startsWith(`${href}/`);
  }

  const NavList = (
    <nav aria-label="Admin navigation" className="flex flex-col gap-1">
      <Link
        href="/"
        className="inline-flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-medium text-[var(--color-ink-muted)] hover:bg-[var(--color-surface)] hover:text-[var(--color-ink)] transition-colors"
      >
        <ArrowLeft size={14} aria-hidden="true" />
        Back to public site
      </Link>

      <div className="my-2 border-t border-[var(--color-border)]" />

      {NAV.map((item) => {
        const active = isActive(item.href);
        const Icon = item.Icon;
        const badgeCount = item.badgeKey ? badges[item.badgeKey] ?? 0 : 0;
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
                active
                  ? "text-[var(--color-brand-700)]"
                  : "text-[var(--color-ink-subtle)]",
              )}
              aria-hidden="true"
            />
            <span className="flex-1">{item.label}</span>
            {badgeCount > 0 && (
              <span
                aria-label={`${badgeCount} pending`}
                className="rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-amber-700 border border-amber-200"
              >
                {badgeCount > 99 ? "99+" : badgeCount}
              </span>
            )}
          </Link>
        );
      })}

      <div className="my-3 border-t border-[var(--color-border)]" />

      <AdminSignOutButton />
    </nav>
  );

  return (
    <>
      {/* Mobile top bar */}
      <div className="lg:hidden sticky top-16 z-20 bg-[var(--color-bg)] border-b border-[var(--color-border)]">
        <div className="flex items-center justify-between gap-3 px-4 py-3">
          <div className="min-w-0 flex-1 flex items-center gap-2">
            <ShieldCheck
              size={16}
              className="text-emerald-600 shrink-0"
              aria-hidden="true"
            />
            <div className="min-w-0">
              <p className="text-xs text-[var(--color-ink-subtle)] font-medium uppercase tracking-wide">
                Admin
              </p>
              <p className="text-sm font-bold truncate">{adminName}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setMobileOpen(true)}
            aria-label="Open admin menu"
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
            aria-label="Admin navigation"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="min-w-0 flex items-center gap-2">
                <ShieldCheck
                  size={18}
                  className="text-emerald-600 shrink-0"
                  aria-hidden="true"
                />
                <div className="min-w-0">
                  <p className="text-xs text-[var(--color-ink-subtle)] uppercase tracking-wide font-medium">
                    Admin
                  </p>
                  <p className="text-base font-bold truncate">{adminName}</p>
                </div>
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
        aria-label="Admin navigation"
      >
        <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-elevated)] p-3 shadow-[var(--shadow-sm)]">
          <div className="px-3 pt-2 pb-3 flex items-start gap-2">
            <ShieldCheck
              size={16}
              className="text-emerald-600 mt-0.5 shrink-0"
              aria-hidden="true"
            />
            <div className="min-w-0">
              <p className="text-xs uppercase tracking-wide font-medium text-[var(--color-ink-subtle)]">
                Admin area
              </p>
              <p className="text-sm font-bold truncate text-[var(--color-ink)]">
                {adminName}
              </p>
            </div>
          </div>
          {NavList}
        </div>
      </aside>
    </>
  );
}

export function AdminLayout({
  children,
  adminName,
  badges,
}: {
  children: React.ReactNode;
  adminName?: string;
  badges?: AdminBadges;
}) {
  return (
    <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
      <div className="flex flex-col lg:flex-row gap-6 lg:gap-8">
        <AdminSidebar adminName={adminName} badges={badges} />
        <main className="flex-1 min-w-0">{children}</main>
      </div>
    </div>
  );
}
