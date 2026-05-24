"use client";

import * as React from "react";
import { ShieldAlert } from "lucide-react";

interface RedactionToastProps {
  /** Categories that fired (returned by redactContactInfo). */
  reasons: string[];
  /** Called when user clicks "Edit message" → focus textarea, do nothing else. */
  onEdit: () => void;
  /** Called when user clicks "Send anyway" → send the redacted version. */
  onSendAnyway: () => void;
}

/**
 * Inline warning shown above the composer when `redactContactInfo` would
 * catch contact info in the user's current draft.
 *
 * Goal: be clear and friendly, never punitive. The user is informed that
 * HostelPups will hide the contact, given a choice to edit or send anyway,
 * and made aware that repeated attempts are tracked.
 */
export function RedactionToast({
  reasons,
  onEdit,
  onSendAnyway,
}: RedactionToastProps) {
  // Pretty-print categories that fired
  const categoryLabels: Record<string, string> = {
    email: "email",
    email_obfuscated: "email",
    upi: "UPI handle",
    upi_generic: "UPI handle",
    whatsapp_link: "WhatsApp link",
    telegram_link: "Telegram link",
    instagram_link: "Instagram link",
    snapchat_link: "Snapchat link",
    facebook_link: "Facebook link",
    social_handle_digits: "social handle",
    phone_indian: "phone number",
    phone_long_run: "phone number",
    phone_with_intent: "phone number",
    phone_heavy_sep: "phone number",
    word_digit_obfuscation: "phone number",
    phrase: "contact phrase",
  };

  const detectedTypes = Array.from(
    new Set(reasons.map((r) => categoryLabels[r] ?? r)),
  );

  return (
    <div
      role="alert"
      className="rounded-xl border border-amber-300 bg-amber-50 p-3 sm:p-4 mb-2 shadow-[var(--shadow-sm)]"
    >
      <div className="flex items-start gap-2.5">
        <ShieldAlert
          size={18}
          className="text-amber-700 mt-0.5 shrink-0"
          aria-hidden="true"
        />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-amber-900">
            This looks like contact info
          </p>
          <p className="mt-1 text-xs text-amber-800 leading-relaxed">
            HostelPups will hide{" "}
            {detectedTypes.length > 0
              ? detectedTypes.slice(0, 3).join(", ")
              : "contact details"}{" "}
            in this message. Sharing phone numbers, emails, UPI IDs, or social
            handles outside our chat is against our terms — repeated attempts
            may suspend your account.
          </p>
          <div className="mt-2.5 flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={onEdit}
              className="inline-flex h-8 items-center rounded-full border border-amber-400 bg-white px-3 text-xs font-bold text-amber-900 hover:bg-amber-100 transition-colors"
            >
              Edit message
            </button>
            <button
              type="button"
              onClick={onSendAnyway}
              className="inline-flex h-8 items-center rounded-full bg-amber-700 px-3 text-xs font-bold text-white hover:bg-amber-800 transition-colors"
            >
              Send anyway (redacted)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
