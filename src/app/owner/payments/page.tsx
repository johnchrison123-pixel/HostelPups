import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { CreditCard, ReceiptText, Banknote } from "lucide-react";
import { OwnerLayout } from "@/components/owner/OwnerSidebar";
import { buildMetadata } from "@/lib/seo";
import { getCurrentOwner } from "@/lib/owner-queries";

export const metadata: Metadata = buildMetadata({
  title: "Payments",
  description:
    "Subscription, boost, and renewal payment history for your HostelPups owner account.",
  path: "/owner/payments",
  noindex: true,
});

export default async function OwnerPaymentsPage() {
  const current = await getCurrentOwner();
  if (!current) {
    redirect("/owner/login?next=/owner/payments");
  }
  const businessName = current.owner?.business_name || "Your business";

  return (
    <OwnerLayout businessName={businessName}>
      <header className="mb-4">
        <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
          Payments
        </h1>
        <p className="mt-1 text-sm text-[var(--color-ink-muted)]">
          Subscription, boost, and renewal payment history.
        </p>
      </header>

      <section
        aria-labelledby="payments-coming-heading"
        className="rounded-2xl border-2 border-[var(--color-brand-300)] bg-[var(--color-brand-50)] p-5 sm:p-6"
      >
        <div className="flex items-start gap-4">
          <span
            className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[var(--color-brand-500)] text-[var(--color-ink)]"
            aria-hidden="true"
          >
            <CreditCard size={22} />
          </span>
          <div className="flex-1">
            <h2
              id="payments-coming-heading"
              className="font-bold text-base sm:text-lg"
            >
              Payment history is coming with Razorpay integration
            </h2>
            <p className="mt-1 text-sm text-[var(--color-ink-muted)]">
              Once Razorpay billing is wired up in Phase 2, every charge —
              annual listing fee, verification badge, boost campaigns — will
              show up here with downloadable invoices for GST. Until then,
              your subscription is on the house (founding-owner promo).
            </p>

            <ul
              className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm"
              role="list"
            >
              <li className="flex items-center gap-2">
                <ReceiptText
                  size={14}
                  className="text-emerald-600 shrink-0"
                  aria-hidden="true"
                />
                <span>Downloadable invoices</span>
              </li>
              <li className="flex items-center gap-2">
                <Banknote
                  size={14}
                  className="text-emerald-600 shrink-0"
                  aria-hidden="true"
                />
                <span>UPI · cards · netbanking</span>
              </li>
              <li className="flex items-center gap-2">
                <CreditCard
                  size={14}
                  className="text-emerald-600 shrink-0"
                  aria-hidden="true"
                />
                <span>Auto-renew on / off</span>
              </li>
            </ul>
          </div>
        </div>
      </section>

      <div className="mt-6 rounded-2xl border border-dashed border-[var(--color-border)] bg-[var(--color-bg-elevated)] p-8 text-center">
        <p className="text-sm text-[var(--color-ink-muted)]">
          No payment activity yet. Founding owners are not being charged in
          this phase.
        </p>
      </div>
    </OwnerLayout>
  );
}
