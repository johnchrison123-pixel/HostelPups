import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Settings as SettingsIcon, Bell, Mail, ShieldCheck } from "lucide-react";
import { OwnerLayout } from "@/components/owner/OwnerSidebar";
import { buildMetadata } from "@/lib/seo";
import { getCurrentOwner } from "@/lib/owner-queries";

export const metadata: Metadata = buildMetadata({
  title: "Settings",
  description: "Account settings and notification preferences for HostelPups owners.",
  path: "/owner/settings",
  noindex: true,
});

export default async function OwnerSettingsPage() {
  const current = await getCurrentOwner();
  if (!current) {
    redirect("/owner/login?next=/owner/settings");
  }
  const businessName = current.owner?.business_name || "Your business";

  return (
    <OwnerLayout businessName={businessName}>
      <header className="mb-4">
        <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
          Settings
        </h1>
        <p className="mt-1 text-sm text-[var(--color-ink-muted)]">
          Account settings + notification preferences.
        </p>
      </header>

      <section
        aria-labelledby="settings-coming-heading"
        className="rounded-2xl border-2 border-[var(--color-brand-300)] bg-[var(--color-brand-50)] p-5 sm:p-6"
      >
        <div className="flex items-start gap-4">
          <span
            className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[var(--color-brand-500)] text-[var(--color-ink)]"
            aria-hidden="true"
          >
            <SettingsIcon size={22} />
          </span>
          <div className="flex-1">
            <h2
              id="settings-coming-heading"
              className="font-bold text-base sm:text-lg"
            >
              Notification preferences coming soon
            </h2>
            <p className="mt-1 text-sm text-[var(--color-ink-muted)]">
              Pick which notifications you receive — new-inquiry email, daily
              digest, call missed, listing expiring, KYC status updates — and
              over which channel (email · SMS · WhatsApp). Until then we send
              every owner the default set.
            </p>

            <ul
              className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm"
              role="list"
            >
              <li className="flex items-center gap-2">
                <Bell
                  size={14}
                  className="text-emerald-600 shrink-0"
                  aria-hidden="true"
                />
                <span>Per-event toggles</span>
              </li>
              <li className="flex items-center gap-2">
                <Mail
                  size={14}
                  className="text-emerald-600 shrink-0"
                  aria-hidden="true"
                />
                <span>Email · SMS · WhatsApp</span>
              </li>
              <li className="flex items-center gap-2">
                <ShieldCheck
                  size={14}
                  className="text-emerald-600 shrink-0"
                  aria-hidden="true"
                />
                <span>Quiet hours</span>
              </li>
            </ul>
          </div>
        </div>
      </section>

      <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-elevated)] p-5">
          <h3 className="font-bold">Account</h3>
          <p className="mt-1 text-sm text-[var(--color-ink-muted)]">
            Your business profile (name, contact phone, KYC) lives on the{" "}
            <a
              href="/owner/profile"
              className="font-semibold text-[var(--color-brand-700)] hover:underline"
            >
              Business Profile
            </a>{" "}
            page.
          </p>
        </div>
        <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-elevated)] p-5">
          <h3 className="font-bold">Sign out</h3>
          <p className="mt-1 text-sm text-[var(--color-ink-muted)]">
            Use the Sign out button at the bottom of the sidebar to clear your
            session on this device.
          </p>
        </div>
      </div>
    </OwnerLayout>
  );
}
