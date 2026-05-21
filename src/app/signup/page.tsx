import type { Metadata } from "next";
import Link from "next/link";
import { Phone, User } from "lucide-react";
import { Container } from "@/components/ui/Container";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { buildMetadata } from "@/lib/seo";

export const metadata: Metadata = buildMetadata({
  title: "Sign Up — Find Verified PGs & Hostels",
  description: "Create your free HostelPups account. ₹99/week unlocks unlimited owner contacts.",
  path: "/signup",
});

export default function SignupPage() {
  return (
    <Container size="sm" className="py-16 sm:py-24">
      <div className="max-w-md mx-auto">
        <div className="text-center mb-2">
          <Badge tone="brand">Free signup</Badge>
        </div>
        <h1 className="text-3xl font-black tracking-tight text-center">Create your account</h1>
        <p className="mt-2 text-center text-[var(--color-ink-muted)]">
          Browse verified PGs free. Pay ₹99 only when you want to contact an owner.
        </p>

        <div className="mt-8 rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-elevated)] p-8 space-y-5">
          <div>
            <label htmlFor="name" className="block text-sm font-semibold mb-1.5">
              Your name
            </label>
            <div className="flex items-center gap-2 rounded-xl border border-[var(--color-border-strong)] bg-[var(--color-bg)] px-4 h-12 focus-within:border-[var(--color-brand-500)]">
              <User size={16} className="text-[var(--color-ink-subtle)]" />
              <input
                id="name"
                type="text"
                placeholder="Aditya Menon"
                className="flex-1 bg-transparent outline-none"
              />
            </div>
          </div>

          <div>
            <label htmlFor="phone" className="block text-sm font-semibold mb-1.5">
              Phone number
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
            Send OTP &amp; Sign Up
          </Button>

          <p className="text-center text-xs text-[var(--color-ink-subtle)]">
            By signing up, you agree to our{" "}
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
          Already have an account?{" "}
          <Link href="/login" className="font-semibold text-[var(--color-brand-700)] hover:underline">
            Login
          </Link>
        </p>
      </div>
    </Container>
  );
}
