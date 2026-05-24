"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

/* ============================================================
   Renter (non-owner) user actions
   Mirrors owner-actions.ts but scoped to plain `user` profile rows.
   ============================================================ */

/**
 * Toggle a listing in the current user's favorites.
 *
 * - If a favorites row already exists for (user_id, listing_id), delete it
 *   and return { favorited: false }.
 * - Otherwise insert one and return { favorited: true }.
 *
 * RLS policy `favorites_all_own` (supabase/migrations/0002_rls_policies.sql)
 * already restricts every operation to `auth.uid()`, so we don't need to
 * pass user_id explicitly — Supabase fills it in via the policy's USING
 * clause for selects, and via the WITH CHECK clause for inserts. We still
 * pass it for clarity.
 *
 * Forward-compatible: if the favorites table doesn't exist yet (e.g.
 * migrations not applied), the function throws so the client can surface
 * a sensible error in the UI.
 */
export async function toggleFavorite(
  listing_id: string,
): Promise<{ favorited: boolean }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  // Check if a row already exists.
  const { data: existing } = await supabase
    .from("favorites")
    .select("listing_id")
    .eq("user_id", user.id)
    .eq("listing_id", listing_id)
    .maybeSingle();

  if (existing) {
    const { error } = await supabase
      .from("favorites")
      .delete()
      .eq("user_id", user.id)
      .eq("listing_id", listing_id);
    if (error) throw error;
    revalidatePath("/saved");
    return { favorited: false };
  }

  const { error } = await supabase
    .from("favorites")
    .insert({ user_id: user.id, listing_id });
  if (error) throw error;
  revalidatePath("/saved");
  return { favorited: true };
}

/**
 * Update editable fields on the current user's profile row.
 * Used by /profile to let renters edit name + phone.
 *
 * The `profiles` row is auto-created by the on_auth_user_created trigger,
 * so we always have a row to UPDATE. RLS scopes the update to id = auth.uid().
 */
export async function updateUserProfile(input: {
  name?: string;
  phone?: string;
}): Promise<void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const payload: Record<string, unknown> = {};
  if (typeof input.name === "string") {
    const trimmed = input.name.trim();
    if (trimmed.length < 2) throw new Error("Name must be at least 2 characters");
    payload.name = trimmed;
  }
  if (typeof input.phone === "string") {
    payload.phone = input.phone.trim();
  }

  if (Object.keys(payload).length === 0) return;

  const { error } = await supabase
    .from("profiles")
    .update(payload)
    .eq("id", user.id);
  if (error) throw error;

  revalidatePath("/profile");
}
