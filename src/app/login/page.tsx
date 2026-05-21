import type { Metadata } from "next";
import Link from "next/link";
import { Phone, Mail } from "lucide-react";
import { Container } from "@/components/ui/Container";
import { Button } from "@/components/ui/Button";
import { buildMetadata } from "@/lib/seo";

export const metadata: Metadata = buildMetadata({
  title: "Login",
  description: "Login to your HostelPups account.",
  path: "/login",
  noindex: true,
});

export default function LoginPage() {
  return (
    <Container size="sm" className="py-16 sm:py-24">
      <div className="max-w-md mx-auto">
        <h1 className="text-3xl font-black tracking-tight text-center">Welcome back</h1>
        <p className="mt-2 text-center text-[var(--color-ink-muted)]">
          Login to continue your PG search.
        </p>

        <div className="mt-8 rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-elevated)] p-8 space-y-5">
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
            Send OTP
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
          Don&apos;t have an account?{" "}
          <Link href="/signup" className="font-semibold text-[var(--color-brand-700)] hover:underline">
            Sign up free
          </Link>
        </p>

        <div className="mt-10 text-center">
          <p className="text-sm text-[var(--color-ink-muted)]">
            Are you a PG / hostel owner?{" "}
            <Link href="/owner/login" className="font-semibold text-[var(--color-brand-700)] hover:underline">
              Owner login →
            </Link>
          </p>
        </div>
      </div>
    </Container>
  );
}
