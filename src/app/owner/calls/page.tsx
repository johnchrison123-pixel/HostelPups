import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { PhoneCall, Lock, ShieldCheck, Volume2 } from "lucide-react";
import { OwnerLayout } from "@/components/owner/OwnerSidebar";
import { CallHistoryList } from "@/components/call/CallHistoryList";
import { buildMetadata } from "@/lib/seo";
import { getCurrentUser } from "@/lib/auth";
import { getCurrentUserCalls } from "@/lib/call-queries";

export const metadata: Metadata = buildMetadata({
  title: "Calls",
  description:
    "Voice call history with renters on HostelPups. No phone numbers exposed.",
  path: "/owner/calls",
  noindex: true,
});

export default async function OwnerCallsPage() {
  // Auth gate: mirror the other /owner/* pages so anonymous visitors get
  // bounced to login, and renters can't see the owner-flavoured sidebar.
  const user = await getCurrentUser();
  if (!user) {
    redirect("/owner/login?next=/owner/calls");
  }
  const intent =
    (user.user_metadata?.intent as string | undefined) ?? "renter";
  if (intent !== "owner") {
    redirect("/owner/login?next=/owner/calls");
  }

  const calls = await getCurrentUserCalls(100);

  return (
    <OwnerLayout>
      <header className="mb-4">
        <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
          Call history
        </h1>
        <p className="mt-1 text-sm text-[var(--color-ink-muted)]">
          See every voice call you&apos;ve placed or received through HostelPups.
        </p>
      </header>

      {/* Privacy/feature explainer banner */}
      <section
        aria-labelledby="privacy-heading"
        className="rounded-2xl border-2 border-[var(--color-brand-300)] bg-[var(--color-brand-50)] p-5 sm:p-6 mb-6"
      >
        <div className="flex items-start gap-4">
          <span
            className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[var(--color-brand-500)] text-[var(--color-ink)]"
            aria-hidden="true"
          >
            <PhoneCall size={22} />
          </span>
          <div className="flex-1">
            <h2 id="privacy-heading" className="font-bold text-base sm:text-lg">
              Calls happen entirely through HostelPups
            </h2>
            <p className="mt-1 text-sm text-[var(--color-ink-muted)]">
              All audio is peer-to-peer over WebRTC. Renters never see your phone
              number, and you never see theirs. When a renter calls you from a
              listing, the call rings on whichever browser you&apos;re signed in on.
            </p>

            <ul className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm" role="list">
              <li className="flex items-center gap-2">
                <Lock size={14} className="text-emerald-600 shrink-0" aria-hidden="true" />
                <span>Phone numbers stay hidden</span>
              </li>
              <li className="flex items-center gap-2">
                <ShieldCheck size={14} className="text-emerald-600 shrink-0" aria-hidden="true" />
                <span>WebRTC peer-to-peer audio</span>
              </li>
              <li className="flex items-center gap-2">
                <Volume2 size={14} className="text-emerald-600 shrink-0" aria-hidden="true" />
                <span>Mute available · Loudspeaker on mobile app</span>
              </li>
            </ul>
          </div>
        </div>
      </section>

      <CallHistoryList
        calls={calls}
        currentUserId={user.id}
        perspective="owner"
      />
    </OwnerLayout>
  );
}
