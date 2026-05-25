"use client";

import * as React from "react";
import { Share2, Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface ShareButtonProps {
  /** Title used as the shared payload's title (Web Share API). */
  title: string;
  /**
   * Optional description for the share payload. Falls back to a generic one.
   */
  text?: string;
  /**
   * Optional URL to share. If omitted we use the current page URL at click time.
   */
  url?: string;
  /** Forwarded to <button> for positional styling on top of card images. */
  className?: string;
  /** Optional icon size — defaults to 16. */
  iconSize?: number;
}

/**
 * Share button used on the listing-detail hero.
 *
 * Behaviour:
 *  - If `navigator.share` is available (mobile + some desktops), invoke it.
 *  - Otherwise fall back to copying the URL to clipboard, with a visual
 *    confirmation that swaps the icon to a checkmark for ~1.5s.
 */
export function ShareButton({
  title,
  text,
  url,
  className,
  iconSize = 16,
}: ShareButtonProps) {
  const [copied, setCopied] = React.useState(false);

  async function handleClick(e: React.MouseEvent<HTMLButtonElement>) {
    e.preventDefault();
    e.stopPropagation();

    const shareUrl =
      url ?? (typeof window !== "undefined" ? window.location.href : "");
    const shareText = text ?? `Check out ${title} on HostelPups.`;

    // Prefer the native share sheet when available.
    if (typeof navigator !== "undefined" && typeof navigator.share === "function") {
      try {
        await navigator.share({ title, text: shareText, url: shareUrl });
        return;
      } catch {
        // User cancelled or share failed — fall through to clipboard.
      }
    }

    // Fallback: copy URL to clipboard.
    try {
      if (typeof navigator !== "undefined" && navigator.clipboard) {
        await navigator.clipboard.writeText(shareUrl);
        setCopied(true);
        window.setTimeout(() => setCopied(false), 1500);
      }
    } catch {
      // Clipboard blocked — no-op. The user can still copy the URL manually.
    }
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-label={copied ? "Link copied to clipboard" : `Share ${title}`}
      className={cn(
        "inline-flex items-center justify-center rounded-full bg-white/95 hover:bg-white transition-colors",
        className,
      )}
    >
      {copied ? (
        <Check size={iconSize} className="text-emerald-600" aria-hidden="true" />
      ) : (
        <Share2
          size={iconSize}
          className="text-[var(--color-ink-muted)]"
          aria-hidden="true"
        />
      )}
    </button>
  );
}
