import type { Metadata } from "next";
import Link from "next/link";
import { Lock, ArrowLeft } from "lucide-react";
import { Container } from "@/components/ui/Container";
import { buildMetadata } from "@/lib/seo";
import { ResetPasswordForm } from "@/components/auth/ResetPasswordForm";

export const metadata: Metadata = buildMetadata({
  title: "Set new password",
  description: "Choose a new password for your HostelPups account.",
  path: "/reset-password",
  noindex: true,
});

/**
 * Reset-password page — the user lands here from the email link sent by
 * /forgot-password. Supabase automatically exchanges the URL hash tokens
 * for a session via the auth-helpers listener in the layout, so by the
 * time the page renders the user has a valid session.
 *
 * The ResetPasswordForm client component calls supabase.auth.updateUser({ password })
 * and redirects to / on success.
 *
 * PENDING: this page is only reachable via the email link. Until custom SMTP
 * is configured in Supabase (Authentication → Email → SMTP Settings), reset
 * emails may not deliver in production.
 */
export default function ResetPasswordPage() {
  return (
    <Container size="sm" className="py-12 sm:py-20">
      <div className="mx-auto max-w-md">
        <div className="text-center mb-8">
          <div className="mx-auto inline-flex h-16 w-16 items-center justify-center rounded-full bg-[var(--color-brand-100)]">
            <Lock size={32} className="text-[var(--color-brand-700)]" aria-hidden="true" />
          </div>
          <h1 className="mt-6 text-3xl sm:text-4xl font-black tracking-tight text-[var(--color-ink)]">
            Set new password
          </h1>
          <p className="mt-3 text-[var(--color-ink-muted)]">
            Choose a strong password — at least 8 characters.
          </p>
        </div>

        <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-elevated)] p-6 sm:p-8 shadow-[var(--shadow-md)]">
          <ResetPasswordForm />
        </div>

        <div className="mt-6 text-center">
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
