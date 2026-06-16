"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Phone, PhoneOff, User } from "lucide-react";
import { acceptCall, rejectCall, markCallMissed } from "@/lib/call-actions";

/**
 * Full-screen overlay that pops up whenever GlobalCallListener detects a new
 * `ringing` call where callee_id = current user.
 *
 * Three exits:
 *   1. Accept → server-action acceptCall, then navigate to /call/{id}?role=callee
 *   2. Decline → server-action rejectCall, modal closes via onClose
 *   3. Auto-miss after 60s of no-answer → server-action markCallMissed, modal closes
 *
 * The 60s timeout matches what mobile carriers do for unanswered cellular
 * calls — long enough that someone walking back to their phone can pick up,
 * short enough that the caller isn't held forever on a dead ringer.
 */
export interface IncomingCallInfo {
  callId: string;
  callerId: string;
  callerName?: string | null;
  callerAvatarUrl?: string | null;
  listingTitle?: string | null;
}

interface IncomingCallModalProps {
  info: IncomingCallInfo;
  onClose: () => void;
}

const AUTO_MISS_MS = 60_000;

/**
 * H10 fix: the auto-miss timer used to keep ticking even after the user
 * had clicked Accept (and the accept server-action was mid-flight). If
 * the accept failed and was re-tried 50s later, the 60s mark could fire
 * and `markCallMissed` would write `missed` over a call that the callee
 * was actively trying to pick up. We now treat the modal as a tiny
 * state machine: only `ringing` runs the auto-miss countdown.
 */
type ModalState =
  | "ringing"
  | "accepting"
  | "rejected"
  | "missed"
  | "cancelled"
  | "accepted";

export function IncomingCallModal({ info, onClose }: IncomingCallModalProps) {
  const router = useRouter();
  const [state, setState] = React.useState<ModalState>("ringing");
  const [error, setError] = React.useState<string | null>(null);

  const busy = state === "accepting";

  // Auto-miss after 60s — but ONLY while the modal is in the `ringing`
  // state. If the user tapped Accept and we're in `accepting`, the timer
  // is torn down. If accept FAILS we drop back to `ringing` below, which
  // re-arms a fresh 60s timer (effect's cleanup + re-run).
  React.useEffect(() => {
    if (state !== "ringing") return;
    const timer = setTimeout(async () => {
      try {
        await markCallMissed(info.callId);
      } catch {
        // best-effort
      } finally {
        setState("missed");
        onClose();
      }
    }, AUTO_MISS_MS);
    return () => clearTimeout(timer);
  }, [info.callId, onClose, state]);

  async function handleAccept() {
    if (state !== "ringing") return;
    setState("accepting");
    setError(null);
    try {
      await acceptCall(info.callId);
      setState("accepted");
      // Hand off to the in-call screen. The peer side (caller) is already
      // subscribed to the realtime channel and will react to the status change.
      router.push(`/call/${info.callId}?role=callee`);
      onClose();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Could not accept call";
      setError(msg);
      // Step back to `ringing` so (a) the user can re-tap Accept and (b)
      // the auto-miss effect re-arms a fresh 60s timer.
      setState("ringing");
    }
  }

  async function handleDecline() {
    if (state !== "ringing") return;
    setState("accepting");
    setError(null);
    try {
      await rejectCall(info.callId);
      setState("rejected");
      onClose();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Could not decline call";
      setError(msg);
      setState("ringing");
    }
  }

  const displayName = info.callerName?.trim() || "HostelPups user";
  const initial = displayName.charAt(0).toUpperCase() || "?";

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-[var(--color-ink)]/85 backdrop-blur-sm p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="incoming-call-heading"
    >
      <div className="w-full max-w-sm rounded-3xl bg-[var(--color-bg-elevated)] shadow-2xl p-6 sm:p-8 text-center">
        <p
          id="incoming-call-heading"
          className="text-xs uppercase tracking-widest text-[var(--color-ink-subtle)] font-bold"
        >
          Incoming call
        </p>

        {/* Avatar + ringing rings */}
        <div className="relative mx-auto mt-4 mb-5 inline-flex h-28 w-28 items-center justify-center">
          <span
            className="absolute inset-0 rounded-full bg-[var(--color-brand-200)] animate-ping opacity-70"
            aria-hidden="true"
          />
          <span
            className="absolute inset-2 rounded-full bg-[var(--color-brand-300)]/60 animate-pulse"
            aria-hidden="true"
          />
          <div className="relative h-24 w-24 rounded-full bg-[var(--color-brand-500)] text-[var(--color-ink)] flex items-center justify-center text-3xl font-black overflow-hidden">
            {info.callerAvatarUrl ? (
              // No next/image here — modal is mounted client-side at runtime,
              // an Image with default loader is fine but plain <img> avoids
              // remote-domain config issues in dev.
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={info.callerAvatarUrl}
                alt=""
                className="h-full w-full object-cover"
              />
            ) : (
              <span aria-hidden="true">{initial}</span>
            )}
          </div>
        </div>

        <h2 className="text-xl sm:text-2xl font-black tracking-tight">{displayName}</h2>

        {info.listingTitle ? (
          <p className="mt-1 text-sm text-[var(--color-ink-muted)]">
            Calling about <span className="font-semibold">{info.listingTitle}</span>
          </p>
        ) : (
          <p className="mt-1 text-sm text-[var(--color-ink-muted)] flex items-center justify-center gap-1.5">
            <User size={12} aria-hidden="true" />
            HostelPups voice call
          </p>
        )}

        {/* Animated dots */}
        <div
          className="mt-3 inline-flex items-center gap-1"
          aria-hidden="true"
        >
          <span className="h-1.5 w-1.5 rounded-full bg-[var(--color-brand-500)] animate-bounce [animation-delay:-0.3s]" />
          <span className="h-1.5 w-1.5 rounded-full bg-[var(--color-brand-500)] animate-bounce [animation-delay:-0.15s]" />
          <span className="h-1.5 w-1.5 rounded-full bg-[var(--color-brand-500)] animate-bounce" />
        </div>

        <div className="mt-7 flex items-center justify-center gap-5">
          <button
            type="button"
            onClick={handleDecline}
            disabled={busy}
            aria-label="Decline call"
            className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-red-600 text-white shadow-lg hover:bg-red-700 transition-colors disabled:opacity-50 active:scale-95"
          >
            <PhoneOff size={22} aria-hidden="true" />
          </button>

          <button
            type="button"
            onClick={handleAccept}
            disabled={busy}
            aria-label="Accept call"
            className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-emerald-600 text-white shadow-lg hover:bg-emerald-700 transition-colors disabled:opacity-50 active:scale-95 animate-pulse"
          >
            <Phone size={22} aria-hidden="true" />
          </button>
        </div>

        <div className="mt-5 flex items-center justify-between text-[11px] text-[var(--color-ink-subtle)]">
          <span>Decline</span>
          <span>Accept</span>
        </div>

        {error && (
          <p role="alert" className="mt-4 text-xs text-red-700">
            {error}
          </p>
        )}
      </div>
    </div>
  );
}
