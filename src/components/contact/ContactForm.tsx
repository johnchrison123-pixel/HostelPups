"use client";

import * as React from "react";
import {
  Send,
  Loader2,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { submitContactForm } from "@/lib/contact-actions";

const SUBJECTS = [
  "Renter support",
  "Owner support",
  "KYC / verification",
  "Partnership",
  "Press",
  "Bug / feedback",
  "Other",
] as const;

/**
 * Contact form — collects name, email, subject, message and submits via
 * the `submitContactForm` server action.
 *
 * v1 stub: server action just logs the submission. Real email delivery
 * via Resend / Supabase function is PENDING.
 */
export function ContactForm() {
  const [name, setName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [subject, setSubject] = React.useState<typeof SUBJECTS[number]>(
    "Renter support",
  );
  const [message, setMessage] = React.useState("");
  const [sending, setSending] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [sent, setSent] = React.useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const cleanName = name.trim();
    const cleanEmail = email.trim();
    const cleanMessage = message.trim();

    if (cleanName.length < 2) {
      setError("Please share your name.");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      setError("That email doesn't look quite right.");
      return;
    }
    if (cleanMessage.length < 10) {
      setError("Add a few more words so we can help.");
      return;
    }

    setSending(true);
    try {
      await submitContactForm({
        name: cleanName,
        email: cleanEmail,
        subject,
        message: cleanMessage,
      });
      setSent(true);
      setMessage("");
    } catch (err) {
      setError((err as Error).message ?? "Could not send. Try email instead.");
    } finally {
      setSending(false);
    }
  }

  if (sent) {
    return (
      <div
        role="status"
        className="rounded-2xl border border-emerald-200 bg-emerald-50 p-6 sm:p-8 text-emerald-900"
      >
        <div className="flex items-start gap-3">
          <CheckCircle2 size={22} className="mt-0.5 shrink-0 text-emerald-600" />
          <div>
            <h3 className="font-bold text-base sm:text-lg">
              Thanks — we got your message.
            </h3>
            <p className="mt-1 text-sm">
              The team will reach out at <strong>{email}</strong> within 24
              hours on weekdays. For urgent owner / renter issues, you can
              also email us directly using the links above.
            </p>
            <button
              type="button"
              onClick={() => setSent(false)}
              className="mt-3 text-sm font-semibold text-emerald-800 hover:underline"
            >
              Send another message
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-elevated)] p-6 sm:p-8 shadow-[var(--shadow-sm)] space-y-5"
      noValidate
    >
      <h2 className="font-bold text-lg">Send us a message</h2>
      <p className="text-sm text-[var(--color-ink-muted)] -mt-3">
        We typically reply within 24 hours on weekdays.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label
            htmlFor="cf-name"
            className="block text-sm font-semibold mb-1.5"
          >
            Your name
          </label>
          <input
            id="cf-name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Anjali Krishnan"
            className="w-full rounded-xl border border-[var(--color-border-strong)] bg-[var(--color-bg)] px-4 h-12 text-base outline-none focus:border-[var(--color-brand-500)] focus:ring-2 focus:ring-[var(--color-brand-100)]"
            autoComplete="name"
          />
        </div>
        <div>
          <label
            htmlFor="cf-email"
            className="block text-sm font-semibold mb-1.5"
          >
            Email
          </label>
          <input
            id="cf-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            className="w-full rounded-xl border border-[var(--color-border-strong)] bg-[var(--color-bg)] px-4 h-12 text-base outline-none focus:border-[var(--color-brand-500)] focus:ring-2 focus:ring-[var(--color-brand-100)]"
            autoComplete="email"
          />
        </div>
      </div>

      <div>
        <label
          htmlFor="cf-subject"
          className="block text-sm font-semibold mb-1.5"
        >
          Subject
        </label>
        <select
          id="cf-subject"
          value={subject}
          onChange={(e) =>
            setSubject(e.target.value as typeof SUBJECTS[number])
          }
          className="w-full rounded-xl border border-[var(--color-border-strong)] bg-[var(--color-bg)] px-4 h-12 text-base outline-none focus:border-[var(--color-brand-500)] focus:ring-2 focus:ring-[var(--color-brand-100)]"
        >
          {SUBJECTS.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label
          htmlFor="cf-message"
          className="block text-sm font-semibold mb-1.5"
        >
          Message
        </label>
        <textarea
          id="cf-message"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          rows={6}
          placeholder="Tell us what's going on — listing question, refund query, owner KYC, partnership idea…"
          className="w-full rounded-xl border border-[var(--color-border-strong)] bg-[var(--color-bg)] px-4 py-3 text-base outline-none focus:border-[var(--color-brand-500)] focus:ring-2 focus:ring-[var(--color-brand-100)] resize-y min-h-[120px]"
        />
      </div>

      {error && (
        <div
          role="alert"
          className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 flex items-start gap-2"
        >
          <AlertCircle
            size={16}
            className="mt-0.5 shrink-0"
            aria-hidden="true"
          />
          <span>{error}</span>
        </div>
      )}

      <div className="flex items-center gap-3 flex-wrap">
        <Button variant="cta" size="md" type="submit" disabled={sending}>
          {sending ? (
            <>
              <Loader2
                size={16}
                className="animate-spin"
                aria-hidden="true"
              />
              Sending…
            </>
          ) : (
            <>
              <Send size={16} aria-hidden="true" />
              Send message
            </>
          )}
        </Button>
        <p className="text-xs text-[var(--color-ink-muted)]">
          By sending you agree to our{" "}
          <a
            href="/privacy"
            className="font-semibold text-[var(--color-brand-700)] hover:underline"
          >
            privacy policy
          </a>
          .
        </p>
      </div>
    </form>
  );
}
