import type { Metadata } from "next";
import Link from "next/link";
import { Phone, Building2, MapPin } from "lucide-react";
import { Container } from "@/components/ui/Container";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { buildMetadata } from "@/lib/seo";

export const metadata: Metadata = buildMetadata({
  title: "Owner Sign Up — List Your PG / Hostel",
  description: "Create your HostelPups owner account. List your PG, hostel, or rental flat. ₹999/year self-serve or ₹1,999 full-service with photoshoot.",
  path: "/owner/signup",
});

export default function OwnerSignupPage() {
  return (
    <Container size="sm" className="py-16 sm:py-24">
      <div className="max-w-md mx-auto">
        <div className="text-center mb-2">
          <Badge tone="brand">For property owners</Badge>
        </div>
        <h1 className="text-3xl font-black tracking-tight text-center">List your property</h1>
        <p className="mt-2 text-center text-[var(--color-ink-muted)]">
          Reach 10,000+ verified renters. Honest pricing. No commission.
        </p>

        <div className="mt-8 rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-elevated)] p-8 space-y-5">
          <div>
            <label htmlFor="business" className="block text-sm font-semibold mb-1.5">
              Property / business name
            </label>
            <div className="flex items-center gap-2 rounded-xl border border-[var(--color-border-strong)] bg-[var(--color-bg)] px-4 h-12 focus-within:border-[var(--color-brand-500)]">
              <Building2 size={16} className="text-[var(--color-ink-subtle)]" />
              <input
                id="business"
                type="text"
                placeholder="Sunshine PG / Lakshmi Hostel"
                className="flex-1 bg-transparent outline-none"
              />
            </div>
          </div>

          <div>
            <label htmlFor="city" className="block text-sm font-semibold mb-1.5">
              City of property
            </label>
            <div className="flex items-center gap-2 rounded-xl border border-[var(--color-border-strong)] bg-[var(--color-bg)] px-4 h-12 focus-within:border-[var(--color-brand-500)]">
              <MapPin size={16} className="text-[var(--color-ink-subtle)]" />
              <input
                id="city"
                type="text"
                placeholder="Kochi, Bangalore, Chennai..."
                className="flex-1 bg-transparent outline-none"
              />
            </div>
          </div>

          <div>
            <label htmlFor="phone" className="block text-sm font-semibold mb-1.5">
              Your phone number
            </label>
            <div className="flex items-center gap-2 rounded-xl border border-[var(--color-border-strong)] bg-[var(--color-bg)] px-4 h-12 focus-within:border-[var(--color-brand-500)]">
              <Phone size={16} className="text-[var(--color-ink-subtle)]" />
              <span className="text-sm text-[var(--color-ink-muted)]">+91</span>
              <input
                id="phone"
                type="tel"
                placeholder="9876543210"
                className="flex-1 bg-transparent outline-none"
              />
            </div>
          </div>

          <Button variant="cta" fullWidth size="lg">
            Send OTP &amp; Continue
          </Button>

          <p className="text-center text-xs text-[var(--color-ink-subtle)]">
            By continuing, you agree to our{" "}
            <Link href="/terms" className="text-[var(--color-brand-700)] hover:underline">
              Terms
            </Link>{" "}
            and{" "}
            <Link href="/privacy" className="text-[var(--color-brand-700)] hover:underline">
              Privacy Policy
            </Link>
            .
          </p>
        </div>

        <p className="mt-6 text-center text-sm text-[var(--color-ink-muted)]">
          Already listed?{" "}
          <Link href="/owner/login" className="font-semibold text-[var(--color-brand-700)] hover:underline">
            Owner login
          </Link>
        </p>
      </div>
    </Container>
  );
}
