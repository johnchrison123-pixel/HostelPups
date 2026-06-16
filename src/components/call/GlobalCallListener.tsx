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
 *
 * Fixes applied:
 *   - H1 / H3: the UPDATE handler used to read `incoming` from React-state
 *     closure, which never refreshed because the subscription effect
 *     intentionally doesn't re-subscribe on every state change. We now
 *     keep `incomingRef` in lockstep with `incoming` so the handler sees
 *     the *current* visible call, not the snapshot from when we subscribed.
 *     This fixes the "modal won't close when caller cancels" bug.
 *   - H11: a second `ringing` call arriving while another is already on
 *     screen used to silently overwrite the first (whoever's modal was
 *     visible just got replaced — caller A would be left holding while
 *     callee saw caller B). We now queue subsequent calls and surface them
 *     one at a time as each is dismissed.
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

  // Refs that mirror state so the realtime callbacks always read the
  // CURRENT value, not a stale closure snapshot. (Realtime subscriptions
  // outlive React state across renders — closure capture is a footgun
  // here.)
  const incomingRef = React.useRef<IncomingCallInfo | null>(null);
  const pendingQueueRef = React.useRef<IncomingCallInfo[]>([]);

  // Keep incomingRef in lockstep with the visible modal so the realtime
  // UPDATE handler can compare against `incomingRef.current` rather than a
  // stale `incoming` captured at subscribe time.
  const updateIncoming = React.useCallback(
    (next: IncomingCallInfo | null) => {
      incomingRef.current = next;
      setIncoming(next);
    },
    [],
  );

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
      pendingQueueRef.current = [];
      updateIncoming(null);
    });

    return () => {
      cancelled = true;
      sub.subscription.unsubscribe();
    };
  }, [updateIncoming]);

  // Surface the visible modal: if nothing is showing, pop the next item
  // from the queue. If the modal is open already, we keep new calls
  // queued behind it.
  const surface = React.useCallback(
    (info: IncomingCallInfo) => {
      if (!incomingRef.current) {
        updateIncoming(info);
        return;
      }
      // Already showing a call for this same id — just refresh the data
      // (e.g. caller updated their avatar mid-ring).
      if (incomingRef.current.callId === info.callId) {
        updateIncoming(info);
        return;
      }
      // Already showing a different call — queue this one. Skip if it's
      // a duplicate of something already queued.
      const already =
        pendingQueueRef.current.find((q) => q.callId === info.callId) != null;
      if (!already) pendingQueueRef.current.push(info);
    },
    [updateIncoming],
  );

  const handleClose = React.useCallback(() => {
    const next = pendingQueueRef.current.shift() ?? null;
    updateIncoming(next);
  }, [updateIncoming]);

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

      surface({
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
          // If the call that left ringing matches the visible modal,
          // close it. Compare via the REF so this handler reads the live
          // value rather than a stale closure snapshot (this is the H1
          // / H3 fix).
          if (
            row?.status &&
            row.status !== "ringing" &&
            incomingRef.current?.callId === row.id
          ) {
            handleClose();
          }
          // Also drop the row from the pending queue if it's no longer
          // ringing — keeps backlog tidy if caller cancels while queued.
          if (row?.status && row.status !== "ringing") {
            pendingQueueRef.current = pendingQueueRef.current.filter(
              (q) => q.callId !== row.id,
            );
          }
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel).catch(() => {});
    };
  }, [userId, surface, handleClose]);

  // Don't show modal while already on the call screen — the in-call UI owns it.
  if (pathname?.startsWith("/call/")) return null;
  if (!incoming) return null;

  return <IncomingCallModal info={incoming} onClose={handleClose} />;
}
