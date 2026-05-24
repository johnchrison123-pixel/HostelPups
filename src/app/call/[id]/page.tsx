import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { buildMetadata } from "@/lib/seo";
import { getCallById } from "@/lib/call-queries";
import { getCurrentUser } from "@/lib/auth";
import { InCallScreen, type CallRole } from "@/components/call/InCallScreen";

/**
 * Active-call full-screen page.
 *
 * Server component — fetches the call row (RLS-scoped) + the current user,
 * then hands off to the client InCallScreen which owns the WebRTC peer
 * connection and the signaling channel.
 *
 * URL: /call/{id}?role=caller|callee
 *   - When the URL is missing or invalid `?role`, we infer from the row.
 */

export const metadata: Metadata = buildMetadata({
  title: "Call",
  description: "Live voice call on HostelPups.",
  path: "/call",
  noindex: true,
});

type Props = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ role?: string }>;
};

export default async function CallPage({ params, searchParams }: Props) {
  const { id } = await params;
  const { role: roleParam } = await searchParams;

  const user = await getCurrentUser();
  if (!user) {
    redirect(`/login?next=${encodeURIComponent(`/call/${id}`)}`);
  }

  const call = await getCallById(id);
  if (!call) notFound();

  // Determine role from query string, falling back to row identity.
  let role: CallRole;
  if (roleParam === "caller" && call.caller_id === user.id) role = "caller";
  else if (roleParam === "callee" && call.callee_id === user.id) role = "callee";
  else if (call.caller_id === user.id) role = "caller";
  else if (call.callee_id === user.id) role = "callee";
  else notFound();

  return <InCallScreen call={call} role={role} myUserId={user.id} />;
}
