"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { slugify } from "@/lib/utils";
import type {
  GenderPreference,
  ListingStatus,
  OwnerTier,
  PropertyType,
  WedgeTag,
} from "@/lib/types";

/* ============================================================
   Owner lifecycle
   ============================================================ */

/**
 * Ensures a public.owners row exists for the currently authenticated user.
 *
 * Idempotent — if the row already exists, returns it unchanged. Otherwise
 * inserts it using metadata from auth.users.user_metadata (set by
 * OwnerSignupForm via signInWithOtp's options.data on signup), falling
 * back to args passed by the caller.
 *
 * Why not the on_auth_user_created trigger? That trigger only creates a
 * `profiles` row — not every signup is an owner signup. We only create
 * the owners row when the user has gone through the owner flow.
 */
export async function ensureOwnerRecord(
  businessNameFallback?: string,
  cityFallback?: string,
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  // Already an owner? Return the existing row.
  const { data: existing } = await supabase
    .from("owners")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();
  if (existing) return existing;

  // Pull business_name from auth metadata first; fall back to args.
  // NOTE: city is collected at signup and stored in auth.users.raw_user_meta_data
  // (set via signUp options.data). It is intentionally NOT written to
  // public.owners — that table currently has no `city` column. If we ever need
  // to associate the owner with a primary city, add it via expand-contract
  // migration first, then re-enable here.
  const meta = (user.user_metadata ?? {}) as Record<string, unknown>;

  // Privilege check — block renters from silently escalating to owner. Default
  // missing intent to 'renter' so legacy/no-metadata accounts can't slip
  // through. If a row was created out-of-band (admin grant) the early-return
  // above already covered them.
  const intent =
    typeof meta.intent === "string" ? meta.intent : "renter";
  if (intent !== "owner") {
    throw new Error(
      "This account isn't set up as an owner. Please sign up at /owner/signup to create an owner account.",
    );
  }

  const business_name =
    (typeof meta.business_name === "string" && meta.business_name) ||
    businessNameFallback ||
    "";
  // Reference cityFallback so the caller-passed value isn't a typecheck error.
  // It is intentionally unused on the insert (see note above).
  void cityFallback;

  if (!business_name) {
    throw new Error(
      "Business name is required to create your owner profile. Please complete onboarding.",
    );
  }

  // Bump profile role → owner (best-effort; ignore if table doesn't exist).
  try {
    await supabase.from("profiles").update({ role: "owner" }).eq("id", user.id);
  } catch {
    // ignore — profile sync will catch up next deploy
  }

  // Default tier = self_serve; owner can upgrade later.
  const insertPayload: Record<string, unknown> = {
    id: user.id,
    tier: "self_serve",
    business_name,
    kyc_status: "not_submitted",
    contact_phone: user.phone ?? "",
  };

  const { data, error } = await supabase
    .from("owners")
    .insert(insertPayload)
    .select()
    .single();

  if (error) {
    // Possible race — fetch the row that the other request inserted.
    const { data: raced } = await supabase
      .from("owners")
      .select("*")
      .eq("id", user.id)
      .maybeSingle();
    if (raced) return raced;
    throw error;
  }
  revalidatePath("/owner/dashboard");
  return data;
}

/**
 * Update the chosen tier (full_service / self_serve) on the owner row.
 * Used by the onboarding plan-selection step after `ensureOwnerRecord`.
 */
export async function setOwnerTier(tier: OwnerTier) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { error } = await supabase
    .from("owners")
    .update({ tier })
    .eq("id", user.id);
  if (error) throw error;
  revalidatePath("/owner/dashboard");
  revalidatePath("/owner/profile");
}

/**
 * Update editable owner profile fields. business_name is mirrored into
 * profiles.name so search results show the right display name.
 */
export async function updateOwnerProfile(input: {
  business_name?: string;
  contact_phone?: string;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const payload: Record<string, unknown> = {};
  if (typeof input.business_name === "string") {
    payload.business_name = input.business_name;
  }
  if (typeof input.contact_phone === "string") {
    payload.contact_phone = input.contact_phone;
  }

  if (Object.keys(payload).length === 0) return;

  const { error } = await supabase
    .from("owners")
    .update(payload)
    .eq("id", user.id);
  if (error) throw error;

  if (input.business_name) {
    try {
      await supabase
        .from("profiles")
        .update({ name: input.business_name })
        .eq("id", user.id);
    } catch {
      // ignore — profile mirror is best-effort
    }
  }

  revalidatePath("/owner/profile");
  revalidatePath("/owner/dashboard");
}

/* ============================================================
   Listing lifecycle
   ============================================================ */

export interface ListingFormPayload {
  type: PropertyType;
  title: string;
  city: string;
  area: string;
  description: string;
  landmark?: string;
  gender_pref: GenderPreference;
  wedge_tags: WedgeTag[];
  amenities: string[];
  house_rules: string[];
  room_types: {
    name: string;
    price_per_month: number;
    ac: boolean;
    occupancy: number;
    vacancies: number;
  }[];
  status: ListingStatus;
}

/**
 * Build a URL-safe city-scoped slug. Adds a short random suffix so two
 * listings with the same title in the same city don't collide on the
 * `unique (city, slug)` constraint.
 */
function buildSlug(title: string, area: string): string {
  const base = slugify(`${title} ${area}`);
  // Tiny suffix from crypto.randomUUID() so retries don't loop on conflicts.
  const suffix = (
    globalThis.crypto?.randomUUID?.() ?? Math.random().toString(36).slice(2)
  )
    .replace(/-/g, "")
    .slice(0, 6);
  return base ? `${base}-${suffix}` : suffix;
}

function sumRoom<K extends "vacancies" | "occupancy">(
  rooms: ListingFormPayload["room_types"],
  key: K,
): number {
  return rooms.reduce((s, r) => s + (Number(r[key]) || 0), 0);
}

/**
 * Insert a new listing + its room_types. Owner must exist (RLS requires
 * profiles.role='owner'). Photos are uploaded separately after the
 * listing has an id.
 *
 * On success, redirects to the edit page so the owner can immediately
 * upload photos. The query param `?just_created=1` signals the edit
 * page to show a friendly hint.
 */
export async function createListing(input: ListingFormPayload) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const totalBeds = sumRoom(input.room_types, "occupancy");
  const totalVacancies = sumRoom(input.room_types, "vacancies");

  const { data: listing, error } = await supabase
    .from("listings")
    .insert({
      owner_id: user.id,
      type: input.type,
      title: input.title,
      slug: buildSlug(input.title, input.area),
      description: input.description ?? "",
      city: input.city.toLowerCase(),
      area: input.area,
      landmark: input.landmark ?? null,
      gender_pref: input.gender_pref,
      wedge_tags: input.wedge_tags,
      amenities: input.amenities,
      house_rules: input.house_rules,
      status: input.status,
      total_beds: totalBeds || null,
      total_vacancies: totalVacancies || null,
    })
    .select()
    .single();

  if (error) throw error;

  if (input.room_types.length > 0) {
    const rows = input.room_types
      .filter((rt) => rt.name.trim().length > 0)
      .map((rt) => ({
        listing_id: listing.id,
        name: rt.name,
        price_per_month: Number(rt.price_per_month) || 0,
        ac: !!rt.ac,
        occupancy: Number(rt.occupancy) || 1,
        vacancies: Number(rt.vacancies) || 0,
      }));
    if (rows.length > 0) {
      const { error: rtError } = await supabase.from("room_types").insert(rows);
      if (rtError) throw rtError;
    }
  }

  revalidatePath("/owner/listings");
  revalidatePath("/owner/dashboard");
  redirect(`/owner/listings/${listing.id}/edit?just_created=1`);
}

/**
 * Update an existing listing + replace its room_types. We delete & re-insert
 * room_types in a single transaction-like flow (best-effort without an RPC).
 * RLS scopes the update to owner_id = auth.uid().
 */
export async function updateListing(
  id: string,
  input: ListingFormPayload,
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const totalBeds = sumRoom(input.room_types, "occupancy");
  const totalVacancies = sumRoom(input.room_types, "vacancies");

  const { error } = await supabase
    .from("listings")
    .update({
      type: input.type,
      title: input.title,
      description: input.description ?? "",
      city: input.city.toLowerCase(),
      area: input.area,
      landmark: input.landmark ?? null,
      gender_pref: input.gender_pref,
      wedge_tags: input.wedge_tags,
      amenities: input.amenities,
      house_rules: input.house_rules,
      status: input.status,
      total_beds: totalBeds || null,
      total_vacancies: totalVacancies || null,
    })
    .eq("id", id)
    .eq("owner_id", user.id);
  if (error) throw error;

  // Wipe existing room_types and re-insert. Photos are managed separately.
  const { error: delError } = await supabase
    .from("room_types")
    .delete()
    .eq("listing_id", id);
  if (delError) throw delError;

  if (input.room_types.length > 0) {
    const rows = input.room_types
      .filter((rt) => rt.name.trim().length > 0)
      .map((rt) => ({
        listing_id: id,
        name: rt.name,
        price_per_month: Number(rt.price_per_month) || 0,
        ac: !!rt.ac,
        occupancy: Number(rt.occupancy) || 1,
        vacancies: Number(rt.vacancies) || 0,
      }));
    if (rows.length > 0) {
      const { error: rtError } = await supabase.from("room_types").insert(rows);
      if (rtError) throw rtError;
    }
  }

  revalidatePath("/owner/listings");
  revalidatePath("/owner/dashboard");
  revalidatePath(`/owner/listings/${id}/edit`);
}

export async function pauseListing(id: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { error } = await supabase
    .from("listings")
    .update({ status: "paused" })
    .eq("id", id)
    .eq("owner_id", user.id);
  if (error) throw error;
  revalidatePath("/owner/listings");
  revalidatePath("/owner/dashboard");
}

export async function resumeListing(id: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { error } = await supabase
    .from("listings")
    .update({ status: "live" })
    .eq("id", id)
    .eq("owner_id", user.id);
  if (error) throw error;
  revalidatePath("/owner/listings");
  revalidatePath("/owner/dashboard");
}

export async function deleteListing(id: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { error } = await supabase
    .from("listings")
    .delete()
    .eq("id", id)
    .eq("owner_id", user.id);
  if (error) throw error;
  revalidatePath("/owner/listings");
  revalidatePath("/owner/dashboard");
}
