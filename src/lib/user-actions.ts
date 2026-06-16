"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { normalisePhoneInput } from "@/lib/utils";

/* ============================================================
   Renter (non-owner) user actions
   Mirrors owner-actions.ts but scoped to plain `user` profile rows.
   ============================================================ */

/**
 * Toggle a listing in the current user's favorites.
 *
 * Now idempotent — the caller passes the desired final state via
 * `favorited` and the server enforces it. This eliminates the TOCTOU race
 * (M1) where a fast double-click could land both halves of the
 * SELECT-then-MUTATE dance on the same prior state and end up flipping
 * the heart back to its original value.
 *
 * - `favorited === true`  → upsert with ignoreDuplicates so the row is
 *   guaranteed to exist after this call. No-op if it already exists.
 * - `favorited === false` → DELETE by composite key; no-op if no row exists.
 *
 * Backwards compatible: callers that still invoke `toggleFavorite(id)` with
 * no explicit desired state fall back to the old read-then-flip behaviour
 * (still TOCTOU-prone, but the new signature lets caller code converge to
 * the idempotent form over time).
 *
 * RLS policy `favorites_all_own` (supabase/migrations/0002_rls_policies.sql)
 * restricts every operation to `auth.uid()` already, so we pass user_id for
 * clarity rather than for security.
 */
export async function toggleFavorite(
  listing_id: string,
  desired?: boolean,
): Promise<{ favorited: boolean }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  // Resolve the desired final state. If the caller didn't pass one, fall back
  // to a read — slightly racier but matches legacy callsites.
  let favorited: boolean;
  if (typeof desired === "boolean") {
    favorited = desired;
  } else {
    const { data: existing } = await supabase
      .from("favorites")
      .select("listing_id")
      .eq("user_id", user.id)
      .eq("listing_id", listing_id)
      .maybeSingle();
    favorited = !existing;
  }

  if (favorited) {
    // Idempotent "save" — upsert on the composite PK so a concurrent caller
    // doesn't 23505 us. If a row exists, this is a no-op (ignoreDuplicates).
    const { error } = await supabase
      .from("favorites")
      .upsert(
        { user_id: user.id, listing_id },
        { onConflict: "user_id,listing_id", ignoreDuplicates: true },
      );
    if (error) throw error;
    revalidatePath("/saved");
    return { favorited: true };
  }

  // Idempotent "unsave" — DELETE by composite key is a no-op when no row.
  const { error } = await supabase
    .from("favorites")
    .delete()
    .eq("user_id", user.id)
    .eq("listing_id", listing_id);
  if (error) throw error;
  revalidatePath("/saved");
  return { favorited: false };
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
    // C2 — normalize to canonical `+91XXXXXXXXXX` so future logins via the
    // phone-to-email lookup (findEmailByPhone) keep working. If we wrote a
    // raw 10-digit string here, the next phone-login attempt would never
    // match: that lookup keys on the `+91`-prefixed form.
    const raw = input.phone.trim();
    if (raw.length === 0) {
      // Allow clearing the phone (the field is optional on
      // UserProfileForm). Setting to null wipes the value.
      payload.phone = null;
    } else {
      const normalised = normalisePhoneInput(raw);
      if (!normalised) {
        throw new Error(
          "Phone must be a 10-digit Indian mobile starting with 6, 7, 8, or 9.",
        );
      }
      payload.phone = normalised;
    }
  }

  if (Object.keys(payload).length === 0) return;

  const { error } = await supabase
    .from("profiles")
    .update(payload)
    .eq("id", user.id);
  if (error) throw error;

  revalidatePath("/profile");
}
