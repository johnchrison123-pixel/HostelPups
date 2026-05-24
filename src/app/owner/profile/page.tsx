import type { Metadata } from "next";
import {
  Building2,
  Phone,
  ImagePlus,
  FileText,
  ShieldCheck,
  Lock,
  Save,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { OwnerLayout } from "@/components/owner/OwnerSidebar";
import { buildMetadata } from "@/lib/seo";

export const metadata: Metadata = buildMetadata({
  title: "Business Profile",
  description: "Manage your HostelPups business profile, logo, KYC documents, and contact details.",
  path: "/owner/profile",
  noindex: true,
});

export default function OwnerProfilePage() {
  return (
    <OwnerLayout>
      <header className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
          Business profile
        </h1>
        <p className="mt-1 text-sm text-[var(--color-ink-muted)]">
          What renters see when they tap on your business name. Keep it accurate — verified data wins more inquiries.
        </p>
      </header>

      {/* KYC status */}
      <section
        aria-labelledby="kyc-heading"
        className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-elevated)] p-5 mb-6 shadow-[var(--shadow-sm)]"
      >
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div>
            <h2 id="kyc-heading" className="text-base font-bold flex items-center gap-2">
              <ShieldCheck size={18} className="text-emerald-600" aria-hidden="true" />
              KYC status
            </h2>
            <p className="text-sm text-[var(--color-ink-muted)] mt-0.5">
              Verified businesses convert ~3x better. Renters trust the badge.
            </p>
          </div>
          <Badge tone="warning">Pending review</Badge>
        </div>
        <p className="mt-3 text-[11px] uppercase tracking-wider font-bold text-amber-700">
          Pending Phase 1B — KYC submission API
        </p>
      </section>

      {/* Profile form */}
      <form
        // PENDING: Phase 1B — wire to update public.owners set business_name, ... where id = auth.uid()
        className="space-y-6"
      >
        <section
          aria-labelledby="basic-heading"
          className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-elevated)] p-5 sm:p-6 shadow-[var(--shadow-sm)]"
        >
          <h2 id="basic-heading" className="text-base font-bold mb-4 flex items-center gap-2">
            <Building2 size={18} className="text-[var(--color-brand-700)]" aria-hidden="true" />
            Basic info
          </h2>

          <div className="space-y-4">
            <div>
              <label htmlFor="op-name" className="block text-sm font-semibold mb-1.5">
                Business name
              </label>
              <input
                id="op-name"
                type="text"
                defaultValue="Your Business"
                placeholder="Sunshine PG / Lakshmi Hostel"
                className="w-full rounded-xl border border-[var(--color-border-strong)] bg-[var(--color-bg)] px-4 h-12 text-base outline-none focus:border-[var(--color-brand-500)] focus:ring-2 focus:ring-[var(--color-brand-100)]"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold mb-1.5">Logo</label>
              <div className="flex items-center gap-4">
                <div className="h-16 w-16 rounded-2xl bg-[var(--color-brand-100)] inline-flex items-center justify-center text-[var(--color-brand-700)] shrink-0">
                  <ImagePlus size={24} aria-hidden="true" />
                </div>
                <div className="flex-1">
                  <Button variant="outline" size="sm">
                    Upload logo
                  </Button>
                  <p className="mt-1.5 text-xs text-[var(--color-ink-subtle)]">
                    Square PNG/JPG, min 256x256. PENDING Phase 1B upload wiring.
                  </p>
                </div>
              </div>
            </div>

            <div>
              <label htmlFor="op-bio" className="block text-sm font-semibold mb-1.5">
                Short bio / about
              </label>
              <textarea
                id="op-bio"
                rows={4}
                placeholder="Tell renters about your business — when you started, what makes your places special, your hospitality style."
                className="w-full rounded-xl border border-[var(--color-border-strong)] bg-[var(--color-bg)] px-4 py-3 text-base outline-none focus:border-[var(--color-brand-500)] focus:ring-2 focus:ring-[var(--color-brand-100)] resize-y"
              />
            </div>
          </div>
        </section>

        {/* Contact phone */}
        <section
          aria-labelledby="contact-heading"
          className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-elevated)] p-5 sm:p-6 shadow-[var(--shadow-sm)]"
        >
          <h2 id="contact-heading" className="text-base font-bold mb-2 flex items-center gap-2">
            <Phone size={18} className="text-[var(--color-brand-700)]" aria-hidden="true" />
            Contact phone (admin-only)
          </h2>
          <div className="rounded-lg bg-[var(--color-surface)] border border-[var(--color-border)] p-3 mb-4 flex items-start gap-2">
            <Lock size={14} className="text-[var(--color-brand-700)] mt-0.5 shrink-0" aria-hidden="true" />
            <p className="text-xs text-[var(--color-ink-muted)]">
              This number is used by HostelPups admin only — for KYC calls and account
              recovery. Renters never see it. All renter calls go through our in-app voice (Phase 2).
            </p>
          </div>

          <div>
            <label htmlFor="op-phone" className="block text-sm font-semibold mb-1.5">
              Admin contact phone
            </label>
            <div className="flex items-center gap-2 rounded-xl border border-[var(--color-border-strong)] bg-[var(--color-bg)] px-4 h-12 focus-within:border-[var(--color-brand-500)] focus-within:ring-2 focus-within:ring-[var(--color-brand-100)]">
              <span className="text-sm text-[var(--color-ink-muted)] font-medium">+91</span>
              <input
                id="op-phone"
                type="tel"
                inputMode="numeric"
                pattern="[6-9][0-9]{9}"
                maxLength={10}
                placeholder="9876543210"
                className="flex-1 bg-transparent outline-none text-base"
              />
            </div>
          </div>
        </section>

        {/* KYC docs */}
        <section
          aria-labelledby="docs-heading"
          className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-elevated)] p-5 sm:p-6 shadow-[var(--shadow-sm)]"
        >
          <h2 id="docs-heading" className="text-base font-bold mb-2 flex items-center gap-2">
            <FileText size={18} className="text-[var(--color-brand-700)]" aria-hidden="true" />
            KYC documents
          </h2>
          <p className="text-sm text-[var(--color-ink-muted)] mb-4">
            We need a government-issued ID (Aadhaar, PAN, driving licence) and a recent
            utility bill or shop license. Docs are stored encrypted and only seen by our
            verification specialist.
          </p>

          <div className="rounded-2xl border-2 border-dashed border-[var(--color-border-strong)] bg-[var(--color-surface)] p-8 text-center">
            <FileText
              size={36}
              className="mx-auto text-[var(--color-brand-600)]"
              aria-hidden="true"
            />
            <p className="mt-3 text-sm font-semibold">Drop your KYC files here</p>
            <p className="mt-1 text-xs text-[var(--color-ink-muted)]">
              PDF or JPG, max 5 MB each.
            </p>
            <p className="mt-2 text-[10px] uppercase tracking-wider font-bold text-amber-700">
              PENDING — uploads land in Supabase Storage `kyc-documents` (private)
            </p>
          </div>
        </section>

        {/* Save */}
        <div className="flex items-center gap-2 flex-wrap">
          <Button variant="cta" size="md" type="submit">
            <Save size={16} aria-hidden="true" />
            Save changes
          </Button>
          <p className="text-xs text-[var(--color-ink-subtle)]">
            PENDING Phase 1B — Supabase update wiring
          </p>
        </div>
      </form>
    </OwnerLayout>
  );
}
