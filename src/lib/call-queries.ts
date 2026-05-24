import { createClient } from "@/lib/supabase/server";
import type { Call } from "@/lib/types";

/**
 * Joined listing shape, attached to a call row via inquiry → listing.
 *
 * NOTE: contact_phone is intentionally NOT included and must never be
 * exposed through this query — anti-disintermediation rule.
 */
export interface CallListingSummary {
  id: string;
  title: string;
  city: string;
  area: string;
  slug: string;
}

/**
 * Lightweight profile shape used for caller/callee identity in call history.
 */
export interface CallPartySummary {
  id: string;
  name: string | null;
  avatar_url: string | null;
}

/**
 * One call enriched with the listing it concerns and the two parties'
 * profile info (so we can render avatars + display names).
 */
export interface CallWithJoins extends Call {
  listing: CallListingSummary | null;
  caller: CallPartySummary | null;
  callee: CallPartySummary | null;
}

/**
 * Fetch every call where the current user was caller or callee, newest first.
 *
 * The shape we need (call + listing + both parties' profiles) can't be done in
 * a single PostgREST select easily because `caller_id` / `callee_id` reference
 * auth.users(id) not profiles(id) — relationship hints become ambiguous. So
 * we run two queries and stitch them client-side, which keeps the query plan
 * predictable and the RLS path simple.
 *
 * Forward-compatibility: if the `calls` table doesn't exist yet (e.g. migration
 * 0004 hasn't run in some env), we swallow the error and return [].
 */
export async function getCurrentUserCalls(limit = 50): Promise<CallWithJoins[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  try {
    // Step 1 — fetch the raw call rows + nested listing via inquiry.
    const { data: rawCalls, error } = await supabase
      .from("calls")
      .select(
        `
        *,
        inquiries:inquiry_id (
          id,
          listings:listing_id (
            id, title, city, area, slug
          )
        )
      `,
      )
      .or(`caller_id.eq.${user.id},callee_id.eq.${user.id}`)
      .order("started_at", { ascending: false })
      .limit(limit);

    if (error || !rawCalls) return [];

    type RawCall = Call & {
      inquiries?: {
        id: string;
        listings?: CallListingSummary | null;
      } | null;
    };

    const rows = rawCalls as unknown as RawCall[];
    if (rows.length === 0) return [];

    // Step 2 — collect every unique party id across all calls + bulk-fetch.
    const ids = new Set<string>();
    for (const r of rows) {
      ids.add(r.caller_id);
      ids.add(r.callee_id);
    }

    const profileMap = new Map<string, CallPartySummary>();
    try {
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, name, avatar_url")
        .in("id", Array.from(ids));
      for (const p of (profiles ?? []) as CallPartySummary[]) {
        profileMap.set(p.id, p);
      }
    } catch {
      // profiles table missing in some envs — leave map empty, UI degrades gracefully.
    }

    return rows.map<CallWithJoins>((r) => ({
      ...(r as Call),
      listing: r.inquiries?.listings ?? null,
      caller: profileMap.get(r.caller_id) ?? null,
      callee: profileMap.get(r.callee_id) ?? null,
    }));
  } catch {
    return [];
  }
}

/**
 * Fetch a single call by id. Returns null if the current user is not a
 * participant (defense-in-depth alongside the RLS `calls_select_participants`
 * policy).
 *
 * Used by `/call/[id]/page.tsx` to render the in-call screen.
 */
export async function getCallById(callId: string): Promise<CallWithJoins | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  try {
    const { data: rawCall, error } = await supabase
      .from("calls")
      .select(
        `
        *,
        inquiries:inquiry_id (
          id,
          listings:listing_id (
            id, title, city, area, slug
          )
        )
      `,
      )
      .eq("id", callId)
      .maybeSingle();

    if (error || !rawCall) return null;

    type RawCall = Call & {
      inquiries?: {
        id: string;
        listings?: CallListingSummary | null;
      } | null;
    };
    const r = rawCall as unknown as RawCall;

    // Belt + braces on top of RLS.
    if (r.caller_id !== user.id && r.callee_id !== user.id) return null;

    const ids = [r.caller_id, r.callee_id];
    const profileMap = new Map<string, CallPartySummary>();
    try {
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, name, avatar_url")
        .in("id", ids);
      for (const p of (profiles ?? []) as CallPartySummary[]) {
        profileMap.set(p.id, p);
      }
    } catch {
      // profiles table missing — fine.
    }

    return {
      ...(r as Call),
      listing: r.inquiries?.listings ?? null,
      caller: profileMap.get(r.caller_id) ?? null,
      callee: profileMap.get(r.callee_id) ?? null,
    };
  } catch {
    return null;
  }
}
