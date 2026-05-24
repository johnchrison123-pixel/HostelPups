"use client";

import * as React from "react";
import { MessageSquare } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { MessageBubble } from "./MessageBubble";
import { MessageComposer } from "./MessageComposer";
import type { ChatMessage } from "@/lib/chat-queries";

interface MessageThreadProps {
  inquiryId: string;
  /** Server-rendered initial messages — chronological (oldest → newest). */
  initialMessages: ChatMessage[];
  /** auth.users.id of the viewer (used to determine isMe per bubble). */
  currentUserId: string;
  /** Display name of the other participant ("Sunshine PG" or "Rohit Kumar"). */
  counterpartyName: string;
  /** True if the inquiry status is "closed" — disables composer. */
  closed?: boolean;
}

/**
 * Realtime chat thread.
 *
 * - SSR seeds `initialMessages` so the thread is immediately useful with no
 *   client fetch.
 * - Subscribes to Supabase Realtime postgres_changes for INSERTs on
 *   `messages` where inquiry_id = X. Each new message is appended to local
 *   state (deduped by id since the sender's own optimistic-ish path may also
 *   add a row via revalidatePath / refresh).
 * - Auto-scrolls to bottom on mount + whenever a new message arrives.
 */
export function MessageThread({
  inquiryId,
  initialMessages,
  currentUserId,
  counterpartyName,
  closed,
}: MessageThreadProps) {
  // Track which `initialMessages` reference we last seeded from, so a server
  // revalidation (e.g. after sendMessage) can refresh the thread without
  // clobbering optimistic realtime appends.
  const [localExtras, setLocalExtras] = React.useState<ChatMessage[]>([]);
  const scrollRef = React.useRef<HTMLDivElement | null>(null);

  // Merge server-seeded initial messages + any realtime-only appends.
  // Dedupe by message id since revalidatePath may surface the same row a
  // tick after the realtime channel did.
  const messages = React.useMemo<ChatMessage[]>(() => {
    const seen = new Set<string>();
    const out: ChatMessage[] = [];
    for (const m of initialMessages) {
      if (!seen.has(m.id)) {
        seen.add(m.id);
        out.push(m);
      }
    }
    for (const m of localExtras) {
      if (!seen.has(m.id)) {
        seen.add(m.id);
        out.push(m);
      }
    }
    return out;
  }, [initialMessages, localExtras]);

  // Realtime subscription
  React.useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel(`messages:${inquiryId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `inquiry_id=eq.${inquiryId}`,
        },
        (payload) => {
          const newRow = payload.new as ChatMessage;
          setLocalExtras((prev) => {
            if (prev.some((m) => m.id === newRow.id)) return prev;
            return [...prev, newRow];
          });
        },
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [inquiryId]);

  // Auto-scroll on new message
  React.useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }, [messages]);

  return (
    <div className="flex flex-col h-[calc(100vh-12rem)] sm:h-[calc(100vh-14rem)] rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] overflow-hidden">
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-3"
        role="log"
        aria-live="polite"
        aria-label="Conversation messages"
      >
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center px-4 py-8">
            <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--color-brand-100)] text-[var(--color-brand-700)] mb-3">
              <MessageSquare size={20} aria-hidden="true" />
            </div>
            <p className="font-bold text-sm">No messages yet</p>
            <p className="mt-1 text-xs text-[var(--color-ink-muted)] max-w-xs">
              Send the first message to start the conversation with{" "}
              {counterpartyName}. Phone numbers and contact info will be hidden
              automatically.
            </p>
          </div>
        ) : (
          messages.map((m) => (
            <MessageBubble
              key={m.id}
              content={m.content}
              wasRedacted={m.was_redacted}
              isMe={m.sender_id === currentUserId}
              createdAt={m.created_at}
              senderName={
                m.sender_id === currentUserId ? "You" : counterpartyName
              }
            />
          ))
        )}
      </div>

      <MessageComposer
        inquiryId={inquiryId}
        disabled={closed}
        onSent={() => {
          // Best-effort scroll — realtime INSERT will also trigger scroll
          const el = scrollRef.current;
          if (el) el.scrollTop = el.scrollHeight;
        }}
      />
    </div>
  );
}
