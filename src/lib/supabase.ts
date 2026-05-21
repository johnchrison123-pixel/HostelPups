import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * Shared Supabase client. Import `sb` from this file — never call createClient
 * directly elsewhere in the codebase.
 *
 * Environment variables required (set in .env.local):
 *   NEXT_PUBLIC_SUPABASE_URL
 *   NEXT_PUBLIC_SUPABASE_ANON_KEY
 *
 * Schema is defined in Phase 1 — until then, this client is exported but
 * not used at runtime.
 */

const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL ?? "https://placeholder.supabase.co";
const supabaseAnonKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "placeholder-anon-key";

let _sb: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient {
  if (!_sb) {
    _sb = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    });
  }
  return _sb;
}

// Convenience export — matches RingIn's `sb` naming
export const sb = getSupabase();
