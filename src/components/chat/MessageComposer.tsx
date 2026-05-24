"use client";

import * as React from "react";
import { Send, Loader2 } from "lucide-react";
import { sendMessage } from "@/lib/chat-actions";
import { redactContactInfo } from "@/lib/utils";
import { cn } from "@/lib/utils";
import { RedactionToast } from "./RedactionToast";

interface MessageComposerProps {
  inquiryId: string;
  /** Optional callback fired after a successful send (e.g. scroll thread to bottom). */
  onSent?: () => void;
  /** Optional: disable input (e.g. inquiry closed). */
  disabled?: boolean;
}

const MAX_LENGTH = 5000;

/**
 * Multi-line composer for chat messages.
 *
 * - Enter sends, Shift+Enter inserts a newline.
 * - Auto-resizes textarea up to ~6 lines.
 * - Live runs `redactContactInfo` on every keystroke (cheap — O(N) regex).
 *   If contact info is detected, a RedactionToast appears above the input.
 * - When the user hits send while the toast is showing, they're shown the
 *   "send anyway → message gets redacted" path explicitly. No quiet redaction.
 */
export function MessageComposer({
  inquiryId,
  onSent,
  disabled,
}: MessageComposerProps) {
  const [text, setText] = React.useState("");
  const [sending, setSending] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  /**
   * If true, user has acknowledged the redaction warning and the next
   * `handleSend` will skip showing the toast. Resets on textChange.
   */
  const [bypassWarning, setBypassWarning] = React.useState(false);
  const textareaRef = React.useRef<HTMLTextAreaElement | null>(null);

  // Resize textarea on text change. This is a legitimate effect — we're
  // syncing React state to a DOM property (style.height).
  React.useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 6 * 24)}px`; // 6 lines × 24px
  }, [text]);

  // Derived redaction state — recompute on every render from `text`.
  // Cheap regex pass (sub-millisecond on ≤2KB input).
  const redactionReasons = React.useMemo<string[]>(() => {
    if (!text.trim()) return [];
    const result = redactContactInfo(text);
    return result.hadContact ? result.reasons : [];
  }, [text]);

  const charsLeft = MAX_LENGTH - text.length;
  const hasContact = redactionReasons.length > 0;
  const showToast = hasContact && !bypassWarning;

  async function doSend() {
    const trimmed = text.trim();
    if (!trimmed || sending || disabled) return;
    setSending(true);
    setError(null);
    try {
      await sendMessage({ inquiry_id: inquiryId, content: trimmed });
      setText(""); // also clears the derived redactionReasons
      setBypassWarning(false);
      onSent?.();
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Failed to send message";
      setError(msg);
    } finally {
      setSending(false);
    }
  }

  function handleSendClick() {
    // If we're about to send something with contact info AND the user hasn't
    // explicitly acknowledged the warning, surface the toast first.
    if (hasContact && !bypassWarning) {
      // Just keep the toast showing — user must click one of the two buttons.
      return;
    }
    void doSend();
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (hasContact && !bypassWarning) {
        // Show toast — same handler as send button click
        return;
      }
      void doSend();
    }
  }

  function handleEdit() {
    // Just focus the input — leave text intact for user to fix.
    textareaRef.current?.focus();
  }

  function handleSendAnyway() {
    // User acknowledged the redaction warning — send the (redacted) version.
    setBypassWarning(true);
    void doSend();
  }

  return (
    <div className="bg-[var(--color-bg)] border-t border-[var(--color-border)] p-3 sm:p-4">
      {showToast && (
        <RedactionToast
          reasons={redactionReasons}
          onEdit={handleEdit}
          onSendAnyway={handleSendAnyway}
        />
      )}

      {error && (
        <p
          role="alert"
          className="mb-2 rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-xs text-red-700"
        >
          {error}
        </p>
      )}

      <div className="flex items-end gap-2">
        <div className="flex-1 rounded-2xl border border-[var(--color-border-strong)] bg-[var(--color-bg-elevated)] px-3 py-2 focus-within:border-[var(--color-brand-500)] transition-colors">
          <label htmlFor="chat-composer" className="sr-only">
            Type a message
          </label>
          <textarea
            id="chat-composer"
            ref={textareaRef}
            value={text}
            onChange={(e) => {
              const next = e.target.value.slice(0, MAX_LENGTH);
              setText(next);
              if (bypassWarning) setBypassWarning(false);
            }}
            onKeyDown={handleKeyDown}
            placeholder={
              disabled
                ? "This conversation is closed"
                : "Type a message (Enter to send, Shift+Enter for newline)"
            }
            rows={1}
            disabled={disabled || sending}
            maxLength={MAX_LENGTH}
            className="w-full resize-none bg-transparent text-sm leading-relaxed text-[var(--color-ink)] placeholder:text-[var(--color-ink-subtle)] focus:outline-none disabled:opacity-50"
            aria-describedby="composer-counter"
          />
          <div className="flex items-center justify-between mt-1">
            <p
              id="composer-counter"
              className={cn(
                "text-[10px]",
                charsLeft < 100
                  ? "text-amber-700"
                  : "text-[var(--color-ink-subtle)]",
              )}
            >
              {charsLeft < 500
                ? `${charsLeft} characters left`
                : "Phone, email, UPI, social handles will be hidden"}
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={handleSendClick}
          disabled={!text.trim() || sending || disabled}
          aria-label="Send message"
          className={cn(
            "h-11 w-11 shrink-0 inline-flex items-center justify-center rounded-full transition-colors",
            "bg-[var(--color-brand-500)] text-[var(--color-ink)] hover:bg-[var(--color-brand-600)]",
            "disabled:bg-[var(--color-surface)] disabled:text-[var(--color-ink-subtle)] disabled:cursor-not-allowed",
            "shadow-[var(--shadow-md)]",
          )}
        >
          {sending ? (
            <Loader2 size={18} className="animate-spin" aria-hidden="true" />
          ) : (
            <Send size={18} aria-hidden="true" />
          )}
        </button>
      </div>
    </div>
  );
}
