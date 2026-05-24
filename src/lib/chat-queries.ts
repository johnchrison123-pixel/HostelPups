import { createClient } from "@/lib/supabase/server";

/**
 * Server-side chat / conversation query helpers.
 *
 * Every query relies on RLS policies in supabase/migrations/0002_rls_policies.sql:
 *  - `inquiries_select_participants` lets a user read inquiries they created
 *    OR inquiries on a listing they own.
 *  - `messages_select_participants` mirrors that for messages.
 *
 * Following Expand-Contract: all queries are wrapped in try/catch + safe fallbacks
 * (null / []) so a missing column / pre-migration deploy doesn't crash the UI.
 */

/** Lightweight last-message shape used in conversation cards. */
export interface ConversationLastMessage {
  content: string;
  was_redacted: boolean;
  created_at: string;
  sender_id: string;
}

/** A conversation card row (renter view of their inquiry). */
export interface RenterConversation {
  id: string;
  status: "open" | "responded" | "closed";
  created_at: string;
  listing: {
    id: string;
    title: string;
    city: string;
    area: string;
    slug: string;
  } | null;
  owner: {
    id: string;
    business_name: string;
    has_verification_badge: boolean;
  } | null;
  lastMessage: ConversationLastMessage | null;
}

/** A conversation card row (owner view of an inquiry on their listing). */
export interface OwnerConversation {
  id: string;
  status: "open" | "responded" | "closed";
  created_at: string;
  listing: {
    id: string;
    title: string;
    city: string;
    area: string;
    slug: string;
  } | null;
  renter: {
    id: string;
    name: string | null;
    avatar_url: string | null;
  } | null;
  lastMessage: ConversationLastMessage | null;
}

export interface MyConversations {
  asRenter: RenterConversation[];
  asOwner: OwnerConversation[];
}

/**
 * All inquiries the current user is a participant in (as renter and/or owner).
 * Returns flat conversation cards with last message preview attached.
 *
 * Returns empty buckets if not signed in. Safe to call from any server component.
 */
export async function getMyConversations(): Promise<MyConversations> {
  const empty: MyConversations = { asRenter: [], asOwner: [] };
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return empty;

  // === Renter side: inquiries the user created ===
  let asRenterRows: RenterRow[] = [];
  try {
    const { data, error } = await supabase
      .from("inquiries")
      .select(
        `
        id,
        status,
        created_at,
        listings:listing_id (
          id,
          title,
          city,
          area,
          slug,
          owners:owner_id (
            id,
            business_name,
            has_verification_badge
          )
        )
      `,
      )
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });
    if (!error && data) {
      asRenterRows = data as unknown as RenterRow[];
    }
  } catch {
    // table missing — leave empty
  }

  // === Owner side: inquiries on listings the user owns ===
  // We can't `.eq("listings.owner_id", ...)` reliably across PostgREST versions
  // when using nested filters with !inner. RLS already scopes to participants,
  // so we filter in app-code by inspecting the joined `listings.owner_id`.
  let asOwnerRows: OwnerRow[] = [];
  try {
    const { data, error } = await supabase
      .from("inquiries")
      .select(
        `
        id,
        status,
        created_at,
        user_id,
        listings:listing_id (
          id,
          title,
          city,
          area,
          slug,
          owner_id
        ),
        profiles:user_id (
          id,
          name,
          avatar_url
        )
      `,
      )
      .order("created_at", { ascending: false });
    if (!error && data) {
      const rows = data as unknown as OwnerRow[];
      asOwnerRows = rows.filter((r) => r.listings?.owner_id === user.id);
    }
  } catch {
    // table missing — leave empty
  }

  // === Fetch last-message per inquiry in ONE query, then map ===
  const inquiryIds = [
    ...asRenterRows.map((r) => r.id),
    ...asOwnerRows.map((r) => r.id),
  ];
  const latestByInquiry: Record<string, ConversationLastMessage> = {};
  if (inquiryIds.length > 0) {
    try {
      const { data: msgs, error } = await supabase
        .from("messages")
        .select("inquiry_id, content, was_redacted, created_at, sender_id")
        .in("inquiry_id", inquiryIds)
        .order("created_at", { ascending: false });
      if (!error && msgs) {
        for (const m of msgs as Array<{
          inquiry_id: string;
          content: string;
          was_redacted: boolean;
          created_at: string;
          sender_id: string;
        }>) {
          if (!latestByInquiry[m.inquiry_id]) {
            latestByInquiry[m.inquiry_id] = {
              content: m.content,
              was_redacted: m.was_redacted,
              created_at: m.created_at,
              sender_id: m.sender_id,
            };
          }
        }
      }
    } catch {
      // messages table missing — leave empty map
    }
  }

  return {
    asRenter: asRenterRows.map((row) => ({
      id: row.id,
      status: row.status,
      created_at: row.created_at,
      listing: row.listings
        ? {
            id: row.listings.id,
            title: row.listings.title,
            city: row.listings.city,
            area: row.listings.area,
            slug: row.listings.slug,
          }
        : null,
      owner: row.listings?.owners
        ? {
            id: row.listings.owners.id,
            business_name: row.listings.owners.business_name,
            has_verification_badge: row.listings.owners.has_verification_badge,
          }
        : null,
      lastMessage: latestByInquiry[row.id] ?? null,
    })),
    asOwner: asOwnerRows.map((row) => ({
      id: row.id,
      status: row.status,
      created_at: row.created_at,
      listing: row.listings
        ? {
            id: row.listings.id,
            title: row.listings.title,
            city: row.listings.city,
            area: row.listings.area,
            slug: row.listings.slug,
          }
        : null,
      renter: row.profiles
        ? {
            id: row.profiles.id,
            name: row.profiles.name,
            avatar_url: row.profiles.avatar_url,
          }
        : null,
      lastMessage: latestByInquiry[row.id] ?? null,
    })),
  };
}

/** Raw shape returned from the renter-side joined select. */
interface RenterRow {
  id: string;
  status: "open" | "responded" | "closed";
  created_at: string;
  listings: {
    id: string;
    title: string;
    city: string;
    area: string;
    slug: string;
    owners: {
      id: string;
      business_name: string;
      has_verification_badge: boolean;
    } | null;
  } | null;
}

/** Raw shape returned from the owner-side joined select. */
interface OwnerRow {
  id: string;
  status: "open" | "responded" | "closed";
  created_at: string;
  user_id: string;
  listings: {
    id: string;
    title: string;
    city: string;
    area: string;
    slug: string;
    owner_id: string;
  } | null;
  profiles: {
    id: string;
    name: string | null;
    avatar_url: string | null;
  } | null;
}

export interface ConversationDetail {
  inquiry: {
    id: string;
    user_id: string;
    listing_id: string;
    status: "open" | "responded" | "closed";
    created_at: string;
  };
  listing: {
    id: string;
    title: string;
    city: string;
    area: string;
    slug: string;
    owner_id: string;
  };
  owner: {
    id: string;
    business_name: string;
    has_verification_badge: boolean;
  } | null;
  renter: {
    id: string;
    name: string | null;
    avatar_url: string | null;
  } | null;
  messages: ChatMessage[];
  myRole: "renter" | "owner";
  meId: string;
}

export interface ChatMessage {
  id: string;
  inquiry_id: string;
  sender_id: string;
  content: string;
  was_redacted: boolean;
  created_at: string;
}

/**
 * Full conversation (inquiry + listing + counterparty + ordered messages).
 *
 * Returns null when not signed in, inquiry doesn't exist, OR the current user
 * isn't a participant (RLS also blocks this — defense in depth).
 */
export async function getConversation(
  inquiryId: string,
): Promise<ConversationDetail | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  let inquiryRow: InquiryWithJoins | null = null;
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
        listings:listing_id (
          id,
          title,
          city,
          area,
          slug,
          owner_id,
          owners:owner_id (
            id,
            business_name,
            has_verification_badge
          )
        ),
        profiles:user_id (
          id,
          name,
          avatar_url
        )
      `,
      )
      .eq("id", inquiryId)
      .maybeSingle();
    if (error || !data) return null;
    inquiryRow = data as unknown as InquiryWithJoins;
  } catch {
    return null;
  }

  if (!inquiryRow || !inquiryRow.listings) return null;

  const isRenter = inquiryRow.user_id === user.id;
  const isOwner = inquiryRow.listings.owner_id === user.id;
  if (!isRenter && !isOwner) return null;

  let messages: ChatMessage[] = [];
  try {
    const { data, error } = await supabase
      .from("messages")
      .select("id, inquiry_id, sender_id, content, was_redacted, created_at")
      .eq("inquiry_id", inquiryId)
      .order("created_at", { ascending: true });
    if (!error && data) {
      messages = data as ChatMessage[];
    }
  } catch {
    // messages table missing — empty thread
  }

  return {
    inquiry: {
      id: inquiryRow.id,
      user_id: inquiryRow.user_id,
      listing_id: inquiryRow.listing_id,
      status: inquiryRow.status,
      created_at: inquiryRow.created_at,
    },
    listing: {
      id: inquiryRow.listings.id,
      title: inquiryRow.listings.title,
      city: inquiryRow.listings.city,
      area: inquiryRow.listings.area,
      slug: inquiryRow.listings.slug,
      owner_id: inquiryRow.listings.owner_id,
    },
    owner: inquiryRow.listings.owners
      ? {
          id: inquiryRow.listings.owners.id,
          business_name: inquiryRow.listings.owners.business_name,
          has_verification_badge:
            inquiryRow.listings.owners.has_verification_badge,
        }
      : null,
    renter: inquiryRow.profiles
      ? {
          id: inquiryRow.profiles.id,
          name: inquiryRow.profiles.name,
          avatar_url: inquiryRow.profiles.avatar_url,
        }
      : null,
    messages,
    myRole: isRenter ? "renter" : "owner",
    meId: user.id,
  };
}

interface InquiryWithJoins {
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
    slug: string;
    owner_id: string;
    owners: {
      id: string;
      business_name: string;
      has_verification_badge: boolean;
    } | null;
  } | null;
  profiles: {
    id: string;
    name: string | null;
    avatar_url: string | null;
  } | null;
}

/**
 * Count of redacted messages an owner has sent in the last 30 days.
 *
 * Used by moderation tooling: 3+ → soft warning, 5+ → recommended for
 * listing suspension. No automatic action taken here — just a count.
 *
 * Returns 0 if not migrated / query fails / no signed-in user.
 */
export async function getOwnerStrikeCount(ownerId: string): Promise<number> {
  const supabase = await createClient();
  const thirtyDaysAgo = new Date(
    Date.now() - 30 * 24 * 60 * 60 * 1000,
  ).toISOString();
  try {
    const { count, error } = await supabase
      .from("messages")
      .select("id, inquiries!inner(listings!inner(owner_id))", {
        count: "exact",
        head: true,
      })
      .eq("inquiries.listings.owner_id", ownerId)
      .eq("sender_id", ownerId)
      .eq("was_redacted", true)
      .gte("created_at", thirtyDaysAgo);
    if (error) return 0;
    return count ?? 0;
  } catch {
    return 0;
  }
}
