import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Star, MessageCircle, ShieldCheck } from "lucide-react";
import { OwnerLayout } from "@/components/owner/OwnerSidebar";
import { buildMetadata } from "@/lib/seo";
import { getCurrentOwner } from "@/lib/owner-queries";

export const metadata: Metadata = buildMetadata({
  title: "Reviews",
  description:
    "Renter reviews of your HostelPups listings — coming soon.",
  path: "/owner/reviews",
  noindex: true,
});

export default async function OwnerReviewsPage() {
  const current = await getCurrentOwner();
  if (!current) {
    redirect("/owner/login?next=/owner/reviews");
  }
  const businessName = current.owner?.business_name || "Your business";

  return (
    <OwnerLayout businessName={businessName}>
      <header className="mb-4">
        <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
          Reviews
        </h1>
        <p className="mt-1 text-sm text-[var(--color-ink-muted)]">
          See what renters say about your listings, and reply publicly.
        </p>
      </header>

      <section
        aria-labelledby="reviews-coming-heading"
        className="rounded-2xl border-2 border-[var(--color-brand-300)] bg-[var(--color-brand-50)] p-5 sm:p-6"
      >
        <div className="flex items-start gap-4">
          <span
            className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[var(--color-brand-500)] text-[var(--color-ink)]"
            aria-hidden="true"
          >
            <Star size={22} />
          </span>
          <div className="flex-1">
            <h2
              id="reviews-coming-heading"
              className="font-bold text-base sm:text-lg"
            >
              Reviews are coming soon
            </h2>
            <p className="mt-1 text-sm text-[var(--color-ink-muted)]">
              When we ship reviews, you&apos;ll see every star rating + written
              review left by past renters here. You&apos;ll be able to reply
              publicly to each one — a verified-owner response builds trust
              and helps your listing rank higher in search.
            </p>

            <ul
              className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm"
              role="list"
            >
              <li className="flex items-center gap-2">
                <Star
                  size={14}
                  className="text-emerald-600 shrink-0"
                  aria-hidden="true"
                />
                <span>Verified renters only</span>
              </li>
              <li className="flex items-center gap-2">
                <MessageCircle
                  size={14}
                  className="text-emerald-600 shrink-0"
                  aria-hidden="true"
                />
                <span>Public owner replies</span>
              </li>
              <li className="flex items-center gap-2">
                <ShieldCheck
                  size={14}
                  className="text-emerald-600 shrink-0"
                  aria-hidden="true"
                />
                <span>Spam + fake review filters</span>
              </li>
            </ul>
          </div>
        </div>
      </section>

      <div className="mt-6 rounded-2xl border border-dashed border-[var(--color-border)] bg-[var(--color-bg-elevated)] p-8 text-center">
        <p className="text-sm text-[var(--color-ink-muted)]">
          No reviews yet. We&apos;ll send you an email the moment this feature
          ships.
        </p>
      </div>
    </OwnerLayout>
  );
}
