import { createClient } from "@/lib/supabase/server";

/**
 * Server-side query helpers for the /admin/** area.
 *
 * Every function here assumes the caller has already passed through
 * `requireAdmin()` — these helpers do NOT re-check the role. RLS policies
 * added in migration 0009 (admin SELECT on supervisory tables) gate the
 * data, but we still call them from authenticated server contexts only.
 *
 * Every helper wraps in try/catch and returns a safe default
 * (null / [] / 0) so the dashboard never crashes on a partial migration.
 * (Expand-Contract pattern per CLAUDE.md.)
 */

/* ============================================================
   Dashboard
   ============================================================ */

export interface AdminStats {
  usersTotal: number;
  usersNew24h: number;
  usersBanned: number;
  ownersTotal: number;
  ownersPendingKyc: number;
  ownersVerifiedKyc: number;
  listingsTotal: number;
  listingsLive: number;
  inquiriesTotal: number;
  inquiriesOpen: number;
  inquiries24h: number;
  callsTotal: number;
  calls24h: number;
  reportsOpen: number;
  paymentsTotal: number;
  paymentsToday: number;
  paymentsRevenueINR: number;
}

const DAY_MS = 24 * 60 * 60 * 1000;

export async function getAdminStats(): Promise<AdminStats> {
  const supabase = await createClient();
  const since24h = new Date(Date.now() - DAY_MS).toISOString();
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);
  const startOfTodayISO = startOfToday.toISOString();

  // Safely await a Supabase query that returns `{ count }`. Defaults to 0
  // if the query throws (e.g. table missing pre-migration).
  async function safeCount(
    p: PromiseLike<{ count: number | null }>,
  ): Promise<number> {
    try {
      return (await p).count ?? 0;
    } catch {
      return 0;
    }
  }

  const head = (table: string) =>
    supabase.from(table).select("id", { count: "exact", head: true });

  const [
    usersTotal,
    usersNew24h,
    usersBanned,
    ownersTotal,
    ownersPendingKyc,
    ownersVerifiedKyc,
    listingsTotal,
    listingsLive,
    inquiriesTotal,
    inquiriesOpen,
    inquiries24h,
    callsTotal,
    calls24h,
    reportsOpen,
    paymentsTotal,
    paymentsToday,
  ] = await Promise.all([
    safeCount(head("profiles")),
    safeCount(head("profiles").gte("created_at", since24h)),
    safeCount(head("profiles").eq("is_banned", true)),
    safeCount(head("owners")),
    safeCount(head("owners").eq("kyc_status", "pending")),
    safeCount(head("owners").eq("kyc_status", "verified")),
    safeCount(head("listings")),
    safeCount(head("listings").eq("status", "live")),
    safeCount(head("inquiries")),
    safeCount(head("inquiries").eq("status", "open")),
    safeCount(head("inquiries").gte("created_at", since24h)),
    safeCount(head("calls")),
    safeCount(head("calls").gte("created_at", since24h)),
    safeCount(head("reports").eq("status", "open")),
    safeCount(head("payments")),
    safeCount(head("payments").gte("created_at", startOfTodayISO)),
  ]);

  // Revenue: sum of completed payments today
  let paymentsRevenueINR = 0;
  try {
    const { data } = await supabase
      .from("payments")
      .select("amount, currency")
      .eq("status", "completed")
      .gte("created_at", startOfTodayISO);
    if (data) {
      paymentsRevenueINR = data
        .filter((p) => (p.currency ?? "INR") === "INR")
        .reduce((sum, p) => sum + Number(p.amount ?? 0), 0);
    }
  } catch {
    // ignore
  }

  return {
    usersTotal,
    usersNew24h,
    usersBanned,
    ownersTotal,
    ownersPendingKyc,
    ownersVerifiedKyc,
    listingsTotal,
    listingsLive,
    inquiriesTotal,
    inquiriesOpen,
    inquiries24h,
    callsTotal,
    calls24h,
    reportsOpen,
    paymentsTotal,
    paymentsToday,
    paymentsRevenueINR,
  };
}

export interface AdminSidebarBadges {
  pendingKyc: number;
  openReports: number;
  openInquiries: number;
}

export async function getAdminSidebarBadges(): Promise<AdminSidebarBadges> {
  const supabase = await createClient();
  async function safeCount(
    table: string,
    column: string,
    value: string,
  ): Promise<number> {
    try {
      const { count } = await supabase
        .from(table)
        .select("id", { count: "exact", head: true })
        .eq(column, value);
      return count ?? 0;
    } catch {
      return 0;
    }
  }
  const [pendingKyc, openReports, openInquiries] = await Promise.all([
    safeCount("owners", "kyc_status", "pending"),
    safeCount("reports", "status", "open"),
    safeCount("inquiries", "status", "open"),
  ]);
  return { pendingKyc, openReports, openInquiries };
}

/* ============================================================
   Users
   ============================================================ */

export interface AdminUserRow {
  id: string;
  email: string | null;
  phone: string | null;
  name: string | null;
  role: string;
  is_banned: boolean;
  banned_at: string | null;
  banned_reason: string | null;
  created_at: string;
  inquiry_count: number;
  call_count: number;
  favorite_count: number;
  reports_filed: number;
  reports_against: number;
  listing_count: number;
}

export interface SearchUsersInput {
  q?: string;
  role?: "user" | "owner" | "admin";
  banned?: boolean;
  limit?: number;
  offset?: number;
}

export async function searchUsers({
  q,
  role,
  banned,
  limit = 50,
  offset = 0,
}: SearchUsersInput = {}): Promise<{ rows: AdminUserRow[]; total: number }> {
  const supabase = await createClient();
  try {
    let query = supabase
      .from("admin_user_summary")
      .select("*", { count: "exact" });

    if (role) query = query.eq("role", role);
    if (typeof banned === "boolean") query = query.eq("is_banned", banned);

    if (q && q.trim()) {
      const term = q.trim();
      // Match name, email, or phone — sanitized for ILIKE
      const safe = term.replace(/[%_]/g, "\\$&");
      query = query.or(
        `name.ilike.%${safe}%,email.ilike.%${safe}%,phone.ilike.%${safe}%`,
      );
    }

    query = query.order("created_at", { ascending: false }).range(offset, offset + limit - 1);

    const { data, count, error } = await query;
    if (error) throw error;
    return { rows: (data ?? []) as AdminUserRow[], total: count ?? 0 };
  } catch {
    return { rows: [], total: 0 };
  }
}

export async function getUserById(id: string): Promise<AdminUserRow | null> {
  const supabase = await createClient();
  try {
    const { data, error } = await supabase
      .from("admin_user_summary")
      .select("*")
      .eq("id", id)
      .maybeSingle();
    if (error) throw error;
    return (data ?? null) as AdminUserRow | null;
  } catch {
    return null;
  }
}

export interface UserActivity {
  inquiries: Array<{
    id: string;
    status: string;
    created_at: string;
    listing_id: string;
    listing_title: string | null;
  }>;
  calls: Array<{
    id: string;
    status: string;
    duration_seconds: number | null;
    created_at: string;
    counterparty: string | null;
  }>;
  payments: Array<{
    id: string;
    amount: number;
    currency: string;
    status: string;
    purpose: string;
    created_at: string;
  }>;
}

export async function getUserActivity(userId: string): Promise<UserActivity> {
  const supabase = await createClient();
  const empty: UserActivity = { inquiries: [], calls: [], payments: [] };

  try {
    const [inqRes, callRes, payRes] = await Promise.all([
      supabase
        .from("inquiries")
        .select("id, status, created_at, listing_id, listings:listing_id(title)")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(20),
      supabase
        .from("calls")
        .select("id, status, duration_seconds, created_at, caller_id, callee_id")
        .or(`caller_id.eq.${userId},callee_id.eq.${userId}`)
        .order("created_at", { ascending: false })
        .limit(20),
      supabase
        .from("payments")
        .select("id, amount, currency, status, purpose, created_at")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(20),
    ]);

    const inquiries =
      (inqRes.data ?? []).map((r: Record<string, unknown>) => {
        const listings = r.listings as { title?: string } | null;
        return {
          id: String(r.id),
          status: String(r.status),
          created_at: String(r.created_at),
          listing_id: String(r.listing_id),
          listing_title: listings?.title ?? null,
        };
      }) ?? [];

    const calls =
      (callRes.data ?? []).map((r: Record<string, unknown>) => ({
        id: String(r.id),
        status: String(r.status),
        duration_seconds:
          r.duration_seconds == null ? null : Number(r.duration_seconds),
        created_at: String(r.created_at),
        counterparty:
          r.caller_id === userId ? String(r.callee_id) : String(r.caller_id),
      })) ?? [];

    const payments =
      (payRes.data ?? []).map((r: Record<string, unknown>) => ({
        id: String(r.id),
        amount: Number(r.amount ?? 0),
        currency: String(r.currency ?? "INR"),
        status: String(r.status),
        purpose: String(r.purpose ?? ""),
        created_at: String(r.created_at),
      })) ?? [];

    return { inquiries, calls, payments };
  } catch {
    return empty;
  }
}

/* ============================================================
   Owners
   ============================================================ */

export interface AdminOwnerRow {
  id: string;
  business_name: string | null;
  tier: string | null;
  kyc_status: string;
  has_verification_badge: boolean | null;
  contact_phone: string | null;
  registered_at: string | null;
  // joined profile fields
  name: string | null;
  email: string | null;
  is_banned: boolean;
  // counts
  listing_count: number;
  inquiry_count: number;
}

export interface SearchOwnersInput {
  q?: string;
  kyc_status?: "not_submitted" | "pending" | "verified" | "rejected";
  tier?: string;
  limit?: number;
  offset?: number;
}

export async function searchOwners({
  q,
  kyc_status,
  tier,
  limit = 50,
  offset = 0,
}: SearchOwnersInput = {}): Promise<{ rows: AdminOwnerRow[]; total: number }> {
  const supabase = await createClient();
  try {
    let query = supabase
      .from("owners")
      .select(
        `
        id, business_name, tier, kyc_status, has_verification_badge,
        contact_phone, registered_at,
        profiles:id (name, email, is_banned)
      `,
        { count: "exact" },
      );

    if (kyc_status) query = query.eq("kyc_status", kyc_status);
    if (tier) query = query.eq("tier", tier);

    if (q && q.trim()) {
      const safe = q.trim().replace(/[%_]/g, "\\$&");
      query = query.ilike("business_name", `%${safe}%`);
    }

    query = query
      .order("registered_at", { ascending: false, nullsFirst: false })
      .range(offset, offset + limit - 1);

    const { data, count, error } = await query;
    if (error) throw error;

    // counts per-owner — kept simple for now; v2 can move to a view
    const ids = (data ?? []).map((r: Record<string, unknown>) => String(r.id));
    const counts = await getOwnerCounts(ids);

    const rows: AdminOwnerRow[] = (data ?? []).map((r: Record<string, unknown>) => {
      const profiles = r.profiles as
        | { name?: string; email?: string; is_banned?: boolean }
        | null;
      return {
        id: String(r.id),
        business_name: (r.business_name as string | null) ?? null,
        tier: (r.tier as string | null) ?? null,
        kyc_status: String(r.kyc_status),
        has_verification_badge:
          r.has_verification_badge == null
            ? null
            : Boolean(r.has_verification_badge),
        contact_phone: (r.contact_phone as string | null) ?? null,
        registered_at: (r.registered_at as string | null) ?? null,
        name: profiles?.name ?? null,
        email: profiles?.email ?? null,
        is_banned: Boolean(profiles?.is_banned),
        listing_count: counts.get(String(r.id))?.listings ?? 0,
        inquiry_count: counts.get(String(r.id))?.inquiries ?? 0,
      };
    });
    return { rows, total: count ?? 0 };
  } catch {
    return { rows: [], total: 0 };
  }
}

async function getOwnerCounts(
  ownerIds: string[],
): Promise<Map<string, { listings: number; inquiries: number }>> {
  const out = new Map<string, { listings: number; inquiries: number }>();
  if (ownerIds.length === 0) return out;
  const supabase = await createClient();
  try {
    const { data: listings } = await supabase
      .from("listings")
      .select("id, owner_id")
      .in("owner_id", ownerIds);
    const listingsByOwner = new Map<string, string[]>();
    (listings ?? []).forEach((l) => {
      const arr = listingsByOwner.get(l.owner_id) ?? [];
      arr.push(l.id);
      listingsByOwner.set(l.owner_id, arr);
    });

    // Inquiries are joined via listing_id
    const allListingIds = (listings ?? []).map((l) => l.id);
    const inquiriesByListing: Record<string, number> = {};
    if (allListingIds.length > 0) {
      const { data: inq } = await supabase
        .from("inquiries")
        .select("listing_id")
        .in("listing_id", allListingIds);
      (inq ?? []).forEach((row) => {
        inquiriesByListing[row.listing_id] =
          (inquiriesByListing[row.listing_id] ?? 0) + 1;
      });
    }

    ownerIds.forEach((id) => {
      const lids = listingsByOwner.get(id) ?? [];
      const inqCount = lids.reduce(
        (s, lid) => s + (inquiriesByListing[lid] ?? 0),
        0,
      );
      out.set(id, { listings: lids.length, inquiries: inqCount });
    });
  } catch {
    // leave empty
  }
  return out;
}

export async function getOwnerById(id: string): Promise<AdminOwnerRow | null> {
  const { rows } = await searchOwners({ q: undefined, limit: 1, offset: 0 });
  // Slightly inefficient — but we need the join. Fetch one cleanly:
  const supabase = await createClient();
  try {
    const { data, error } = await supabase
      .from("owners")
      .select(
        `
        id, business_name, tier, kyc_status, has_verification_badge,
        contact_phone, registered_at, kyc_documents,
        profiles:id (name, email, is_banned)
      `,
      )
      .eq("id", id)
      .maybeSingle();
    if (error || !data) return null;
    const counts = await getOwnerCounts([id]);
    const profiles = data.profiles as
      | { name?: string; email?: string; is_banned?: boolean }
      | null;
    void rows; // silence unused
    return {
      id: String(data.id),
      business_name: (data.business_name as string | null) ?? null,
      tier: (data.tier as string | null) ?? null,
      kyc_status: String(data.kyc_status),
      has_verification_badge:
        data.has_verification_badge == null
          ? null
          : Boolean(data.has_verification_badge),
      contact_phone: (data.contact_phone as string | null) ?? null,
      registered_at: (data.registered_at as string | null) ?? null,
      name: profiles?.name ?? null,
      email: profiles?.email ?? null,
      is_banned: Boolean(profiles?.is_banned),
      listing_count: counts.get(id)?.listings ?? 0,
      inquiry_count: counts.get(id)?.inquiries ?? 0,
    };
  } catch {
    return null;
  }
}

/* ============================================================
   Listings
   ============================================================ */

export interface AdminListingRow {
  id: string;
  title: string;
  city: string;
  area: string;
  status: string;
  type: string;
  owner_id: string;
  owner_name: string | null;
  business_name: string | null;
  is_verified: boolean | null;
  is_boosted_until: string | null;
  total_vacancies: number | null;
  created_at: string;
  updated_at: string;
  slug: string;
}

export interface SearchListingsInput {
  q?: string;
  city?: string;
  status?: string;
  owner_id?: string;
  limit?: number;
  offset?: number;
}

export async function searchAdminListings({
  q,
  city,
  status,
  owner_id,
  limit = 50,
  offset = 0,
}: SearchListingsInput = {}): Promise<{
  rows: AdminListingRow[];
  total: number;
}> {
  const supabase = await createClient();
  try {
    let query = supabase
      .from("listings")
      .select(
        `
        id, title, slug, city, area, status, type, owner_id,
        is_verified, is_boosted_until, total_vacancies,
        created_at, updated_at,
        owners:owner_id (business_name, profiles:id (name))
      `,
        { count: "exact" },
      );

    if (city) query = query.eq("city", city);
    if (status) query = query.eq("status", status);
    if (owner_id) query = query.eq("owner_id", owner_id);

    if (q && q.trim()) {
      const safe = q.trim().replace(/[%_]/g, "\\$&");
      query = query.ilike("title", `%${safe}%`);
    }

    query = query
      .order("updated_at", { ascending: false })
      .range(offset, offset + limit - 1);

    const { data, count, error } = await query;
    if (error) throw error;

    const rows: AdminListingRow[] = (data ?? []).map(
      (r: Record<string, unknown>) => {
        const owners = r.owners as
          | {
              business_name?: string;
              profiles?: { name?: string };
            }
          | null;
        return {
          id: String(r.id),
          title: String(r.title),
          slug: String(r.slug),
          city: String(r.city),
          area: String(r.area ?? ""),
          status: String(r.status),
          type: String(r.type),
          owner_id: String(r.owner_id),
          owner_name: owners?.profiles?.name ?? null,
          business_name: owners?.business_name ?? null,
          is_verified: r.is_verified == null ? null : Boolean(r.is_verified),
          is_boosted_until: (r.is_boosted_until as string | null) ?? null,
          total_vacancies:
            r.total_vacancies == null ? null : Number(r.total_vacancies),
          created_at: String(r.created_at),
          updated_at: String(r.updated_at),
        };
      },
    );
    return { rows, total: count ?? 0 };
  } catch {
    return { rows: [], total: 0 };
  }
}

/* ============================================================
   Inquiries (supervisory)
   ============================================================ */

export interface AdminInquiryRow {
  id: string;
  status: string;
  created_at: string;
  user_id: string;
  user_name: string | null;
  listing_id: string;
  listing_title: string | null;
  city: string | null;
  owner_id: string | null;
  business_name: string | null;
  message_count: number;
}

export interface SearchInquiriesInput {
  status?: "open" | "responded" | "closed";
  city?: string;
  listing_id?: string;
  user_id?: string;
  limit?: number;
  offset?: number;
}

export async function searchInquiries({
  status,
  city,
  listing_id,
  user_id,
  limit = 50,
  offset = 0,
}: SearchInquiriesInput = {}): Promise<{
  rows: AdminInquiryRow[];
  total: number;
}> {
  const supabase = await createClient();
  try {
    let query = supabase
      .from("inquiries")
      .select(
        `
        id, status, created_at, user_id, listing_id,
        profiles:user_id (name),
        listings:listing_id (title, city, owner_id, owners:owner_id (business_name))
      `,
        { count: "exact" },
      );

    if (status) query = query.eq("status", status);
    if (listing_id) query = query.eq("listing_id", listing_id);
    if (user_id) query = query.eq("user_id", user_id);

    query = query
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    const { data, count, error } = await query;
    if (error) throw error;

    let rows: AdminInquiryRow[] = (data ?? []).map(
      (r: Record<string, unknown>) => {
        const profiles = r.profiles as { name?: string } | null;
        const listings = r.listings as
          | {
              title?: string;
              city?: string;
              owner_id?: string;
              owners?: { business_name?: string };
            }
          | null;
        return {
          id: String(r.id),
          status: String(r.status),
          created_at: String(r.created_at),
          user_id: String(r.user_id),
          user_name: profiles?.name ?? null,
          listing_id: String(r.listing_id),
          listing_title: listings?.title ?? null,
          city: listings?.city ?? null,
          owner_id: listings?.owner_id ?? null,
          business_name: listings?.owners?.business_name ?? null,
          message_count: 0,
        };
      },
    );
    if (city) rows = rows.filter((r) => r.city === city);

    // Get message counts for the visible inquiries
    if (rows.length > 0) {
      const ids = rows.map((r) => r.id);
      try {
        const { data: msgs } = await supabase
          .from("messages")
          .select("inquiry_id")
          .in("inquiry_id", ids);
        const tally: Record<string, number> = {};
        (msgs ?? []).forEach((m) => {
          tally[m.inquiry_id] = (tally[m.inquiry_id] ?? 0) + 1;
        });
        rows = rows.map((r) => ({ ...r, message_count: tally[r.id] ?? 0 }));
      } catch {
        // ignore
      }
    }

    return { rows, total: count ?? 0 };
  } catch {
    return { rows: [], total: 0 };
  }
}

/* ============================================================
   Calls (supervisory, read-only)
   ============================================================ */

export interface AdminCallRow {
  id: string;
  status: string;
  duration_seconds: number | null;
  started_at: string | null;
  created_at: string;
  caller_id: string;
  callee_id: string;
  caller_name: string | null;
  callee_name: string | null;
  inquiry_id: string | null;
  end_reason: string | null;
}

export interface SearchCallsInput {
  status?: string;
  since?: string; // ISO
  limit?: number;
  offset?: number;
}

export async function searchAdminCalls({
  status,
  since,
  limit = 50,
  offset = 0,
}: SearchCallsInput = {}): Promise<{ rows: AdminCallRow[]; total: number }> {
  const supabase = await createClient();
  try {
    let query = supabase
      .from("calls")
      .select(
        `
        id, status, duration_seconds, started_at, created_at,
        caller_id, callee_id, inquiry_id, end_reason
      `,
        { count: "exact" },
      );

    if (status) query = query.eq("status", status);
    if (since) query = query.gte("created_at", since);

    query = query
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    const { data, count, error } = await query;
    if (error) throw error;

    // Look up names in one shot
    const ids = new Set<string>();
    (data ?? []).forEach((r) => {
      ids.add(r.caller_id);
      ids.add(r.callee_id);
    });
    let nameById = new Map<string, string>();
    if (ids.size > 0) {
      try {
        const { data: profs } = await supabase
          .from("profiles")
          .select("id, name")
          .in("id", Array.from(ids));
        nameById = new Map(
          (profs ?? []).map((p) => [p.id as string, (p.name as string) ?? ""]),
        );
      } catch {
        // ignore
      }
    }

    const rows: AdminCallRow[] = (data ?? []).map((r) => ({
      id: String(r.id),
      status: String(r.status),
      duration_seconds:
        r.duration_seconds == null ? null : Number(r.duration_seconds),
      started_at: (r.started_at as string | null) ?? null,
      created_at: String(r.created_at),
      caller_id: String(r.caller_id),
      callee_id: String(r.callee_id),
      caller_name: nameById.get(String(r.caller_id)) ?? null,
      callee_name: nameById.get(String(r.callee_id)) ?? null,
      inquiry_id: (r.inquiry_id as string | null) ?? null,
      end_reason: (r.end_reason as string | null) ?? null,
    }));

    return { rows, total: count ?? 0 };
  } catch {
    return { rows: [], total: 0 };
  }
}

/* ============================================================
   Payments
   ============================================================ */

export interface AdminPaymentRow {
  id: string;
  user_id: string;
  owner_id: string | null;
  amount: number;
  currency: string;
  purpose: string;
  status: string;
  razorpay_order_id: string | null;
  razorpay_payment_id: string | null;
  created_at: string;
  user_name: string | null;
  user_email: string | null;
  business_name: string | null;
}

export interface SearchPaymentsInput {
  status?: string;
  purpose?: string;
  since?: string;
  user_id?: string;
  limit?: number;
  offset?: number;
}

export async function searchAdminPayments({
  status,
  purpose,
  since,
  user_id,
  limit = 50,
  offset = 0,
}: SearchPaymentsInput = {}): Promise<{
  rows: AdminPaymentRow[];
  total: number;
}> {
  const supabase = await createClient();
  try {
    let query = supabase
      .from("payments")
      .select(
        `
        id, user_id, owner_id, amount, currency, purpose, status,
        razorpay_order_id, razorpay_payment_id, created_at,
        profiles:user_id (name, email),
        owners:owner_id (business_name)
      `,
        { count: "exact" },
      );

    if (status) query = query.eq("status", status);
    if (purpose) query = query.eq("purpose", purpose);
    if (user_id) query = query.eq("user_id", user_id);
    if (since) query = query.gte("created_at", since);

    query = query
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    const { data, count, error } = await query;
    if (error) throw error;

    const rows: AdminPaymentRow[] = (data ?? []).map(
      (r: Record<string, unknown>) => {
        const profiles = r.profiles as
          | { name?: string; email?: string }
          | null;
        const owners = r.owners as { business_name?: string } | null;
        return {
          id: String(r.id),
          user_id: String(r.user_id),
          owner_id: (r.owner_id as string | null) ?? null,
          amount: Number(r.amount ?? 0),
          currency: String(r.currency ?? "INR"),
          purpose: String(r.purpose ?? ""),
          status: String(r.status),
          razorpay_order_id: (r.razorpay_order_id as string | null) ?? null,
          razorpay_payment_id: (r.razorpay_payment_id as string | null) ?? null,
          created_at: String(r.created_at),
          user_name: profiles?.name ?? null,
          user_email: profiles?.email ?? null,
          business_name: owners?.business_name ?? null,
        };
      },
    );
    return { rows, total: count ?? 0 };
  } catch {
    return { rows: [], total: 0 };
  }
}

/* ============================================================
   Reports
   ============================================================ */

export interface AdminReportRow {
  id: string;
  reporter_id: string;
  reporter_name: string | null;
  target_type: string;
  target_id: string;
  reason: string;
  details: string | null;
  status: string;
  resolved_by: string | null;
  resolved_at: string | null;
  resolution_note: string | null;
  created_at: string;
}

export interface SearchReportsInput {
  status?: "open" | "reviewing" | "resolved" | "dismissed";
  target_type?: string;
  limit?: number;
  offset?: number;
}

export async function searchReports({
  status,
  target_type,
  limit = 50,
  offset = 0,
}: SearchReportsInput = {}): Promise<{
  rows: AdminReportRow[];
  total: number;
}> {
  const supabase = await createClient();
  try {
    let query = supabase
      .from("reports")
      .select(
        `
        id, reporter_id, target_type, target_id, reason, details,
        status, resolved_by, resolved_at, resolution_note, created_at,
        profiles:reporter_id (name)
      `,
        { count: "exact" },
      );

    if (status) query = query.eq("status", status);
    if (target_type) query = query.eq("target_type", target_type);

    query = query
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    const { data, count, error } = await query;
    if (error) throw error;
    const rows: AdminReportRow[] = (data ?? []).map(
      (r: Record<string, unknown>) => {
        const profiles = r.profiles as { name?: string } | null;
        return {
          id: String(r.id),
          reporter_id: String(r.reporter_id),
          reporter_name: profiles?.name ?? null,
          target_type: String(r.target_type),
          target_id: String(r.target_id),
          reason: String(r.reason),
          details: (r.details as string | null) ?? null,
          status: String(r.status),
          resolved_by: (r.resolved_by as string | null) ?? null,
          resolved_at: (r.resolved_at as string | null) ?? null,
          resolution_note: (r.resolution_note as string | null) ?? null,
          created_at: String(r.created_at),
        };
      },
    );
    return { rows, total: count ?? 0 };
  } catch {
    return { rows: [], total: 0 };
  }
}

/* ============================================================
   Audit log
   ============================================================ */

export interface AdminAuditRow {
  id: string;
  admin_id: string;
  admin_name: string | null;
  action: string;
  target_table: string | null;
  target_id: string | null;
  before: unknown;
  after: unknown;
  reason: string | null;
  ip_address: string | null;
  created_at: string;
}

export interface SearchAuditInput {
  admin_id?: string;
  action?: string;
  target_table?: string;
  since?: string;
  limit?: number;
  offset?: number;
}

export async function searchAuditLog({
  admin_id,
  action,
  target_table,
  since,
  limit = 50,
  offset = 0,
}: SearchAuditInput = {}): Promise<{
  rows: AdminAuditRow[];
  total: number;
}> {
  const supabase = await createClient();
  try {
    let query = supabase
      .from("admin_actions")
      .select(
        `
        id, admin_id, action, target_table, target_id,
        before, after, reason, ip_address, created_at,
        profiles:admin_id (name)
      `,
        { count: "exact" },
      );
    if (admin_id) query = query.eq("admin_id", admin_id);
    if (action) query = query.eq("action", action);
    if (target_table) query = query.eq("target_table", target_table);
    if (since) query = query.gte("created_at", since);

    query = query
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    const { data, count, error } = await query;
    if (error) throw error;
    const rows: AdminAuditRow[] = (data ?? []).map(
      (r: Record<string, unknown>) => {
        const profiles = r.profiles as { name?: string } | null;
        return {
          id: String(r.id),
          admin_id: String(r.admin_id),
          admin_name: profiles?.name ?? null,
          action: String(r.action),
          target_table: (r.target_table as string | null) ?? null,
          target_id: (r.target_id as string | null) ?? null,
          before: r.before ?? null,
          after: r.after ?? null,
          reason: (r.reason as string | null) ?? null,
          ip_address: (r.ip_address as string | null) ?? null,
          created_at: String(r.created_at),
        };
      },
    );
    return { rows, total: count ?? 0 };
  } catch {
    return { rows: [], total: 0 };
  }
}
