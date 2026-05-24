"use client";

import * as React from "react";
import { usePathname } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import {
  IncomingCallModal,
  type IncomingCallInfo,
} from "@/components/call/IncomingCallModal";

/**
 * Site-wide listener for incoming calls.
 *
 * Mounted once inside <body> in the root layout. For any signed-in user it:
 *   1. Detects the user via Supabase auth (waits for it; logged-out users
 *      get a no-op).
 *   2. Subscribes to Postgres realtime on `public.calls` filtered by
 *      `callee_id=eq.<my-id>` so we only get events for calls aimed at us.
 *   3. When a row with status='ringing' arrives via INSERT (or UPDATE that
 *      transitions to ringing), pops a full-screen IncomingCallModal.
 *
 * Suppressed when already on /call/[id] — once you're on the call screen
 * the in-call UI owns the foreground.
 */

interface CallRowFromRealtime {
  id: string;
  caller_id: string;
  callee_id: string;
  inquiry_id: string;
  status: string;
}

export function GlobalCallListener() {
  const pathname = usePathname();
  const [incoming, setIncoming] = React.useState<IncomingCallInfo | null>(null);
  const [userId, setUserId] = React.useState<string | null>(null);

  // Resolve current user on mount.
  React.useEffect(() => {
    const supabase = createClient();
    let cancelled = false;

    supabase.auth.getUser().then(({ data }) => {
      if (cancelled) return;
      setUserId(data.user?.id ?? null);
    });

    // Also react to sign-in / sign-out within the session so we don't have to
    // hard-refresh after auth changes.
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setUserId(session?.user?.id ?? null);
      setIncoming(null);
    });

    return () => {
      cancelled = true;
      sub.subscription.unsubscribe();
    };
  }, []);

  // Subscribe to realtime once we have a user.
  React.useEffect(() => {
    if (!userId) return;
    const supabase = createClient();

    // Fetch the caller's profile + listing for nicer UI on the modal.
    async function enrichAndShow(row: CallRowFromRealtime) {
      let callerName: string | null = null;
      let callerAvatar: string | null = null;
      let listingTitle: string | null = null;
      try {
        const { data: profile } = await supabase
          .from("profiles")
          .select("name, avatar_url")
          .eq("id", row.caller_id)
          .maybeSingle();
        if (profile) {
          callerName = (profile as { name?: string | null }).name ?? null;
          callerAvatar =
            (profile as { avatar_url?: string | null }).avatar_url ?? null;
        }
      } catch {
        // tolerate
      }
      try {
        const { data: inq } = await supabase
          .from("inquiries")
          .select("listings:listing_id(title)")
          .eq("id", row.inquiry_id)
          .maybeSingle();
        const listings =
          (inq as { listings?: { title?: string } | null } | null)?.listings;
        listingTitle = listings?.title ?? null;
      } catch {
        // tolerate
      }

      setIncoming({
        callId: row.id,
        callerId: row.caller_id,
        callerName,
        callerAvatarUrl: callerAvatar,
        listingTitle,
      });
    }

    const channel = supabase
      .channel(`incoming-calls:${userId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "calls",
          filter: `callee_id=eq.${userId}`,
        },
        (payload) => {
          const row = payload.new as CallRowFromRealtime;
          if (row?.status === "ringing") void enrichAndShow(row);
        },
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "calls",
          filter: `callee_id=eq.${userId}`,
        },
        (payload) => {
          const row = payload.new as CallRowFromRealtime;
          const prev = payload.old as CallRowFromRealtime;
          // Show modal when the row transitions into ringing (rare path —
          // mostly seen if the row is created in another state then promoted).
          if (row?.status === "ringing" && prev?.status !== "ringing") {
            void enrichAndShow(row);
          }
          // If we're showing a modal and the call left ringing (caller
          // cancelled, or another tab picked it up), close ours.
          if (
            incoming?.callId === row?.id &&
            row?.status &&
            row.status !== "ringing"
          ) {
            setIncoming(null);
          }
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel).catch(() => {});
    };
    // We intentionally don't depend on `incoming` here — the close branch
    // reads it via closure. Re-subscribing on every modal change would churn.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  // Don't show modal while already on the call screen — the in-call UI owns it.
  if (pathname?.startsWith("/call/")) return null;
  if (!incoming) return null;

  return (
    <IncomingCallModal
      info={incoming}
      onClose={() => setIncoming(null)}
    />
  );
}
