"use client";

import { createBrowserClient } from "@supabase/ssr";

/**
 * Supabase client for the browser (client components, "use client" files).
 *
 * Reads NEXT_PUBLIC_SUPABASE_URL + NEXT_PUBLIC_SUPABASE_ANON_KEY from env.
 * These are exposed to the browser by design — the anon key only grants
 * access defined by RLS policies, so it's safe to ship to clients.
 *
 * Usage in client components:
 *   import { createClient } from "@/lib/supabase/client";
 *   const supabase = createClient();
 *   const { data } = await supabase.from('listings').select();
 */
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}
