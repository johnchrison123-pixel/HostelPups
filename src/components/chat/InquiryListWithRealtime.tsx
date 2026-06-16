"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

/**
 * H9 fix — owner-side inquiry list realtime wrapper.
 *
 * `/owner/inquiries` is a server component that renders the list of
 * inquiries on listings the current owner owns. Without realtime the
 * owner has to F5 to see a new inquiry arrive — death by missed leads.
 * This wrapper subscribes to:
 *   - INSERTs on `public.inquiries` for any listing the owner owns
 *   - UPDATEs on the same set (status flips from open→responded, etc.)
 *   - INSERTs on `public.messages` for inquiries on the owner's listings
 *     (covers the "renter just replied" case which doesn't change the
 *     inquiry row but should still bump the list)
 *
 * Filtering by listing_id at the server-realtime layer is exact, so we
 * don't shotgun-receive every inquiry in the system.
 */
interface InquiryListWithRealtimeProps {
  /** All listing_ids the current owner owns — used to filter the realtime stream. */
  listingIds: string[];
  /**
   * All inquiry_ids currently rendered. We add this so a renter's reply
   * (messages INSERT) on an inquiry the owner already has on screen also
   * triggers a refresh — without it, the owner only sees the "Replied" /
   * unread state update on next page load.
   */
  inquiryIds: string[];
  children: React.ReactNode;
}

export function InquiryListWithRealtime({
  listingIds,
  inquiryIds,
  children,
}: InquiryListWithRealtimeProps) {
  const router = useRouter();
  const router_refresh = router.refresh;
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

  const listingIdsKey = React.useMemo(
    () => [...listingIds].sort().join(","),
    [listingIds],
  );
  const inquiryIdsKey = React.useMemo(
    () => [...inquiryIds].sort().join(","),
    [inquiryIds],
  );

  React.useEffect(() => {
    if (!listingIdsKey) return;
    const lids = listingIdsKey.split(",").filter(Boolean);
    if (lids.length === 0) return;

    const supabase = createClient();
    const listingFilter = `listing_id=in.(${lids.join(",")})`;

    const channel = supabase
      .channel(`owner-inquiries:${listingIdsKey}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "inquiries",
          filter: listingFilter,
        },
        () => scheduleRefresh(),
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "inquiries",
          filter: listingFilter,
        },
        () => scheduleRefresh(),
      );

    // Also subscribe to messages on the inquiries we already know about so
    // a renter reply re-sorts the list (last-message preview moves).
    if (inquiryIdsKey) {
      const iids = inquiryIdsKey.split(",").filter(Boolean);
      if (iids.length > 0) {
        channel.on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "messages",
            filter: `inquiry_id=in.(${iids.join(",")})`,
          },
          () => scheduleRefresh(),
        );
      }
    }

    channel.subscribe();

    return () => {
      if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current);
      void supabase.removeChannel(channel);
    };
  }, [listingIdsKey, inquiryIdsKey, scheduleRefresh]);

  React.useEffect(() => {
    function onVisibility() {
      if (document.visibilityState === "visible") scheduleRefresh();
    }
    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, [scheduleRefresh]);

  return <>{children}</>;
}
