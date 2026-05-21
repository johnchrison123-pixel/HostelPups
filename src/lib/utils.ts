import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Combine class names with Tailwind merge to dedupe conflicts.
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Convert a string to a URL-safe slug.
 * "Sunshine PG — Edappally" → "sunshine-pg-edappally"
 */
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "") // drop punctuation
    .replace(/[\s_-]+/g, "-") // collapse whitespace
    .replace(/^-+|-+$/g, ""); // trim hyphens
}

/**
 * Format price in INR with rupee symbol, no decimals.
 * 1999 → "₹1,999"
 */
export function formatPrice(amount: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * "Kochi" → "Kochi" (passthrough). For unknown cities, title-case.
 */
export function prettyCity(city: string): string {
  if (!city) return "";
  return city
    .toLowerCase()
    .split(/[\s-]+/)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

/**
 * Strip phone numbers, emails, UPI IDs, and contact phrases from chat text.
 * Used for anti-disintermediation enforcement in chat module.
 */
export function redactContactInfo(text: string): {
  redacted: string;
  hadContact: boolean;
} {
  let hadContact = false;
  let redacted = text;

  const patterns: { name: string; pattern: RegExp }[] = [
    // Indian mobile (10 digits starting 6-9), optionally with +91 / 0 prefix
    { name: "phone", pattern: /(?:\+?91[-\s]?|0)?[6-9]\d{9}/g },
    // Email
    { name: "email", pattern: /[\w.+-]+@[\w-]+\.[\w.-]+/g },
    // UPI ID
    { name: "upi", pattern: /\w+@(paytm|okhdfcbank|okaxis|okicici|oksbi|upi|ybl|axl|ibl)\b/gi },
    // WhatsApp link
    { name: "wa", pattern: /\b(?:wa\.me|api\.whatsapp\.com|chat\.whatsapp\.com)\S*/gi },
    // Telegram link
    { name: "tg", pattern: /\b(?:t\.me|telegram\.me)\S*/gi },
    // Common phrases
    { name: "phrase", pattern: /\b(?:call me|whatsapp me|whats app|ping me|dm me|text me|message me)\s+(?:at|on)?\b/gi },
  ];

  for (const { pattern } of patterns) {
    if (pattern.test(redacted)) {
      hadContact = true;
      redacted = redacted.replace(pattern, "[contact hidden]");
    }
  }

  return { redacted, hadContact };
}

/**
 * Truncate text with ellipsis.
 */
export function truncate(text: string, max: number): string {
  if (text.length <= max) return text;
  return text.slice(0, max - 1).trimEnd() + "…";
}

/**
 * "5 minutes ago" / "2 days ago" style relative time.
 */
export function timeAgo(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  const seconds = Math.floor((Date.now() - d.getTime()) / 1000);

  const intervals: [number, string][] = [
    [31536000, "year"],
    [2592000, "month"],
    [86400, "day"],
    [3600, "hour"],
    [60, "minute"],
  ];

  for (const [secs, label] of intervals) {
    const count = Math.floor(seconds / secs);
    if (count >= 1) {
      return `${count} ${label}${count > 1 ? "s" : ""} ago`;
    }
  }
  return "just now";
}
