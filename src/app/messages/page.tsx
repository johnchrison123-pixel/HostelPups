import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { ShieldCheck } from "lucide-react";
import { Container } from "@/components/ui/Container";
import { ConversationList } from "@/components/chat/ConversationList";
import { ConversationListWithRealtime } from "@/components/chat/ConversationListWithRealtime";
import { buildMetadata } from "@/lib/seo";
import { getCurrentUser } from "@/lib/auth";
import { getMyConversations } from "@/lib/chat-queries";

export const metadata: Metadata = buildMetadata({
  title: "Messages",
  description:
    "Your conversations with HostelPups verified PG owners. Contact details stay protected — phone numbers and emails are hidden in both directions.",
  path: "/messages",
  noindex: true,
});

export default async function MessagesPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login?next=/messages");
  }

  const { asRenter, asOwner } = await getMyConversations();
  const inquiryIds = [
    ...asRenter.map((c) => c.id),
    ...asOwner.map((c) => c.id),
  ];

  return (
    <Container size="md" className="py-6 sm:py-10">
      <header className="mb-5 sm:mb-7">
        <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
          Messages
        </h1>
        <p className="mt-1 text-sm text-[var(--color-ink-muted)]">
          Your conversations with PG owners (and renters, if you list a
          property).
        </p>
      </header>

      <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-3 sm:p-4 mb-6 flex items-start gap-2.5 text-xs sm:text-sm">
        <ShieldCheck
          size={16}
          className="text-emerald-600 mt-0.5 shrink-0"
          aria-hidden="true"
        />
        <p className="text-[var(--color-ink-muted)]">
          <span className="font-semibold text-[var(--color-ink)]">
            Phone numbers, emails and UPI IDs are hidden by HostelPups
          </span>{" "}
          — owners can&apos;t share contact details in chat (and you
          can&apos;t either). It keeps brokers out and your deposit safe.
        </p>
      </div>

      <ConversationListWithRealtime inquiryIds={inquiryIds}>
        <ConversationList asRenter={asRenter} asOwner={asOwner} />
      </ConversationListWithRealtime>
    </Container>
  );
}
