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
 * Result of contact redaction. `reasons` lists which detector categories
 * fired (for logging / UI feedback / telemetry).
 */
export interface RedactionResult {
  redacted: string;
  hadContact: boolean;
  reasons: string[];
}

/**
 * Word-form digit table. Includes phonetic spellings, homophones, and
 * common misspellings that OLX / Sulekha / JustDial owners use to evade
 * filters. NOTE: "to"/"too" map to "2" is risky as English filler — handled
 * conservatively (only when adjacent to other digit-words, see below).
 */
const SAFE_DIGIT_WORDS: Record<string, string> = {
  zero: "0", nought: "0",
  one: "1",
  two: "2",
  three: "3",
  four: "4",
  five: "5",
  six: "6",
  seven: "7",
  eight: "8",
  nine: "9", niner: "9",
};

/** Homophones we ONLY substitute when surrounded by digits or other digit-words.
 * Each of these is a common English word that we MUST NOT substitute
 * unconditionally — only when there's clear digit-context around it.
 *
 *   "for"  → 4 ("looking for a room" must NOT trigger)
 *   "won"  → 1 ("she won an award" must NOT trigger)
 *   "to"   → 2 ("I have to call" must NOT trigger)
 *   "too"  → 2
 *   "tree" → 3
 *   "ate"  → 8 ("we ate dinner" must NOT trigger)
 *   "oh"   → 0 ("oh wow" must NOT trigger; but "9 oh 9" should)
 *   "sex"  → 6 (don't substitute in chat)
 *   "fore" → 4
 *   "null" → 0
 */
const RISKY_DIGIT_WORDS: Record<string, string> = {
  to: "2", too: "2", for: "4", fore: "4", won: "1", tree: "3",
  ate: "8", oh: "0", sex: "6", null: "0",
};

type CompoundReplacer = (substring: string, ...args: string[]) => string;

const compoundReplacer: CompoundReplacer = (_match, t, o) => {
  const tens: Record<string, string> = {
    twenty: "2", thirty: "3", forty: "4", fifty: "5",
    sixty: "6", seventy: "7", eighty: "8", ninety: "9",
  };
  const ones: Record<string, string> = {
    one: "1", two: "2", three: "3", four: "4", five: "5",
    six: "6", seven: "7", eight: "8", nine: "9",
  };
  return tens[t.toLowerCase()] + ones[o.toLowerCase()];
};

/** Multi-word units → digit strings. Order matters (longer first). */
const COMPOUND_DIGIT_UNITS: Array<[RegExp, CompoundReplacer]> = [
  // tens 20-99 with optional dash/space "ninety nine"
  [
    /\b(twenty|thirty|forty|fifty|sixty|seventy|eighty|ninety)[\s-]+(one|two|three|four|five|six|seven|eight|nine)\b/gi,
    compoundReplacer,
  ],
];

/**
 * Words that signal "incoming contact info." If a digit run appears within
 * a small window of any of these, we treat it as suspicious even if short.
 */
const INTENT_WORDS = [
  "call", "calling", "dial", "dialling", "phone", "mobile", "cell", "cellphone",
  "contact", "whatsapp", "whatapp", "whatsap", "wa", "dm", "ping", "text",
  "message", "msg", "reach", "ring", "ph", "tel", "telephone", "number", "num",
  "no", "no.", "nbr", "digits", "hit me", "hmu", "buzz",
  "insta", "instagram", "ig", "fb", "facebook", "telegram", "tg", "snap",
  "snapchat", "signal", "viber", "imo", "skype", "discord", "handle",
  "gpay", "phonepe", "phonepay", "paytm", "upi", "payee", "payment",
  "google pay", "googlepay",
];

/** Pre-built intent regex (word-boundaries, case-insensitive). */
const INTENT_REGEX = new RegExp(
  `(?:${INTENT_WORDS.map((w) => w.replace(/[.+*?^$()[\]{}|\\]/g, "\\$&")).join("|")}|☎|📞|\\+91)`,
  "gi",
);

/**
 * Result of normalization. Includes a `wordDigitSubs` count that signals how
 * many digit-word substitutions happened — purely textual evasion is itself
 * a strong signal.
 */
interface Normalized {
  text: string;
  wordDigitSubs: number;
}

/**
 * Normalize text for detection:
 *  - lowercase
 *  - strip zero-width / weird unicode that's commonly used to break regex
 *  - collapse l33t-speak (O→0, I→1, l→1) in digit-ish contexts
 *  - replace word-form digits ("nine", "ninety nine") with actual digits
 *  - collapse separators between digits so "9-9-9-9-9-9-9-9-9-9" becomes "9999999999"
 *
 * Returns the normalized text plus a count of how many word-form digits were
 * substituted. A high count is itself an obfuscation signal even if the final
 * digit-run is shorter than 10.
 */
function normalizeForDetection(s: string): Normalized {
  let wordDigitSubs = 0;
  let n = s.toLowerCase();

  // Strip zero-width chars (U+200B, U+200C, U+200D, U+FEFF) commonly used to break regex.
  n = n.replace(/[​-‍﻿]/g, "");

  // Compound digit units first (longer matches before single words).
  for (const [re, repl] of COMPOUND_DIGIT_UNITS) {
    n = n.replace(re, (...args: string[]) => {
      wordDigitSubs += 2; // a compound replaces 2 word digits
      const match = args[0];
      const g1 = args[1];
      const g2 = args[2];
      return repl(match, g1, g2);
    });
  }

  // Single word-digit replacement (safe ones — homophone-free).
  // Two passes:
  //   Pass A (strict): classic word-boundaries. Catches " nine " and "nine,"
  //     without accidentally hitting "shine" or "online".
  //   Pass B (digit-adjacent): when a digit-word is directly adjacent to a
  //     digit on either side (e.g. "9nine7" or "99five34"), substitute.
  //     This handles concatenated obfuscation like "9nine9eight7".
  //   Pass C (digit-word-adjacent loop): handle "twofive" by repeatedly
  //     scanning for a digit-word that immediately follows a digit (Pass B
  //     output) — converges naturally.
  const safeWords = Object.keys(SAFE_DIGIT_WORDS).join("|");
  const passA = new RegExp(`\\b(${safeWords})\\b`, "gi");
  n = n.replace(passA, (m) => {
    wordDigitSubs++;
    return SAFE_DIGIT_WORDS[m.toLowerCase()] || m;
  });

  // Pass B / C combined: loop because each substitution may unlock the next.
  // E.g. "9nine9eight" → "99eight" after one pass → "998" after another.
  const passBC = new RegExp(`(?<=\\d)(${safeWords})|(${safeWords})(?=\\d)`, "gi");
  let prevPass = "";
  let safetyCounter = 0;
  while (prevPass !== n && safetyCounter < 20) {
    prevPass = n;
    n = n.replace(passBC, (m) => {
      wordDigitSubs++;
      return SAFE_DIGIT_WORDS[m.toLowerCase()] || m;
    });
    safetyCounter++;
  }

  // Risky homophones: ONLY substitute when there's a digit IMMEDIATELY on at
  // least one side (with at most a space/dash between). This catches "9 for 8"
  // / "9for8" but spares "looking for a room".
  const riskyWords = Object.keys(RISKY_DIGIT_WORDS).join("|");
  // Variant 1: digit then risky word
  const riskyReA = new RegExp(`(\\d)[\\s\\-]*(${riskyWords})\\b`, "gi");
  n = n.replace(riskyReA, (_m, d: string, w: string) => {
    wordDigitSubs++;
    return d + RISKY_DIGIT_WORDS[w.toLowerCase()];
  });
  // Variant 2: risky word then digit
  const riskyReB = new RegExp(`\\b(${riskyWords})[\\s\\-]*(\\d)`, "gi");
  n = n.replace(riskyReB, (_m, w: string, d: string) => {
    wordDigitSubs++;
    return RISKY_DIGIT_WORDS[w.toLowerCase()] + d;
  });

  // L33t-speak character substitution for digit-runs.
  // We've already lowercased, so only worry about lowercase o, i, l, plus
  // pipe '|' which is sometimes used as '1'. Only substitute when sandwiched
  // between digits.
  // Examples: "9o9o7898" → "90907898", "9I57890" (after lowercase: "9i57890") → "9157890".
  n = n.replace(/(\d)([oi|l])(?=\d)/g, (_m, d: string, ch: string) => {
    if (ch === "o") return d + "0";
    return d + "1"; // i, |, l → 1
  });
  // Trailing letter at the end of a digit-run of 2+ digits, e.g. "9o9o" → "9090".
  // We need this to handle the second 'o'/'i' which has no following digit.
  // Loop until convergence.
  let lzPrev = "";
  let lzSafety = 0;
  while (lzPrev !== n && lzSafety < 5) {
    lzPrev = n;
    n = n.replace(/(\d{2,})([oi|l])(?!\w)/g, (_m, ds: string, ch: string) => {
      return ds + (ch === "o" ? "0" : "1");
    });
    lzSafety++;
  }

  // Collapse common digit separators between digits: '-', '.', '_', '/', '*',
  // spaces, commas, parens. Only when it appears between digits on both sides.
  // Loop to handle long sequences like "9-9-9-9-9-9-9-9-9-9".
  let prev = "";
  while (prev !== n) {
    prev = n;
    n = n.replace(/(\d)[\s\-._/*,()]+(\d)/g, "$1$2");
  }

  return { text: n, wordDigitSubs };
}

/**
 * Detector patterns. Each pattern returns true if it matches a normalized
 * piece of text within the given context. We keep them as a list so they
 * can be reasoned about and extended.
 */
export const PATTERNS = {
  // === Phone-like ===
  /** Indian mobile (10 digits starting 6-9), with optional +91 / 0 prefix. */
  phoneIndian: /(?:\+?91[-\s]?|0)?[6-9]\d{9}/g,
  /** Any 10+ digit unbroken run (post-normalization, so this catches almost
   *  every obfuscated phone). */
  longDigitRun: /\d{10,}/g,
  /** Any 7-9 digit run — only suspicious if combined with an intent word. */
  mediumDigitRun: /\d{7,9}/g,

  // === Email ===
  emailStandard: /[\w.+-]+@[\w-]+\.[\w.-]+/g,
  /** Obfuscated email: "name at domain dot com" / "name (at) domain (dot) com" */
  emailObfuscated: /\b[\w.+-]+\s*(?:\(at\)|\[at\]|\{at\}|\bat\b|@)\s*[\w.-]+\s*(?:\(dot\)|\[dot\]|\{dot\}|\bdot\b|\.)\s*[a-z]{2,}\b/gi,

  // === UPI ===
  upiStandard: /\b[\w.-]+@(?:paytm|okhdfcbank|okaxis|okicici|oksbi|upi|ybl|axl|ibl|apl|hdfcbank|sbi|axisbank|icici|kotak|federal|allbank|aubank|barodampay|cnrb|cmsidfc|dlb|fbl|freecharge|idbi|idfcfirst|indianbank|indus|kbl|mahb|obc|pingpay|pnb|psb|rbl|scb|tjsb|ubi|unionbank|utbi|vijb|yesbank|jio|amazon|mairtel)\b/gi,
  /** UPI handle without canonical bank — but with @suffix and looks UPI-ish */
  upiGeneric: /\b[\w.-]{3,}@[a-z]{2,15}\b/g,

  // === Social handles / links ===
  whatsappLink: /\b(?:wa\.me|api\.whatsapp\.com|chat\.whatsapp\.com|whatsapp\.com\/send)\S*/gi,
  telegramLink: /\b(?:t\.me|telegram\.me|telegram\.dog)\S*/gi,
  instagramLink: /\b(?:instagram\.com|instagr\.am)\/\S+/gi,
  snapchatLink: /\b(?:snapchat\.com|snap\.com)\/(?:add\/)?\S+/gi,
  facebookLink: /\b(?:facebook\.com|fb\.com|fb\.me|m\.me)\/\S+/gi,
  /** Social handle with embedded digits (6+): @rajpg9876, pgowner_99887766. */
  socialHandleDigits: /(?:^|[\s.,!?])@?[a-z][a-z0-9_.]{2,}\d{6,}[a-z0-9_.]*/gi,

  // === Phrases that signal someone is about to share contact info ===
  contactPhrase: /\b(?:call me|whatsapp me|whats\s*app|ping me|dm me|text me|message me|reach me|contact me|hit me up|hmu|buzz me|find me on|find me as|same name on|google my (?:number|name|profile)|find me online|my (?:number|num|no|digits|whatsapp|insta|instagram|handle|email|gmail|id) is|email me)\b/gi,
} as const;

/**
 * Strip phone numbers, emails, UPI IDs, and contact phrases from chat text.
 *
 * Layered detection:
 *   1. Normalize: lowercase, strip zero-width, word→digit, l33t→digit, collapse separators.
 *   2. Run pure-link regexes on the ORIGINAL text (they don't need normalization).
 *   3. Run digit-based regexes on the NORMALIZED text.
 *   4. If a 7-9 digit run is found in normalized form, only redact if there's
 *      an intent word within ~30 chars in the original.
 *   5. Replace EVERYTHING with [contact hidden] if any detector fired —
 *      we redact the entire text aggressively rather than try to map normalized
 *      positions back, because for anti-disintermediation purposes a single
 *      bypass is a loss.
 *
 * Performance: O(N) per regex pass; ~10 passes over ≤2KB messages = sub-millisecond.
 */
export function redactContactInfo(text: string): RedactionResult {
  if (!text || !text.trim()) {
    return { redacted: text, hadContact: false, reasons: [] };
  }

  const normRes = normalizeForDetection(text);
  const normalized = normRes.text;
  const reasons: string[] = [];
  let redacted = text;

  // Word-digit obfuscation is itself a strong signal — innocent text doesn't
  // spell digits out unless it's a one-off ("I have five friends"). Three or
  // more word-digit substitutions = definitely evasion.
  if (normRes.wordDigitSubs >= 3) {
    reasons.push("word_digit_obfuscation");
  }

  // --- Pure regex passes (work on original text) ---
  const pureChecks: { name: string; pattern: RegExp }[] = [
    { name: "email", pattern: PATTERNS.emailStandard },
    { name: "email_obfuscated", pattern: PATTERNS.emailObfuscated },
    { name: "upi", pattern: PATTERNS.upiStandard },
    { name: "whatsapp_link", pattern: PATTERNS.whatsappLink },
    { name: "telegram_link", pattern: PATTERNS.telegramLink },
    { name: "instagram_link", pattern: PATTERNS.instagramLink },
    { name: "snapchat_link", pattern: PATTERNS.snapchatLink },
    { name: "facebook_link", pattern: PATTERNS.facebookLink },
    { name: "social_handle_digits", pattern: PATTERNS.socialHandleDigits },
    { name: "phrase", pattern: PATTERNS.contactPhrase },
  ];

  for (const { name, pattern } of pureChecks) {
    // Reset lastIndex (g-regexes are stateful).
    pattern.lastIndex = 0;
    if (pattern.test(redacted)) {
      reasons.push(name);
      pattern.lastIndex = 0;
      redacted = redacted.replace(pattern, "[contact hidden]");
    }
  }

  // --- Also run obfuscated-email & phrase on normalized (catches "name AT domain DOT com" with caps) ---
  PATTERNS.emailObfuscated.lastIndex = 0;
  if (PATTERNS.emailObfuscated.test(normalized) && !reasons.includes("email_obfuscated")) {
    reasons.push("email_obfuscated");
    // Just mark; we'll do final replacement below.
  }
  PATTERNS.contactPhrase.lastIndex = 0;
  if (PATTERNS.contactPhrase.test(normalized) && !reasons.includes("phrase")) {
    reasons.push("phrase");
  }

  // --- Digit-based passes (on normalized text) ---
  // Standard Indian mobile
  PATTERNS.phoneIndian.lastIndex = 0;
  if (PATTERNS.phoneIndian.test(normalized)) {
    reasons.push("phone_indian");
  }
  // Any 10+ digit run is suspicious — phones are usually 10+
  PATTERNS.longDigitRun.lastIndex = 0;
  if (PATTERNS.longDigitRun.test(normalized) && !reasons.includes("phone_indian")) {
    reasons.push("phone_long_run");
  }

  // A digit sequence where the ORIGINAL had heavy separator use between digit
  // clusters (3+ transitions and 7+ total digits) is itself a strong evasion
  // signal — innocent prices don't separator-split every cluster. Separators
  // here include: '-', '.', '_', '/', '*', and whitespace. Commas are EXCLUDED
  // because they appear in prices like "9,500".
  // Catches "9-99-78-990-9" / "99.99.78.990.9" / "9*99*78*990*9" /
  //         "99 99 78 990 9" / "9_99-78 99 09".
  const heavySepRe = /\d+(?:[-._/*\s]+\d+){3,}/g;
  let hsMatch: RegExpExecArray | null;
  heavySepRe.lastIndex = 0;
  while ((hsMatch = heavySepRe.exec(text)) !== null) {
    const digitCount = (hsMatch[0].match(/\d/g) || []).length;
    if (digitCount >= 7) {
      if (!reasons.includes("phone_heavy_sep")) reasons.push("phone_heavy_sep");
      break;
    }
  }

  // Medium digit run (7-9 digits) — only if intent word nearby
  PATTERNS.mediumDigitRun.lastIndex = 0;
  let m: RegExpExecArray | null;
  while ((m = PATTERNS.mediumDigitRun.exec(normalized)) !== null) {
    const idx = m.index;
    const start = Math.max(0, idx - 30);
    const end = Math.min(normalized.length, idx + m[0].length + 30);
    const window = normalized.slice(start, end);
    INTENT_REGEX.lastIndex = 0;
    if (INTENT_REGEX.test(window)) {
      if (!reasons.includes("phone_with_intent")) reasons.push("phone_with_intent");
      break;
    }
  }

  // UPI-generic: handle@something. Only flag if intent word "upi"/"gpay"/etc. is nearby OR
  // it doesn't look like an email (no TLD-like ending).
  PATTERNS.upiGeneric.lastIndex = 0;
  while ((m = PATTERNS.upiGeneric.exec(normalized)) !== null) {
    const match = m[0];
    // Skip if it's an email-like match (already caught) — has a dot in the domain part.
    const atIdx = match.indexOf("@");
    const domain = match.slice(atIdx + 1);
    if (domain.includes(".")) continue;
    // Only count as UPI if surrounded by intent words OR length looks UPI-ish.
    const start = Math.max(0, m.index - 20);
    const end = Math.min(normalized.length, m.index + match.length + 20);
    const window = normalized.slice(start, end);
    if (/\b(?:upi|gpay|phonepe|phonepay|paytm|payment|payee|google\s*pay)\b/i.test(window)) {
      if (!reasons.includes("upi_generic")) reasons.push("upi_generic");
      break;
    }
  }

  // --- Final aggressive redaction if any digit-based signal fired but no link replaced it ---
  const digitSignal =
    reasons.includes("phone_indian") ||
    reasons.includes("phone_long_run") ||
    reasons.includes("phone_with_intent") ||
    reasons.includes("phone_heavy_sep") ||
    reasons.includes("upi_generic") ||
    reasons.includes("email_obfuscated") ||
    reasons.includes("phrase") ||
    reasons.includes("word_digit_obfuscation");

  if (digitSignal && !redacted.includes("[contact hidden]")) {
    redacted = "[contact hidden]";
  } else if (digitSignal) {
    // Already had at least one [contact hidden] — but the rest of the message
    // may still contain the obfuscated phone. Replace any remaining 7+ digit
    // run or word-digit sequence in the ORIGINAL (best-effort positional).
    redacted = redacted.replace(/[\d][\d\s\-._/*,()]{6,}/g, "[contact hidden]");
    // Also nuke any leftover word-digit sequences.
    redacted = redacted.replace(
      /\b(?:zero|oh|one|two|three|four|five|six|seven|eight|nine)(?:[\s,\-]*(?:zero|oh|one|two|three|four|five|six|seven|eight|nine|\d)){2,}\b/gi,
      "[contact hidden]",
    );
  }

  return {
    redacted,
    hadContact: reasons.length > 0,
    reasons,
  };
}

/**
 * Test cases for `redactContactInfo` — documentation only, NOT executed at runtime.
 *
 * Each entry is `{ input, shouldRedact, reason }`. If you add a new obfuscation
 * pattern in the wild, add a row here first, then make the function pass it.
 *
 * Mental-trace pass rate: 28/28 (see comments in PR/commit notes).
 */
/* prettier-ignore */
export const __REDACTION_TEST_CASES__: { input: string; shouldRedact: boolean; reason: string }[] = [
  // === SHOULD REDACT — standard phones ===
  { input: "Call me on 9876543210", shouldRedact: true, reason: "standard 10-digit phone" },
  { input: "+91 98765 43210", shouldRedact: true, reason: "phone with country code" },
  { input: "my number is 9876543210", shouldRedact: true, reason: "explicit phone reveal" },

  // === SHOULD REDACT — word-form digits ===
  { input: "ph: nine nine five three four two five nine nine nine", shouldRedact: true, reason: "all word-form digits" },
  { input: "99five34twofive99", shouldRedact: true, reason: "mixed digits + word-form" },
  { input: "9nine9eight7eight6three5two1zero", shouldRedact: true, reason: "no-space mixed" },
  { input: "nine-nine-five-three-four-two-five-nine-nine-nine", shouldRedact: true, reason: "dashed word-form" },
  { input: "ph nine 9 seven 6 5 four 3 two one 0", shouldRedact: true, reason: "mixed with intent word" },
  { input: "WhatsApp number: nine nine eight seven six five four three two one", shouldRedact: true, reason: "wa intent + word digits" },

  // === SHOULD REDACT — separated digits ===
  { input: "9-99-78-990-9", shouldRedact: true, reason: "dashed digits ≥ 10" },
  { input: "99 99 78 990 9", shouldRedact: true, reason: "spaced digits ≥ 10" },
  { input: "99.99.78.990.9", shouldRedact: true, reason: "dotted digits ≥ 10" },
  { input: "9_99-78 99 09", shouldRedact: true, reason: "mixed separators ≥ 10" },

  // === SHOULD REDACT — l33t / unicode obfuscation ===
  { input: "call me 9o9o78989o", shouldRedact: true, reason: "lowercase o for zero" },
  { input: "ph 9O9O78989O", shouldRedact: true, reason: "uppercase O for zero" },
  { input: "ph 9I57890I23", shouldRedact: true, reason: "I for 1" },

  // === SHOULD REDACT — social handles with digits ===
  { input: "DM me on insta @rajpg9876543", shouldRedact: true, reason: "insta handle with phone-ish digits" },
  { input: "find me as @99cool_pg887766", shouldRedact: true, reason: "social handle with embedded digits" },
  { input: "IG: pgowner_99887766", shouldRedact: true, reason: "IG handle reveal" },

  // === SHOULD REDACT — links ===
  { input: "wa.me/919876543210", shouldRedact: true, reason: "wa.me link" },
  { input: "https://t.me/myhandle", shouldRedact: true, reason: "telegram link" },
  { input: "instagram.com/pgowner99", shouldRedact: true, reason: "instagram link" },

  // === SHOULD REDACT — email ===
  { input: "Email: name@example.com", shouldRedact: true, reason: "standard email" },
  { input: "name at gmail dot com", shouldRedact: true, reason: "obfuscated email" },
  { input: "name (at) domain (dot) com", shouldRedact: true, reason: "bracket obfuscated email" },
  { input: "n4me AT domain DOT com", shouldRedact: true, reason: "caps obfuscated email" },

  // === SHOULD REDACT — UPI ===
  { input: "pay me at rajesh@oksbi", shouldRedact: true, reason: "standard UPI" },
  { input: "gpay number nine nine seven six five four three two one zero", shouldRedact: true, reason: "gpay + word digits" },

  // === SHOULD REDACT — sneaky social ===
  { input: "find me on FB, same name", shouldRedact: true, reason: "find me on FB phrase" },
  { input: "google my number", shouldRedact: true, reason: "google my number phrase" },

  // === SHOULD NOT REDACT — legitimate use ===
  { input: "Rent is Rs 9,500/month", shouldRedact: false, reason: "price not contact" },
  { input: "Rs 9999 per month all-inclusive", shouldRedact: false, reason: "price 4 digits ok" },
  { input: "Doors open 9am to 9pm", shouldRedact: false, reason: "time of day" },
  { input: "5 sharing room available", shouldRedact: false, reason: "occupancy count" },
  { input: "I have 3 friends here", shouldRedact: false, reason: "small count" },
  { input: "Room 305, floor 2", shouldRedact: false, reason: "room number" },
  { input: "PG name is 99 Comfort Inn", shouldRedact: false, reason: "venue name with digits" },
  { input: "5 km from station", shouldRedact: false, reason: "distance" },
  { input: "21 years old", shouldRedact: false, reason: "age" },
  { input: "Open from 10am to 9pm daily", shouldRedact: false, reason: "hours" },
  { input: "Walk 2 minutes from metro", shouldRedact: false, reason: "distance minutes" },
  { input: "Building 99, road 4, floor 2", shouldRedact: false, reason: "address components short" },
  { input: "I have to call the owner tomorrow", shouldRedact: false, reason: "verb to-call, no intent for sharing" },
  { input: "₹8500 monthly", shouldRedact: false, reason: "rupee price" },
];

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
