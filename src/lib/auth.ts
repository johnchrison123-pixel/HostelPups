import { createClient } from "@/lib/supabase/server";

/**
 * Shared auth helpers — server-side only.
 *
 * These read the session from cookies via the SSR Supabase client.
 * For client-side auth state, use createClient() from "@/lib/supabase/client"
 * directly inside "use client" components.
 */

/**
 * Returns the currently authenticated Supabase user, or null.
 *
 * Safe to call from any server component / server action / route handler.
 * Uses getUser() (not getSession()) so the token is validated against
 * Supabase's auth server — never trust getSession() server-side.
 */
export async function getCurrentUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

/**
 * Returns the public.profiles row for the current user, or null.
 *
 * The profile row is auto-created by the on_auth_user_created DB trigger when
 * a user first authenticates via magic link, so this should generally return
 * a row for any signed-in user.
 *
 * Gracefully handles the case where the profiles table doesn't exist yet
 * (Expand-Contract migration pattern — see CLAUDE.md).
 */
export async function getCurrentProfile() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  try {
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .maybeSingle();
    if (error) return null;
    return data;
  } catch {
    return null;
  }
}

/**
 * Returns true if the current user has role='owner' in public.profiles.
 * Returns false if not signed in, no profile row, or role is anything else.
 */
export async function isOwner() {
  const profile = await getCurrentProfile();
  return profile?.role === "owner";
}
