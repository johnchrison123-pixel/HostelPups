"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

/**
 * H9 fix — renter-side conversation list realtime wrapper.
 *
 * `/messages` is a server component that renders a server-derived list of
 * conversations. Without realtime the renter has to F5 to see a new
 * message land. This wrapper subscribes to `public.messages` INSERT events
 * for inquiries the viewer is in and calls `router.refresh()` so the
 * server component re-runs its query and the conversation cards update
 * with the new "last message" preview.
 *
 * We scope by `inquiry_id=in.(...)` so we only get INSERTs that are
 * relevant — no need to wake on every chat message in the system. The
 * inquiry-id list is passed in by the server.
 *
 * NOTE: realtime row-level RLS still applies — the channel will only
 * deliver rows the user is authorised to see. The `in.()` filter is a
 * server-side hint to keep the per-socket traffic down.
 */
interface ConversationListWithRealtimeProps {
  inquiryIds: string[];
  children: React.ReactNode;
}

export function ConversationListWithRealtime({
  inquiryIds,
  children,
}: ConversationListWithRealtimeProps) {
  const router = useRouter();
  const router_refresh = router.refresh;
  // Throttle refresh so a fast burst of messages doesn't thrash router.refresh.
  // Last write wins inside an 800ms window.
  const refreshTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );
  const scheduleRefresh = React.useCallback(() => {
    if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current);
    refreshTimerRef.current = setTimeout(() => {
      router_refresh();
      refreshTimerRef.current = null;
    }, 800);
  }, [router_refresh]);

  // The dependency we actually care about is the SET of inquiry ids.
  // Sort + join so a re-rendered parent passing the same array contents
  // in a different order doesn't re-subscribe.
  const idsKey = React.useMemo(
    () => [...inquiryIds].sort().join(","),
    [inquiryIds],
  );

  React.useEffect(() => {
    if (!idsKey) return;
    const ids = idsKey.split(",").filter(Boolean);
    if (ids.length === 0) return;
    const supabase = createClient();

    // Postgres realtime `in.(...)` accepts a paren-wrapped CSV of values.
    const filter = `inquiry_id=in.(${ids.join(",")})`;
    const channel = supabase
      .channel(`conversations-list:${idsKey}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter,
        },
        () => scheduleRefresh(),
      )
      // UPDATE on `inquiries` (status flips, e.g. open ↔ responded) should
      // also re-sort the list. RLS still scopes to participants.
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "inquiries",
          filter: `id=in.(${ids.join(",")})`,
        },
        () => scheduleRefresh(),
      )
      .subscribe();

    return () => {
      if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current);
      void supabase.removeChannel(channel);
    };
  }, [idsKey, scheduleRefresh]);

  // Also re-fetch when the tab becomes visible after being backgrounded —
  // a missed realtime event during throttling can leave the list stale.
  React.useEffect(() => {
    function onVisibility() {
      if (document.visibilityState === "visible") scheduleRefresh();
    }
    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, [scheduleRefresh]);

  return <>{children}</>;
}
