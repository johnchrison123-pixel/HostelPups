import type { Metadata } from "next";
import { Phone } from "lucide-react";
import { Container } from "@/components/ui/Container";
import { Button } from "@/components/ui/Button";
import { buildMetadata } from "@/lib/seo";
import { getCurrentUser } from "@/lib/auth";
import { getCurrentUserCalls } from "@/lib/call-queries";
import { CallHistoryList } from "@/components/call/CallHistoryList";

/**
 * Renter-side call history page. Mirrors /messages.
 * noindex — private user data.
 */
export const metadata: Metadata = buildMetadata({
  title: "Your calls",
  description:
    "Voice call history with PG and hostel owners on HostelPups. All calls happen in-app — no phone numbers exposed.",
  path: "/calls",
  noindex: true,
});

export default async function CallsPage() {
  const user = await getCurrentUser();

  if (!user) {
    return (
      <Container size="md" className="py-16 sm:py-24">
        <div className="text-center max-w-xl mx-auto">
          <div className="mx-auto inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--color-brand-100)] text-[var(--color-brand-700)] mb-6">
            <Phone size={28} aria-hidden="true" />
          </div>
          <h1 className="text-3xl sm:text-4xl font-black tracking-tight">
            Your calls
          </h1>
          <p className="mt-4 text-lg text-[var(--color-ink-muted)] leading-relaxed">
            Sign in to see your voice call history with PG owners. Calls route through
            HostelPups — your phone number is never shared.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Button href="/login" variant="cta" size="lg">
              Sign in
            </Button>
            <Button href="/signup" variant="outline" size="lg">
              Create account
            </Button>
          </div>
        </div>
      </Container>
    );
  }

  const calls = await getCurrentUserCalls(100);

  return (
    <Container size="lg" className="py-8 sm:py-12">
      <header className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
          Your calls
        </h1>
        <p className="mt-1 text-sm text-[var(--color-ink-muted)]">
          Every voice call you&apos;ve placed or received through HostelPups.
          No phone numbers are exposed — all audio is peer-to-peer WebRTC.
        </p>
      </header>

      {calls.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-[var(--color-border)] bg-[var(--color-bg-elevated)] p-10 text-center">
          <div className="mx-auto inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--color-brand-100)] text-[var(--color-brand-700)] mb-3">
            <Phone size={22} aria-hidden="true" />
          </div>
          <p className="text-sm font-semibold">No calls yet</p>
          <p className="mt-1 text-xs text-[var(--color-ink-muted)] max-w-sm mx-auto">
            Call a verified owner from any listing detail page to start a conversation.
          </p>
          <Button href="/search" variant="primary" className="mt-5">
            Browse listings
          </Button>
        </div>
      ) : (
        <CallHistoryList
          calls={calls}
          currentUserId={user.id}
          perspective="renter"
        />
      )}
    </Container>
  );
}
