import type { Metadata } from "next";
import { redirect } from "next/navigation";
import {
  FileText,
  ShieldCheck,
  Lock,
} from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { OwnerLayout } from "@/components/owner/OwnerSidebar";
import { OwnerProfileForm } from "@/components/owner/OwnerProfileForm";
import { buildMetadata } from "@/lib/seo";
import { getCurrentOwner } from "@/lib/owner-queries";

export const metadata: Metadata = buildMetadata({
  title: "Business Profile",
  description:
    "Manage your HostelPups business profile, logo, KYC documents, and contact details.",
  path: "/owner/profile",
  noindex: true,
});

const KYC_LABEL: Record<string, { label: string; tone: "verified" | "warning" | "default" | "danger" }> = {
  not_submitted: { label: "Not submitted", tone: "default" },
  pending: { label: "Pending review", tone: "warning" },
  verified: { label: "Verified", tone: "verified" },
  rejected: { label: "Rejected — re-submit", tone: "danger" },
};

export default async function OwnerProfilePage() {
  const current = await getCurrentOwner();
  if (!current) {
    redirect("/owner/login?next=/owner/profile");
  }
  if (!current.owner) {
    redirect("/owner/onboarding");
  }

  const owner = current.owner;
  const kyc = KYC_LABEL[owner.kyc_status] ?? KYC_LABEL.not_submitted;

  return (
    <OwnerLayout businessName={owner.business_name}>
      <header className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
          Business profile
        </h1>
        <p className="mt-1 text-sm text-[var(--color-ink-muted)]">
          What renters see when they tap on your business name. Keep it
          accurate — verified data wins more inquiries.
        </p>
      </header>

      {/* KYC status */}
      <section
        aria-labelledby="kyc-heading"
        className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-elevated)] p-5 mb-6 shadow-[var(--shadow-sm)]"
      >
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div>
            <h2
              id="kyc-heading"
              className="text-base font-bold flex items-center gap-2"
            >
              <ShieldCheck
                size={18}
                className="text-emerald-600"
                aria-hidden="true"
              />
              KYC status
            </h2>
            <p className="text-sm text-[var(--color-ink-muted)] mt-0.5">
              Verified businesses convert ~3x better. Renters trust the badge.
            </p>
          </div>
          <Badge tone={kyc.tone}>{kyc.label}</Badge>
        </div>
      </section>

      {/* Profile form */}
      <OwnerProfileForm
        initialBusinessName={owner.business_name}
        initialContactPhone={owner.contact_phone ?? ""}
        tier={owner.tier}
      />

      {/* KYC docs section */}
      <section
        aria-labelledby="docs-heading"
        className="mt-6 rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-elevated)] p-5 sm:p-6 shadow-[var(--shadow-sm)]"
      >
        <h2
          id="docs-heading"
          className="text-base font-bold mb-2 flex items-center gap-2"
        >
          <FileText
            size={18}
            className="text-[var(--color-brand-700)]"
            aria-hidden="true"
          />
          KYC documents
        </h2>
        <p className="text-sm text-[var(--color-ink-muted)] mb-4">
          We need a government-issued ID (Aadhaar, PAN, driving licence) and a
          recent utility bill or shop license. Docs are stored encrypted and only
          seen by our verification specialist.
        </p>

        <div className="rounded-2xl border-2 border-dashed border-[var(--color-border-strong)] bg-[var(--color-surface)] p-8 text-center">
          <FileText
            size={36}
            className="mx-auto text-[var(--color-brand-600)]"
            aria-hidden="true"
          />
          <p className="mt-3 text-sm font-semibold">KYC upload coming soon</p>
          <p className="mt-1 text-xs text-[var(--color-ink-muted)]">
            For now, our verification specialist will contact you to collect
            documents directly. PDF/JPG, max 5 MB each — accepted via secure
            email or in-person on the full-service tier.
          </p>
          <p className="mt-3 inline-flex items-center gap-1.5 text-xs text-[var(--color-ink-subtle)]">
            <Lock size={11} aria-hidden="true" /> Stored in a private
            <code className="font-mono">kyc-documents</code> bucket — only
            HostelPups can read it.
          </p>
        </div>
      </section>
    </OwnerLayout>
  );
}
