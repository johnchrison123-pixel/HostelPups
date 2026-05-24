import { createClient as createSupabaseClient } from "@supabase/supabase-js";

/**
 * Anon-only Supabase client without cookie-binding.
 *
 * Use this in server components that need to be statically rendered (ISR).
 * Because it doesn't read cookies, calling this does NOT mark the route as
 * dynamic — pages using it can be cached / regenerated via `export const revalidate`.
 *
 * Loses access to authenticated user context — RLS sees the request as `anon`.
 * Use ONLY for queries against publicly-readable data (e.g. `status='live'` listings).
 *
 * For pages that need the current user's session, use `createClient` from
 * `@/lib/supabase/server` instead — that one reads cookies and forces SSR.
 */
export function createPublicClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: { persistSession: false },
    },
  );
}
