import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { buildMetadata } from "@/lib/seo";

export const dynamic = "force-dynamic";

export const metadata: Metadata = buildMetadata({
  title: "Whoami debug",
  description: "Temporary debug page.",
  path: "/whoami",
  noindex: true,
});

export default async function WhoamiPage() {
  const supabase = await createClient();

  const userRes = await supabase.auth.getUser();
  const userId = userRes.data?.user?.id ?? null;
  const userEmail = userRes.data?.user?.email ?? null;
  const userErr = userRes.error?.message ?? null;

  let profile: Record<string, unknown> | null = null;
  let profileErr: string | null = null;
  if (userId) {
    const r = await supabase
      .from("profiles")
      .select("id, email, role, is_banned, name, created_at")
      .eq("id", userId)
      .maybeSingle();
    profile = r.data as Record<string, unknown> | null;
    profileErr = r.error?.message ?? null;
  }

  let isAdmin: boolean | null = null;
  let isAdminErr: string | null = null;
  if (userId) {
    const r = await supabase.rpc("is_admin");
    isAdmin = (r.data as boolean | null) ?? null;
    isAdminErr = r.error?.message ?? null;
  }

  // Also query by email pattern in case the auth.users id mismatches profile id
  let profileByEmail: Record<string, unknown> | null = null;
  if (userEmail) {
    const r = await supabase
      .from("profiles")
      .select("id, email, role")
      .eq("email", userEmail)
      .maybeSingle();
    profileByEmail = r.data as Record<string, unknown> | null;
  }

  return (
    <main className="mx-auto max-w-2xl p-6 font-mono text-sm">
      <h1 className="text-xl font-black mb-4">Whoami debug</h1>

      <section className="mb-4">
        <h2 className="font-bold mb-1">auth.getUser()</h2>
        <pre className="rounded bg-gray-100 p-3 text-xs overflow-x-auto">
          {JSON.stringify(
            { userId, userEmail, error: userErr },
            null,
            2,
          )}
        </pre>
      </section>

      <section className="mb-4">
        <h2 className="font-bold mb-1">profiles row (by id = auth.uid)</h2>
        <pre className="rounded bg-gray-100 p-3 text-xs overflow-x-auto">
          {JSON.stringify({ profile, error: profileErr }, null, 2)}
        </pre>
      </section>

      <section className="mb-4">
        <h2 className="font-bold mb-1">profiles row (by email)</h2>
        <pre className="rounded bg-gray-100 p-3 text-xs overflow-x-auto">
          {JSON.stringify({ profileByEmail }, null, 2)}
        </pre>
      </section>

      <section className="mb-4">
        <h2 className="font-bold mb-1">public.is_admin() RPC</h2>
        <pre className="rounded bg-gray-100 p-3 text-xs overflow-x-auto">
          {JSON.stringify({ isAdmin, error: isAdminErr }, null, 2)}
        </pre>
      </section>

      <p className="text-xs text-gray-500 mt-6">
        Diagnostic page — remove after debugging.
      </p>
    </main>
  );
}
