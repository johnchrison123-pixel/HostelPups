"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { MessageSquare, X, Loader2, ShieldCheck } from "lucide-react";
import { createInquiry } from "@/lib/chat-actions";
import { redactContactInfo } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { RedactionToast } from "./RedactionToast";

interface InquiryStartButtonProps {
  listingId: string;
  listingTitle: string;
  ownerName: string;
  userIsAuthed: boolean;
  /** Where to send the user if they're not signed in. */
  loginNext: string;
}

/**
 * "Send inquiry message" button rendered on the listing detail page.
 *
 * - If user NOT authed → routes to /login?next=<this listing page>.
 * - If user IS authed → opens a modal asking them to type their first message.
 *   On submit: calls `createInquiry({ listing_id, first_message })` → routes
 *   to `/messages/<inquiry_id>` so the chat opens immediately.
 *
 * The first message is passed through `redactContactInfo()` server-side
 * before being saved (see chat-actions.ts).
 */
export function InquiryStartButton({
  listingId,
  listingTitle,
  ownerName,
  userIsAuthed,
  loginNext,
}: InquiryStartButtonProps) {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [text, setText] = React.useState("");
  const [submitting, setSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [bypassWarning, setBypassWarning] = React.useState(false);
  const textareaRef = React.useRef<HTMLTextAreaElement | null>(null);

  const placeholder = `Hi ${ownerName}, I'm interested in ${listingTitle}. Is the room still available?`;

  // Derived redaction state — recomputed on every render from text.
  // Cheap (O(N) regex over ≤2KB input) so useMemo is sufficient; avoids the
  // setState-in-effect anti-pattern.
  const redactionReasons = React.useMemo<string[]>(() => {
    if (!text.trim()) return [];
    const res = redactContactInfo(text);
    return res.hadContact ? res.reasons : [];
  }, [text]);

  function openModal() {
    setOpen(true);
    // Focus textarea after open animation
    setTimeout(() => textareaRef.current?.focus(), 50);
  }

  function closeModal() {
    if (submitting) return;
    setOpen(false);
    setText("");
    setError(null);
    setBypassWarning(false);
    // redactionReasons is derived from text — clearing text clears it.
  }

  async function doSubmit() {
    setError(null);
    setSubmitting(true);
    try {
      const result = await createInquiry({
        listing_id: listingId,
        first_message: text.trim() || placeholder,
      });
      // Use replace so the user can't hit Back into the modal-open state
      router.replace(`/messages/${result.inquiry_id}`);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Failed to send inquiry";
      setError(msg);
      setSubmitting(false);
    }
  }

  function handleSubmit() {
    if (submitting) return;
    if (redactionReasons.length > 0 && !bypassWarning) {
      // toast already showing; user must use one of its buttons.
      return;
    }
    void doSubmit();
  }

  // If user is not signed in, render a plain link Button (server-friendly).
  if (!userIsAuthed) {
    return (
      <Button
        href={`/login?next=${encodeURIComponent(loginNext)}`}
        variant="outline"
        fullWidth
        className="mt-3"
      >
        Send inquiry message
      </Button>
    );
  }

  const hasContact = redactionReasons.length > 0;
  const showToast = hasContact && !bypassWarning;

  return (
    <>
      <Button
        onClick={openModal}
        variant="outline"
        fullWidth
        className="mt-3"
      >
        <MessageSquare size={16} aria-hidden="true" />
        Send inquiry message
      </Button>

      {open && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="inquiry-dialog-title"
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
        >
          {/* Backdrop */}
          <button
            type="button"
            onClick={closeModal}
            aria-label="Close inquiry form"
            className="absolute inset-0 bg-black/50 backdrop-blur-sm cursor-default"
            disabled={submitting}
          />

          {/* Modal */}
          <div className="relative w-full sm:max-w-md bg-[var(--color-bg-elevated)] rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden border border-[var(--color-border)]">
            <div className="px-5 pt-5 pb-3 border-b border-[var(--color-border)] flex items-start justify-between gap-3">
              <div className="min-w-0">
                <h3
                  id="inquiry-dialog-title"
                  className="text-lg font-black tracking-tight"
                >
                  Send first message
                </h3>
                <p className="mt-0.5 text-xs text-[var(--color-ink-muted)]">
                  to {ownerName} · {listingTitle}
                </p>
              </div>
              <button
                type="button"
                onClick={closeModal}
                disabled={submitting}
                aria-label="Close"
                className="h-9 w-9 shrink-0 inline-flex items-center justify-center rounded-full hover:bg-[var(--color-surface)] transition-colors"
              >
                <X size={18} aria-hidden="true" />
              </button>
            </div>

            <div className="p-5 space-y-3">
              <div className="rounded-xl bg-[var(--color-brand-50)] border border-[var(--color-brand-200)] p-3 flex items-start gap-2 text-xs text-[var(--color-ink)]">
                <ShieldCheck
                  size={14}
                  className="text-emerald-600 mt-0.5 shrink-0"
                  aria-hidden="true"
                />
                <p>
                  Your message stays on HostelPups. Phone numbers, emails, and
                  UPI IDs are hidden in both directions to keep you safe.
                </p>
              </div>

              {showToast && (
                <RedactionToast
                  reasons={redactionReasons}
                  onEdit={() => textareaRef.current?.focus()}
                  onSendAnyway={() => {
                    setBypassWarning(true);
                    void doSubmit();
                  }}
                />
              )}

              {error && (
                <p
                  role="alert"
                  className="rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-xs text-red-700"
                >
                  {error}
                </p>
              )}

              <div>
                <label
                  htmlFor="inquiry-first-message"
                  className="text-xs font-bold text-[var(--color-ink-muted)] uppercase tracking-wide"
                >
                  Your message
                </label>
                <textarea
                  id="inquiry-first-message"
                  ref={textareaRef}
                  value={text}
                  onChange={(e) => {
                    setText(e.target.value.slice(0, 2000));
                    if (bypassWarning) setBypassWarning(false);
                  }}
                  rows={4}
                  placeholder={placeholder}
                  maxLength={2000}
                  disabled={submitting}
                  className="mt-1.5 w-full resize-none rounded-xl border border-[var(--color-border-strong)] bg-[var(--color-bg)] px-3 py-2.5 text-sm leading-relaxed text-[var(--color-ink)] placeholder:text-[var(--color-ink-subtle)] focus:outline-none focus:border-[var(--color-brand-500)] disabled:opacity-50"
                />
                <p className="mt-1 text-[10px] text-[var(--color-ink-subtle)]">
                  Leave blank to send the suggested message.
                </p>
              </div>
            </div>

            <div className="px-5 pb-5 pt-2 flex flex-col-reverse sm:flex-row sm:items-center sm:justify-end gap-2">
              <button
                type="button"
                onClick={closeModal}
                disabled={submitting}
                className="inline-flex h-11 items-center justify-center rounded-full border border-[var(--color-border-strong)] px-5 text-sm font-bold text-[var(--color-ink)] hover:bg-[var(--color-surface)] transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSubmit}
                disabled={submitting || (hasContact && !bypassWarning)}
                className="inline-flex h-11 items-center justify-center gap-2 rounded-full bg-[var(--color-brand-500)] px-5 text-sm font-bold text-[var(--color-ink)] hover:bg-[var(--color-brand-600)] shadow-[var(--shadow-md)] transition-colors disabled:bg-[var(--color-surface)] disabled:text-[var(--color-ink-subtle)] disabled:cursor-not-allowed disabled:shadow-none"
              >
                {submitting && (
                  <Loader2 size={16} className="animate-spin" aria-hidden="true" />
                )}
                {submitting ? "Sending…" : "Send message"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
