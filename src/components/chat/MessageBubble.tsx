import * as React from "react";
import { ShieldAlert } from "lucide-react";
import { cn } from "@/lib/utils";

interface MessageBubbleProps {
  /** The (already-redacted) message body. */
  content: string;
  /** True when this message was redacted by redactContactInfo. */
  wasRedacted: boolean;
  /** True when the current user is the sender → align right + brand styling. */
  isMe: boolean;
  /** ISO timestamp string. */
  createdAt: string;
  /** Sender display name for screen readers + small label above bubble. */
  senderName: string;
}

/**
 * Single chat message bubble.
 *
 * - Mine (sent): right-aligned, brand-yellow background, ink text.
 * - Theirs (received): left-aligned, surface background, ink text.
 * - was_redacted=true: small shield row appended inside the bubble.
 *
 * Server component — no client state needed. The thread is rerendered when
 * MessageThread receives a realtime INSERT or the page is revalidated.
 */
export function MessageBubble({
  content,
  wasRedacted,
  isMe,
  createdAt,
  senderName,
}: MessageBubbleProps) {
  // Friendly timestamp (HH:MM in user's locale)
  const time = new Date(createdAt).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div
      className={cn("flex w-full", isMe ? "justify-end" : "justify-start")}
      aria-label={
        isMe ? `You sent: ${content}` : `${senderName} sent: ${content}`
      }
    >
      <div
        className={cn(
          "max-w-[78%] sm:max-w-[68%] rounded-2xl px-4 py-2.5 shadow-[var(--shadow-sm)]",
          isMe
            ? "bg-[var(--color-brand-500)] text-[var(--color-ink)] rounded-tr-sm"
            : "bg-[var(--color-bg-elevated)] text-[var(--color-ink)] border border-[var(--color-border)] rounded-tl-sm",
        )}
      >
        {/* Sender mini-label on received messages only */}
        {!isMe && (
          <p className="text-[10px] font-bold uppercase tracking-wide text-[var(--color-ink-subtle)] mb-0.5">
            {senderName}
          </p>
        )}

        <p
          className="text-sm leading-relaxed whitespace-pre-wrap break-words"
          // intentionally not dangerouslySetInnerHTML — content already safe text
        >
          {content}
        </p>

        {wasRedacted && (
          <div
            className={cn(
              "mt-1.5 flex items-center gap-1 text-[10px] font-medium",
              isMe
                ? "text-[var(--color-brand-900)]/80"
                : "text-amber-700",
            )}
            role="note"
          >
            <ShieldAlert size={11} aria-hidden="true" />
            <span>Contact details hidden by HostelPups</span>
          </div>
        )}

        <p
          className={cn(
            "mt-1 text-[10px]",
            isMe
              ? "text-[var(--color-brand-900)]/70 text-right"
              : "text-[var(--color-ink-subtle)]",
          )}
        >
          <time dateTime={createdAt}>{time}</time>
        </p>
      </div>
    </div>
  );
}
