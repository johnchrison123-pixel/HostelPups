import Link from "next/link";
import {
  Phone,
  PhoneIncoming,
  PhoneOutgoing,
  PhoneMissed,
  PhoneOff,
  Building2,
  ShieldCheck,
} from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { CITY_NAMES } from "@/lib/site";
import { timeAgo } from "@/lib/utils";
import type { CallWithJoins } from "@/lib/call-queries";

/**
 * Render a list of call rows.
 *
 * Server component — purely presentational, takes pre-fetched data. The
 * "perspective" prop controls which side is "me" so we can show the right
 * counterparty + the right inbound/outbound icon.
 *
 *   perspective="renter" — used by /calls (renter call history)
 *   perspective="owner"  — used by /owner/calls (owner call history)
 *   perspective="auto"   — pick from currentUserId vs caller_id
 */

interface CallHistoryListProps {
  calls: CallWithJoins[];
  currentUserId: string;
  /** Forces a perspective regardless of the row's caller/callee identity */
  perspective?: "renter" | "owner" | "auto";
}

function formatDurationSec(sec: number): string {
  if (!sec || sec < 1) return "0:00";
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

function statusBadge(call: CallWithJoins) {
  if (call.status === "ended" || call.status === "accepted") {
    return (
      <Badge tone="verified" icon={<ShieldCheck size={11} />}>
        Completed
      </Badge>
    );
  }
  if (call.status === "missed") {
    return (
      <Badge tone="warning" icon={<PhoneMissed size={11} />}>
        Missed
      </Badge>
    );
  }
  if (call.status === "rejected") {
    return (
      <Badge tone="danger" icon={<PhoneOff size={11} />}>
        Declined
      </Badge>
    );
  }
  if (call.status === "failed") {
    return (
      <Badge tone="danger" icon={<PhoneOff size={11} />}>
        Failed
      </Badge>
    );
  }
  if (call.status === "cancelled") {
    return (
      <Badge tone="default" icon={<PhoneOff size={11} />}>
        Cancelled
      </Badge>
    );
  }
  // ringing — rare in history but possible briefly
  return (
    <Badge tone="brand" icon={<Phone size={11} />}>
      Ringing
    </Badge>
  );
}

export function CallHistoryList({
  calls,
  currentUserId,
  perspective = "auto",
}: CallHistoryListProps) {
  if (calls.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-[var(--color-border)] bg-[var(--color-bg-elevated)] p-10 text-center">
        <div className="mx-auto inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--color-brand-100)] text-[var(--color-brand-700)] mb-3">
          <Phone size={22} aria-hidden="true" />
        </div>
        <p className="text-sm font-semibold">No calls yet</p>
        <p className="mt-1 text-xs text-[var(--color-ink-muted)] max-w-sm mx-auto">
          {perspective === "owner"
            ? "Once a renter calls you from a listing, the call will show up here. Make sure your business profile is live."
            : "Call a verified owner from any listing detail page to start a conversation. Your call history will appear here."}
        </p>
      </div>
    );
  }

  return (
    <ul role="list" className="grid gap-3">
      {calls.map((call) => {
        const wasCaller = call.caller_id === currentUserId;
        const counterparty = wasCaller ? call.callee : call.caller;
        const counterpartyName =
          counterparty?.name?.trim() || "HostelPups user";
        const initial = counterpartyName.charAt(0).toUpperCase() || "?";
        const avatar = counterparty?.avatar_url ?? null;

        const isMissedForMe =
          !wasCaller && (call.status === "missed" || call.status === "rejected");

        // Inbound/outbound icon
        let DirIcon = wasCaller ? PhoneOutgoing : PhoneIncoming;
        if (call.status === "missed") DirIcon = PhoneMissed;
        else if (call.status === "rejected") DirIcon = PhoneOff;

        const listing = call.listing;
        const listingCityName = listing?.city
          ? CITY_NAMES[listing.city] ?? listing.city
          : null;

        const durationLabel =
          call.duration_seconds && call.duration_seconds > 0
            ? formatDurationSec(call.duration_seconds)
            : null;

        return (
          <li
            key={call.id}
            className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-elevated)] p-4 sm:p-5 shadow-[var(--shadow-sm)]"
          >
            <div className="flex items-start gap-3 sm:gap-4">
              {/* Avatar */}
              <div
                className="h-12 w-12 sm:h-14 sm:w-14 rounded-full bg-[var(--color-brand-500)] text-[var(--color-ink)] flex items-center justify-center font-black overflow-hidden shrink-0"
                aria-hidden="true"
              >
                {avatar ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={avatar}
                    alt=""
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <span>{initial}</span>
                )}
              </div>

              {/* Main */}
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                  <p className="font-bold text-sm sm:text-base truncate">
                    {counterpartyName}
                  </p>
                  <DirIcon
                    size={14}
                    className={
                      isMissedForMe || call.status === "failed"
                        ? "text-red-600"
                        : "text-[var(--color-ink-subtle)]"
                    }
                    aria-label={
                      wasCaller ? "Outgoing call" : "Incoming call"
                    }
                  />
                  {statusBadge(call)}
                </div>

                {listing && (
                  <p className="mt-1 text-xs text-[var(--color-ink-muted)] flex items-center gap-1.5 truncate">
                    <Building2 size={11} aria-hidden="true" />
                    <Link
                      href={`/pg/${listing.city}/${listing.slug}`}
                      className="hover:text-[var(--color-brand-700)] hover:underline truncate"
                    >
                      {listing.title}
                    </Link>
                    {listingCityName && (
                      <span className="text-[var(--color-ink-subtle)]">
                        · {listing.area}, {listingCityName}
                      </span>
                    )}
                  </p>
                )}

                <p className="mt-1.5 text-[11px] text-[var(--color-ink-subtle)] uppercase tracking-wider">
                  {timeAgo(call.started_at)}
                  {durationLabel && (
                    <>
                      <span className="mx-1.5" aria-hidden="true">·</span>
                      {durationLabel}
                    </>
                  )}
                </p>
              </div>

              {/* Call back CTA — only when the missed/rejected side could call back */}
              {isMissedForMe && listing && (
                <Link
                  href={`/pg/${listing.city}/${listing.slug}`}
                  className="hidden sm:inline-flex items-center gap-1.5 rounded-full bg-[var(--color-brand-100)] text-[var(--color-brand-900)] hover:bg-[var(--color-brand-200)] transition-colors text-xs font-bold uppercase tracking-wider px-3 py-2 shrink-0"
                >
                  <Phone size={12} aria-hidden="true" />
                  Call back
                </Link>
              )}
            </div>
          </li>
        );
      })}
    </ul>
  );
}
