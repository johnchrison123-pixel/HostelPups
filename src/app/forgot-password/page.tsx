import type { Metadata } from "next";
import Link from "next/link";
import { Mail, ArrowLeft } from "lucide-react";
import { Container } from "@/components/ui/Container";
import { Button } from "@/components/ui/Button";
import { buildMetadata } from "@/lib/seo";
import { SITE } from "@/lib/site";

export const metadata: Metadata = buildMetadata({
  title: "Forgot password",
  description: "Reset your HostelPups account password.",
  path: "/forgot-password",
  noindex: true,
});

/**
 * Stub forgot-password page.
 *
 * PENDING: wire `supabase.auth.resetPasswordForEmail()` once we have a
 * working email-delivery provider configured in Supabase. For now we
 * route users to support@hostelpups.in for manual reset.
 */
export default function ForgotPasswordPage() {
  return (
    <Container size="sm" className="py-12 sm:py-20">
      <div className="mx-auto max-w-md text-center">
        <div className="mx-auto inline-flex h-16 w-16 items-center justify-center rounded-full bg-[var(--color-brand-100)]">
          <Mail size={32} className="text-[var(--color-brand-700)]" aria-hidden="true" />
        </div>

        <h1 className="mt-6 text-3xl sm:text-4xl font-black tracking-tight text-[var(--color-ink)]">
          Forgot your password?
        </h1>
        <p className="mt-3 text-[var(--color-ink-muted)]">
          Self-serve password reset is coming soon. For now, email us and we&apos;ll help you
          regain access within a few hours.
        </p>

        <div className="mt-8 rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-elevated)] p-6 sm:p-8 shadow-[var(--shadow-md)] text-left space-y-4">
          <p className="text-sm text-[var(--color-ink-muted)]">
            Email{" "}
            <a
              href={`mailto:${SITE.supportEmail}`}
              className="font-semibold text-[var(--color-brand-700)] hover:underline"
            >
              {SITE.supportEmail}
            </a>{" "}
            from the address you signed up with. Include your registered phone number if you
            have it handy — that&apos;ll speed up verification.
          </p>
          <Button
            type="button"
            variant="cta"
            size="lg"
            fullWidth
            href={`mailto:${SITE.supportEmail}?subject=Password%20reset%20request`}
          >
            <Mail size={18} />
            Email support
          </Button>
        </div>

        <div className="mt-6">
          <Link
            href="/login"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-[var(--color-brand-700)] hover:underline"
          >
            <ArrowLeft size={14} aria-hidden="true" />
            Back to login
          </Link>
        </div>
      </div>
    </Container>
  );
}
