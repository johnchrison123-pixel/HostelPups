"use client";

import * as React from "react";
import { Building2, Phone, Save, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { updateOwnerProfile } from "@/lib/owner-actions";
import type { OwnerTier } from "@/lib/types";

interface OwnerProfileFormProps {
  initialBusinessName: string;
  initialContactPhone: string;
  tier: OwnerTier;
}

/**
 * Owner business profile editor.
 *
 * Phase 1B: business_name + contact_phone are the only editable fields here.
 * Logo upload + KYC document upload are tracked under PENDING — they need a
 * private storage bucket flow that we'll add in Phase 2.
 */
export function OwnerProfileForm({
  initialBusinessName,
  initialContactPhone,
  tier,
}: OwnerProfileFormProps) {
  const [businessName, setBusinessName] = React.useState(initialBusinessName);
  // contact_phone is the admin-only number (NOT the renter-facing number — there
  // isn't one; all chat goes through the platform).
  const [contactPhone, setContactPhone] = React.useState(initialContactPhone);
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [savedAt, setSavedAt] = React.useState<number | null>(null);

  const dirty =
    businessName.trim() !== initialBusinessName ||
    contactPhone.trim() !== initialContactPhone;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (businessName.trim().length < 2) {
      setError("Business name needs to be at least 2 characters.");
      return;
    }
    if (
      contactPhone.trim().length > 0 &&
      !/^[6-9]\d{9}$/.test(contactPhone.trim())
    ) {
      setError(
        "Contact phone should be a 10-digit Indian mobile number starting with 6-9.",
      );
      return;
    }

    setSaving(true);
    try {
      await updateOwnerProfile({
        business_name: businessName.trim(),
        contact_phone: contactPhone.trim(),
      });
      setSavedAt(Date.now());
    } catch (err) {
      setError((err as Error).message ?? "Could not save changes.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6" noValidate>
      <section
        aria-labelledby="basic-heading"
        className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-elevated)] p-5 sm:p-6 shadow-[var(--shadow-sm)]"
      >
        <div className="flex items-center justify-between gap-3 flex-wrap mb-4">
          <h2
            id="basic-heading"
            className="text-base font-bold flex items-center gap-2"
          >
            <Building2
              size={18}
              className="text-[var(--color-brand-700)]"
              aria-hidden="true"
            />
            Basic info
          </h2>
          <Badge tone={tier === "full_service" ? "verified" : "brand"}>
            {tier === "full_service" ? "Full-service tier" : "Self-serve tier"}
          </Badge>
        </div>

        <div className="space-y-4">
          <div>
            <label
              htmlFor="op-name"
              className="block text-sm font-semibold mb-1.5"
            >
              Business name
            </label>
            <input
              id="op-name"
              type="text"
              value={businessName}
              onChange={(e) => setBusinessName(e.target.value)}
              placeholder="Sunshine PG / Lakshmi Hostel"
              className="w-full rounded-xl border border-[var(--color-border-strong)] bg-[var(--color-bg)] px-4 h-12 text-base outline-none focus:border-[var(--color-brand-500)] focus:ring-2 focus:ring-[var(--color-brand-100)]"
            />
          </div>
        </div>
      </section>

      <section
        aria-labelledby="contact-heading"
        className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-elevated)] p-5 sm:p-6 shadow-[var(--shadow-sm)]"
      >
        <h2
          id="contact-heading"
          className="text-base font-bold mb-2 flex items-center gap-2"
        >
          <Phone
            size={18}
            className="text-[var(--color-brand-700)]"
            aria-hidden="true"
          />
          Contact phone (admin-only)
        </h2>
        <div className="rounded-lg bg-[var(--color-surface)] border border-[var(--color-border)] p-3 mb-4 text-xs text-[var(--color-ink-muted)]">
          This number is used by HostelPups admin only — for KYC calls and
          account recovery. Renters never see it. All renter calls go through
          our in-app voice (Phase 2).
        </div>

        <div>
          <label
            htmlFor="op-phone"
            className="block text-sm font-semibold mb-1.5"
          >
            Admin contact phone
          </label>
          <div className="flex items-center gap-2 rounded-xl border border-[var(--color-border-strong)] bg-[var(--color-bg)] px-4 h-12 focus-within:border-[var(--color-brand-500)] focus-within:ring-2 focus-within:ring-[var(--color-brand-100)]">
            <span className="text-sm text-[var(--color-ink-muted)] font-medium">
              +91
            </span>
            <input
              id="op-phone"
              type="tel"
              inputMode="numeric"
              pattern="[6-9][0-9]{9}"
              maxLength={10}
              placeholder="9876543210"
              value={contactPhone}
              onChange={(e) =>
                setContactPhone(e.target.value.replace(/\D/g, "").slice(0, 10))
              }
              className="flex-1 bg-transparent outline-none text-base"
            />
          </div>
        </div>
      </section>

      {error && (
        <div
          role="alert"
          className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 flex items-start gap-2"
        >
          <AlertCircle size={16} className="mt-0.5 shrink-0" aria-hidden="true" />
          <span>{error}</span>
        </div>
      )}

      {savedAt && !dirty && !error && (
        <div
          role="status"
          className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800 flex items-center gap-2"
        >
          <CheckCircle2 size={16} aria-hidden="true" /> Profile saved.
        </div>
      )}

      <div className="flex items-center gap-2 flex-wrap">
        <Button
          variant="cta"
          size="md"
          type="submit"
          disabled={saving || !dirty}
        >
          {saving ? (
            <>
              <Loader2 size={16} className="animate-spin" aria-hidden="true" />
              Saving…
            </>
          ) : (
            <>
              <Save size={16} aria-hidden="true" />
              Save changes
            </>
          )}
        </Button>
      </div>
    </form>
  );
}
