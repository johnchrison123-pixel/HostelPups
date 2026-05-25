"use client";

import * as React from "react";
import {
  User,
  Phone,
  Save,
  Loader2,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { updateUserProfile } from "@/lib/user-actions";

interface UserProfileFormProps {
  initialName: string;
  initialPhone: string;
  /** Read-only display of the auth email. */
  email: string;
}

/**
 * Renter (non-owner) profile editor.
 *
 * Editable: name, phone.
 * Read-only: email (changes need an auth flow we haven't built).
 *
 * Avatar upload is tracked as PENDING — needs a `user-avatars` storage
 * bucket + policy and an upload widget.
 */
export function UserProfileForm({
  initialName,
  initialPhone,
  email,
}: UserProfileFormProps) {
  const [name, setName] = React.useState(initialName);
  const [phone, setPhone] = React.useState(initialPhone);
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [savedAt, setSavedAt] = React.useState<number | null>(null);

  const dirty =
    name.trim() !== initialName || phone.trim() !== initialPhone;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (name.trim().length < 2) {
      setError("Name needs to be at least 2 characters.");
      return;
    }
    if (
      phone.trim().length > 0 &&
      !/^[6-9]\d{9}$/.test(phone.trim())
    ) {
      setError(
        "Phone number should be a 10-digit Indian mobile starting with 6-9.",
      );
      return;
    }

    setSaving(true);
    try {
      await updateUserProfile({
        name: name.trim(),
        phone: phone.trim(),
      });
      setSavedAt(Date.now());
    } catch (err) {
      setError((err as Error).message ?? "Could not save changes.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6" noValidate>
      <section
        aria-labelledby="basic-heading"
        className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-elevated)] p-5 sm:p-6 shadow-[var(--shadow-sm)]"
      >
        <h2
          id="basic-heading"
          className="text-base font-bold mb-4 flex items-center gap-2"
        >
          <User
            size={18}
            className="text-[var(--color-brand-700)]"
            aria-hidden="true"
          />
          Basic info
        </h2>

        <div className="space-y-4">
          <div>
            <label
              htmlFor="up-name"
              className="block text-sm font-semibold mb-1.5"
            >
              Display name
            </label>
            <input
              id="up-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your full name"
              className="w-full rounded-xl border border-[var(--color-border-strong)] bg-[var(--color-bg)] px-4 h-12 text-base outline-none focus:border-[var(--color-brand-500)] focus:ring-2 focus:ring-[var(--color-brand-100)]"
            />
            <p className="mt-1.5 text-xs text-[var(--color-ink-muted)]">
              Shown to owners when you start a chat or inquiry.
            </p>
          </div>

          <div>
            <label
              htmlFor="up-email"
              className="block text-sm font-semibold mb-1.5"
            >
              Email
            </label>
            <input
              id="up-email"
              type="email"
              value={email}
              readOnly
              aria-readonly="true"
              className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-4 h-12 text-base text-[var(--color-ink-muted)] outline-none cursor-not-allowed"
            />
            <p className="mt-1.5 text-xs text-[var(--color-ink-muted)]">
              We&apos;ll use this for password reset and important account
              updates.
            </p>
          </div>
        </div>
      </section>

      <section
        aria-labelledby="contact-heading"
        className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-elevated)] p-5 sm:p-6 shadow-[var(--shadow-sm)]"
      >
        <h2
          id="contact-heading"
          className="text-base font-bold mb-4 flex items-center gap-2"
        >
          <Phone
            size={18}
            className="text-[var(--color-brand-700)]"
            aria-hidden="true"
          />
          Phone (optional)
        </h2>

        <div>
          <label
            htmlFor="up-phone"
            className="block text-sm font-semibold mb-1.5"
          >
            Mobile number
          </label>
          <div className="flex items-center gap-2 rounded-xl border border-[var(--color-border-strong)] bg-[var(--color-bg)] px-4 h-12 focus-within:border-[var(--color-brand-500)] focus-within:ring-2 focus-within:ring-[var(--color-brand-100)]">
            <span className="text-sm text-[var(--color-ink-muted)] font-medium">
              +91
            </span>
            <input
              id="up-phone"
              type="tel"
              inputMode="numeric"
              pattern="[6-9][0-9]{9}"
              maxLength={10}
              placeholder="9876543210"
              value={phone}
              onChange={(e) =>
                setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))
              }
              className="flex-1 bg-transparent outline-none text-base"
            />
          </div>
          <p className="mt-1.5 text-xs text-[var(--color-ink-muted)]">
            Used for account recovery only. Owners never see your number —
            chats and calls stay anonymous.
          </p>
        </div>
      </section>

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

      {savedAt && !dirty && !error && (
        <div
          role="status"
          className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800 flex items-center gap-2"
        >
          <CheckCircle2 size={16} aria-hidden="true" /> Profile saved.
        </div>
      )}

      <div className="flex items-center gap-2 flex-wrap">
        <Button
          variant="cta"
          size="md"
          type="submit"
          disabled={saving || !dirty}
        >
          {saving ? (
            <>
              <Loader2
                size={16}
                className="animate-spin"
                aria-hidden="true"
              />
              Saving…
            </>
          ) : (
            <>
              <Save size={16} aria-hidden="true" />
              Save changes
            </>
          )}
        </Button>
      </div>
    </form>
  );
}
