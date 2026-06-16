import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export interface AdminPrincipal {
  id: string;
  email: string | null;
  name: string | null;
  role: "admin";
}

/**
 * Guard used by every `/admin/**` server component and server action.
 *
 * - Not signed in           → redirect to `/login?next=...`
 * - Signed in but not admin → redirect to `/` (don't 404 — that would
 *                              leak the existence of the admin area to
 *                              regular users who guess the URL)
 * - Banned (is_banned=true) → redirect to `/login?banned=1` after sign-out
 *
 * Returns the admin's profile so callers don't need a second fetch.
 */
export async function requireAdmin(nextPath = "/admin"): Promise<AdminPrincipal> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect(`/login?next=${encodeURIComponent(nextPath)}`);
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, email, name, role, is_banned")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile) {
    // No profile row — treat as logged-out
    redirect(`/login?next=${encodeURIComponent(nextPath)}`);
  }

  if (profile.is_banned) {
    await supabase.auth.signOut();
    redirect("/login?banned=1");
  }

  if (profile.role !== "admin") {
    redirect("/");
  }

  return {
    id: profile.id,
    email: profile.email ?? null,
    name: profile.name ?? null,
    role: "admin",
  };
}

/**
 * Non-redirecting check — returns the admin or null.
 * Use in places where you want to *conditionally* render admin tools
 * inside a regular page (e.g. an "Open in admin" button on a public listing).
 */
export async function getCurrentAdmin(): Promise<AdminPrincipal | null> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return null;
    const { data: profile } = await supabase
      .from("profiles")
      .select("id, email, name, role, is_banned")
      .eq("id", user.id)
      .maybeSingle();
    if (!profile || profile.is_banned || profile.role !== "admin") return null;
    return {
      id: profile.id,
      email: profile.email ?? null,
      name: profile.name ?? null,
      role: "admin",
    };
  } catch {
    return null;
  }
}
