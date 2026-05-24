/**
 * Backward-compatibility re-export. Prefer the new split clients:
 *   - Server components: `import { createClient } from "@/lib/supabase/server"`
 *   - Client components: `import { createClient } from "@/lib/supabase/client"`
 *
 * The `sb` export below is kept for legacy code that imported it directly.
 * It creates a browser client — DO NOT use from a server component or you'll
 * get stale auth state. Migrate to the split clients above when refactoring.
 */
export { createClient } from "./supabase/client";
import { createClient } from "./supabase/client";

// Legacy default browser client (lazy-initialized to avoid SSR issues)
let _sb: ReturnType<typeof createClient> | null = null;
function getSb() {
  if (typeof window === "undefined") {
    throw new Error(
      "`sb` is the browser-only legacy export. Use createClient() from @/lib/supabase/server for server components.",
    );
  }
  if (!_sb) _sb = createClient();
  return _sb;
}

export const sb = new Proxy({} as ReturnType<typeof createClient>, {
  get(_t, p) {
    return Reflect.get(getSb(), p);
  },
});
