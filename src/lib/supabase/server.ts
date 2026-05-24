import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

/**
 * Supabase client for server components, server actions, and route handlers.
 *
 * Auth state is read from cookies, so the same session that's active in the
 * browser is available server-side. RLS policies apply normally.
 *
 * Usage in server components:
 *   import { createClient } from "@/lib/supabase/server";
 *   const supabase = await createClient();
 *   const { data } = await supabase.from('listings').select();
 *
 * Note: This function is async because cookies() is async in Next.js 15+.
 */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch {
            // The `setAll` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions (we do — see middleware.ts at repo root).
          }
        },
      },
    },
  );
}

/**
 * Server client using the SERVICE ROLE key.
 * Bypasses RLS. ONLY use in server-side admin operations
 * (webhook handlers, cron jobs, server actions that require elevated perms).
 *
 * NEVER expose this to the browser.
 */
export async function createAdminClient() {
  const cookieStore = await cookies();

  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error(
      "SUPABASE_SERVICE_ROLE_KEY not set. Required for admin operations.",
    );
  }

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll() {
          // Admin client doesn't manage user sessions
        },
      },
    },
  );
}
