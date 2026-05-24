import type { Metadata } from "next";
import { PhoneCall, Lock, ShieldCheck, Mic, Volume2 } from "lucide-react";
import { OwnerLayout } from "@/components/owner/OwnerSidebar";
import { buildMetadata } from "@/lib/seo";

export const metadata: Metadata = buildMetadata({
  title: "Calls",
  description: "Voice call history with renters on HostelPups.",
  path: "/owner/calls",
  noindex: true,
});

export default function OwnerCallsPage() {
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

      {/* Phase 2 banner */}
      <section
        aria-labelledby="phase2-heading"
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
            <h2 id="phase2-heading" className="font-bold text-base sm:text-lg">
              In-app voice calling is coming in Phase 2
            </h2>
            <p className="mt-1 text-sm text-[var(--color-ink-muted)]">
              You&apos;ll be able to call inquirers directly through the HostelPups app without
              sharing your phone number. Calls route over WebRTC — same quality as WhatsApp,
              same privacy as a missed-call switchboard.
            </p>

            <ul className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm" role="list">
              <li className="flex items-center gap-2">
                <Lock size={14} className="text-emerald-600 shrink-0" aria-hidden="true" />
                <span>Phone numbers stay hidden</span>
              </li>
              <li className="flex items-center gap-2">
                <ShieldCheck size={14} className="text-emerald-600 shrink-0" aria-hidden="true" />
                <span>End-to-end encrypted audio</span>
              </li>
              <li className="flex items-center gap-2">
                <Volume2 size={14} className="text-emerald-600 shrink-0" aria-hidden="true" />
                <span>Mute &amp; loudspeaker toggle</span>
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* Empty call log */}
      <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-elevated)] overflow-hidden shadow-[var(--shadow-sm)]">
        <table className="w-full text-sm">
          <thead className="bg-[var(--color-surface)] text-[var(--color-ink-subtle)] text-xs uppercase tracking-wider">
            <tr>
              <th scope="col" className="text-left font-semibold py-3 px-4">Date</th>
              <th scope="col" className="text-left font-semibold py-3 px-4 hidden sm:table-cell">From / To</th>
              <th scope="col" className="text-left font-semibold py-3 px-4">Duration</th>
              <th scope="col" className="text-left font-semibold py-3 px-4">Status</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-t border-[var(--color-border)]">
              <td colSpan={4} className="py-12 px-4 text-center">
                <div className="mx-auto inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--color-surface)] text-[var(--color-ink-subtle)] mb-3">
                  <Mic size={22} aria-hidden="true" />
                </div>
                <p className="text-sm font-semibold">No calls yet</p>
                <p className="mt-1 text-xs text-[var(--color-ink-muted)]">
                  Once Phase 2 ships, every call (placed or received) will show up here.
                </p>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <p className="mt-3 text-[11px] uppercase tracking-wider font-bold text-amber-700">
        Pending Phase 2 — WebRTC integration + public.calls query
      </p>
    </OwnerLayout>
  );
}
