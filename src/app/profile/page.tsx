import type { Metadata } from "next";
import Link from "next/link";
import {
  User,
  Heart,
  MessageSquare,
  PhoneCall,
  ArrowRight,
  Image as ImageIcon,
} from "lucide-react";
import { Container } from "@/components/ui/Container";
import { Button } from "@/components/ui/Button";
import { UserProfileForm } from "@/components/profile/UserProfileForm";
import { buildMetadata } from "@/lib/seo";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = buildMetadata({
  title: "Your Profile",
  path: "/profile",
  noindex: true,
});

// Always render dynamically — output depends on auth state.
export const dynamic = "force-dynamic";

export default async function ProfilePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return (
      <Container size="md" className="py-16 sm:py-24">
        <div className="text-center max-w-xl mx-auto">
          <div className="mx-auto inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--color-brand-100)] text-[var(--color-brand-700)] mb-6">
            <User size={28} />
          </div>
          <h1 className="text-3xl sm:text-4xl font-black tracking-tight">
            Your Profile
          </h1>
          <p className="mt-4 text-lg text-[var(--color-ink-muted)] leading-relaxed">
            Sign in to view your profile, preferences, and account settings.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Button href="/login?next=%2Fprofile" variant="cta" size="lg">
              Sign in
            </Button>
            <Button
              href="/signup?next=%2Fprofile"
              variant="outline"
              size="lg"
            >
              Create account
            </Button>
          </div>
        </div>
      </Container>
    );
  }

  // Load the profile row. The on_auth_user_created trigger creates it
  // automatically — but if it ever doesn't exist (e.g. trigger disabled),
  // we fall back to defaults so the form still renders.
  let initialName = "";
  let initialPhone = "";
  try {
    const { data } = await supabase
      .from("profiles")
      .select("name, phone")
      .eq("id", user.id)
      .maybeSingle();
    if (data) {
      initialName = (data.name as string | null) ?? "";
      initialPhone = (data.phone as string | null) ?? "";
    }
  } catch {
    // ignore — profiles table missing or read failed
  }

  return (
    <Container size="lg" className="py-10 sm:py-14">
      <header className="mb-8">
        <div className="inline-flex items-center gap-2 rounded-full border border-[var(--color-border)] bg-[var(--color-bg-elevated)] px-3 py-1 text-xs font-semibold text-[var(--color-ink-muted)] mb-4">
          <User size={12} aria-hidden="true" />
          Renter account
        </div>
        <h1 className="text-3xl sm:text-4xl font-black tracking-tight">
          Your profile
        </h1>
        <p className="mt-2 text-base text-[var(--color-ink-muted)]">
          Update how you appear when you start a chat or place an inquiry.
        </p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6 lg:gap-10">
        <UserProfileForm
          initialName={initialName}
          initialPhone={initialPhone}
          email={user.email ?? ""}
        />

        <aside className="space-y-4">
          <h2 className="text-sm font-semibold text-[var(--color-ink-muted)] uppercase tracking-wider">
            Quick links
          </h2>
          <Link
            href="/saved"
            className="group flex items-center justify-between gap-3 rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-elevated)] p-4 hover:border-[var(--color-brand-400)] hover:shadow-[var(--shadow-sm)] transition-all"
          >
            <span className="flex items-center gap-3">
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--color-brand-100)] text-[var(--color-brand-700)]">
                <Heart size={18} aria-hidden="true" />
              </span>
              <span>
                <span className="block font-bold text-sm">
                  Saved listings
                </span>
                <span className="block text-xs text-[var(--color-ink-muted)]">
                  Listings you&apos;ve hearted
                </span>
              </span>
            </span>
            <ArrowRight
              size={16}
              className="text-[var(--color-ink-subtle)] group-hover:text-[var(--color-brand-700)]"
              aria-hidden="true"
            />
          </Link>

          <Link
            href="/messages"
            className="group flex items-center justify-between gap-3 rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-elevated)] p-4 hover:border-[var(--color-brand-400)] hover:shadow-[var(--shadow-sm)] transition-all"
          >
            <span className="flex items-center gap-3">
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--color-brand-100)] text-[var(--color-brand-700)]">
                <MessageSquare size={18} aria-hidden="true" />
              </span>
              <span>
                <span className="block font-bold text-sm">Messages</span>
                <span className="block text-xs text-[var(--color-ink-muted)]">
                  Chats with owners
                </span>
              </span>
            </span>
            <ArrowRight
              size={16}
              className="text-[var(--color-ink-subtle)] group-hover:text-[var(--color-brand-700)]"
              aria-hidden="true"
            />
          </Link>

          <Link
            href="/calls"
            className="group flex items-center justify-between gap-3 rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-elevated)] p-4 hover:border-[var(--color-brand-400)] hover:shadow-[var(--shadow-sm)] transition-all"
          >
            <span className="flex items-center gap-3">
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--color-brand-100)] text-[var(--color-brand-700)]">
                <PhoneCall size={18} aria-hidden="true" />
              </span>
              <span>
                <span className="block font-bold text-sm">Calls</span>
                <span className="block text-xs text-[var(--color-ink-muted)]">
                  Call history
                </span>
              </span>
            </span>
            <ArrowRight
              size={16}
              className="text-[var(--color-ink-subtle)] group-hover:text-[var(--color-brand-700)]"
              aria-hidden="true"
            />
          </Link>

          <div className="rounded-2xl border border-dashed border-[var(--color-border)] bg-[var(--color-surface)] p-4">
            <p className="flex items-center gap-2 text-xs font-semibold text-[var(--color-ink-muted)] uppercase tracking-wider mb-1">
              <ImageIcon size={12} aria-hidden="true" /> Coming soon
            </p>
            <p className="text-sm text-[var(--color-ink)]">
              Avatar upload
            </p>
            <p className="mt-1 text-xs text-[var(--color-ink-muted)]">
              We&apos;ll add an avatar picker once the user-avatars bucket is
              configured.
            </p>
          </div>
        </aside>
      </div>
    </Container>
  );
}
