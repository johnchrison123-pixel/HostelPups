"use server";

/* ============================================================
   Contact form server action
   ============================================================ */

interface ContactPayload {
  name: string;
  email: string;
  subject: string;
  message: string;
}

/**
 * Stub server action — accepts the contact form submission, validates the
 * shape, and logs the payload server-side. Real email delivery
 * (Resend / SendGrid / Supabase Edge Function) is PENDING.
 *
 * We don't persist the message to Supabase right now to avoid creating a
 * `contact_messages` table that would need RLS + admin moderation UI.
 * Until email delivery is wired up, the founder team should monitor server
 * logs for "[contact-form]" entries.
 */
export async function submitContactForm(input: ContactPayload): Promise<void> {
  // Server-side re-validation (client already checks, but never trust the wire).
  const name = (input.name ?? "").trim();
  const email = (input.email ?? "").trim();
  const subject = (input.subject ?? "").trim();
  const message = (input.message ?? "").trim();

  if (name.length < 2) throw new Error("Name is required.");
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new Error("Email is invalid.");
  }
  if (message.length < 10) throw new Error("Message is too short.");

  // Truncate the message in the log so we don't dump huge bodies.
  const preview = message.length > 200 ? `${message.slice(0, 200)}…` : message;

  // Surfaces in Vercel server logs; founder can wire SendGrid/Resend later.
  console.log(
    "[contact-form]",
    JSON.stringify({
      ts: new Date().toISOString(),
      name,
      email,
      subject,
      preview,
      messageLength: message.length,
    }),
  );

  // Pretend latency so the UI shows the spinner long enough to feel real.
  await new Promise((r) => setTimeout(r, 250));
}
