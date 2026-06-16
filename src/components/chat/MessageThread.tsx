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
  // `localExtras` holds realtime-driven INSERTs not yet reflected in
  // `initialMessages`; `localUpdates` holds id→patch for UPDATE events;
  // `localDeletes` holds tombstoned ids from DELETE events.
  const [localExtras, setLocalExtras] = React.useState<ChatMessage[]>([]);
  const [localUpdates, setLocalUpdates] = React.useState<
    Record<string, ChatMessage>
  >({});
  const [localDeletes, setLocalDeletes] = React.useState<Set<string>>(
    () => new Set(),
  );
  const scrollRef = React.useRef<HTMLDivElement | null>(null);

  // Merge server-seeded initial messages + any realtime-only appends.
  // Dedupe by message id since revalidatePath may surface the same row a
  // tick after the realtime channel did. After dedupe we explicitly sort
  // by created_at ASC so a burst of realtime INSERTs (which can arrive in
  // any order under network jitter) renders in true chronological order.
  // — H5 fix.
  const messages = React.useMemo<ChatMessage[]>(() => {
    const seen = new Set<string>();
    const out: ChatMessage[] = [];
    const merge = (m: ChatMessage) => {
      if (seen.has(m.id) || localDeletes.has(m.id)) return;
      seen.add(m.id);
      const patched = localUpdates[m.id];
      out.push(patched ? { ...m, ...patched } : m);
    };
    for (const m of initialMessages) merge(m);
    for (const m of localExtras) merge(m);
    out.sort((a, b) => {
      // ISO-8601 strings sort lexicographically the same as chronologically,
      // but be defensive and parse anyway.
      const ta = Date.parse(a.created_at);
      const tb = Date.parse(b.created_at);
      if (Number.isNaN(ta) || Number.isNaN(tb)) {
        return a.created_at.localeCompare(b.created_at);
      }
      return ta - tb;
    });
    return out;
  }, [initialMessages, localExtras, localUpdates, localDeletes]);

  // Realtime subscription: INSERT (append), UPDATE (patch), DELETE (tombstone).
  // — H4 fix.
  React.useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel(`messages:${inquiryId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "messages",
          filter: `inquiry_id=eq.${inquiryId}`,
        },
        (payload) => {
          if (payload.eventType === "INSERT") {
            const newRow = payload.new as ChatMessage;
            setLocalExtras((prev) => {
              if (prev.some((m) => m.id === newRow.id)) return prev;
              return [...prev, newRow];
            });
          } else if (payload.eventType === "UPDATE") {
            const newRow = payload.new as ChatMessage;
            setLocalExtras((prev) =>
              prev.map((m) => (m.id === newRow.id ? newRow : m)),
            );
            setLocalUpdates((prev) => ({ ...prev, [newRow.id]: newRow }));
          } else if (payload.eventType === "DELETE") {
            const oldRow = payload.old as Partial<ChatMessage> | null;
            const id = oldRow?.id;
            if (!id) return;
            setLocalExtras((prev) => prev.filter((m) => m.id !== id));
            setLocalDeletes((prev) => {
              if (prev.has(id)) return prev;
              const next = new Set(prev);
              next.add(id);
              return next;
            });
          }
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
    <div className="flex flex-col h-[calc(100dvh-12rem)] sm:h-[calc(100dvh-14rem)] rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] overflow-hidden">
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
