import { createClient } from "@/lib/supabase/server";
import type { Listing, Owner } from "@/lib/types";

/**
 * Server-side query helpers for the owner dashboard area.
 *
 * Every query here scopes by `auth.uid()` either explicitly via the
 * supabase client (which carries the session cookie) or via the RLS
 * policies in supabase/migrations/0002_rls_policies.sql.
 *
 * Returning safe fallbacks (null / []) keeps server components from
 * crashing if the DB hasn't been migrated yet (Expand-Contract pattern
 * per CLAUDE.md) — we always try the query inside try/catch.
 */

export interface CurrentOwnerResult {
  profile: {
    id: string;
    role: string;
    name: string | null;
    phone: string | null;
    email: string | null;
    avatar_url: string | null;
  } | null;
  owner: Owner | null;
}

/**
 * Returns the auth user's profile + owners row, or null if not signed in.
 * `owner` will be null if the user is signed in but doesn't have an owners
 * row yet (e.g. mid-signup, hasn't completed onboarding).
 */
export async function getCurrentOwner(): Promise<CurrentOwnerResult | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  let profile: CurrentOwnerResult["profile"] = null;
  try {
    const { data } = await supabase
      .from("profiles")
      .select("id, role, name, phone, email, avatar_url")
      .eq("id", user.id)
      .maybeSingle();
    if (data) profile = data as CurrentOwnerResult["profile"];
  } catch {
    // ignore — table might not exist yet
  }

  let owner: Owner | null = null;
  try {
    const { data } = await supabase
      .from("owners")
      .select("*")
      .eq("id", user.id)
      .maybeSingle();
    if (data) owner = data as Owner;
  } catch {
    // ignore
  }

  return { profile, owner };
}

/**
 * All listings owned by the currently signed-in owner. Joins room_types
 * + listing_photos so cards can render covers + minimum prices in one trip.
 *
 * Order: most recently updated first. Empty array if not signed in OR no
 * listings yet OR query throws (Expand-Contract).
 */
export async function getOwnerListings(): Promise<Listing[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  try {
    const { data, error } = await supabase
      .from("listings")
      .select("*, room_types(*), listing_photos(*)")
      .eq("owner_id", user.id)
      .order("updated_at", { ascending: false });
    if (error) return [];
    return (data ?? []) as Listing[];
  } catch {
    return [];
  }
}

/**
 * Single listing by id, scoped to the current owner. RLS enforces this too
 * but we add `.eq("owner_id", user.id)` defensively.
 */
export async function getOwnerListingById(
  id: string,
): Promise<Listing | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  try {
    const { data, error } = await supabase
      .from("listings")
      .select("*, room_types(*), listing_photos(*)")
      .eq("id", id)
      .eq("owner_id", user.id)
      .maybeSingle();
    if (error) return null;
    return (data ?? null) as Listing | null;
  } catch {
    return null;
  }
}

export interface InquiryWithListing {
  id: string;
  user_id: string;
  listing_id: string;
  status: "open" | "responded" | "closed";
  created_at: string;
  listings: {
    id: string;
    title: string;
    city: string;
    area: string;
  } | null;
  profiles: {
    id: string;
    name: string | null;
    avatar_url: string | null;
  } | null;
}

/**
 * Inquiries on this owner's listings. RLS scopes via the
 * `inquiries_select_participants` policy — owners see inquiries whose
 * listing.owner_id = auth.uid().
 */
export async function getOwnerInquiries(): Promise<InquiryWithListing[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  try {
    const { data, error } = await supabase
      .from("inquiries")
      .select(
        `
        id,
        user_id,
        listing_id,
        status,
        created_at,
        listings:listing_id (id, title, city, area, owner_id),
        profiles:user_id (id, name, avatar_url)
      `,
      )
      .order("created_at", { ascending: false });

    if (error) return [];

    // RLS already filters to this owner's inquiries; we map shape only.
    return ((data ?? []) as unknown as InquiryWithListing[]) ?? [];
  } catch {
    return [];
  }
}

export interface OwnerStats {
  totalListings: number;
  liveListings: number;
  totalInquiries: number;
  openInquiries: number;
}

/**
 * Aggregate counts for the dashboard. Each count is one `head:true` query so
 * we don't pull the full rows back to count them. Runs in parallel.
 *
 * Returns zeroes if not signed in or any query fails (safe default).
 */
export async function getOwnerStats(): Promise<OwnerStats> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { totalListings: 0, liveListings: 0, totalInquiries: 0, openInquiries: 0 };
  }

  try {
    const [totalRes, liveRes, inquiriesRes, openRes] = await Promise.all([
      supabase
        .from("listings")
        .select("id", { count: "exact", head: true })
        .eq("owner_id", user.id),
      supabase
        .from("listings")
        .select("id", { count: "exact", head: true })
        .eq("owner_id", user.id)
        .eq("status", "live"),
      // RLS filters inquiries to this owner's listings, so count is implicit.
      supabase.from("inquiries").select("id", { count: "exact", head: true }),
      supabase
        .from("inquiries")
        .select("id", { count: "exact", head: true })
        .eq("status", "open"),
    ]);

    return {
      totalListings: totalRes.count ?? 0,
      liveListings: liveRes.count ?? 0,
      totalInquiries: inquiriesRes.count ?? 0,
      openInquiries: openRes.count ?? 0,
    };
  } catch {
    return { totalListings: 0, liveListings: 0, totalInquiries: 0, openInquiries: 0 };
  }
}
