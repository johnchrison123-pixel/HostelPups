import type { Metadata } from "next";
import { Suspense } from "react";
import { Container } from "@/components/ui/Container";
import { SignupForm } from "@/components/auth/SignupForm";
import { AuthSidePanel } from "@/components/auth/AuthSidePanel";
import { AuthModeToggle } from "@/components/auth/AuthModeToggle";
import { buildMetadata } from "@/lib/seo";

// NOTE: meta description is a static string. The price number ('Rs 99/week')
// reflects PRICING.user.week.price in src/lib/site.ts — keep in sync when the
// weekly price changes.
export const metadata: Metadata = buildMetadata({
  title: "Sign Up — Find Verified PGs & Hostels",
  description:
    "Create your free HostelPups account in 30 seconds. Rs 99/week unlocks unlimited owner contacts.",
  path: "/signup",
  noindex: true,
});

export default function SignupPage() {
  return (
    <Container size="xl" className="py-10 sm:py-16">
      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)] gap-8 lg:gap-12 items-center">
        {/* Left column — multi-step form */}
        <div className="w-full max-w-md mx-auto lg:mx-0 lg:max-w-lg">
          {/* Renter / Business mode toggle */}
          <div className="mb-6">
            <AuthModeToggle active="renter" mode="signup" />
          </div>
          {/* Suspense boundary for useSearchParams in SignupForm. */}
          <Suspense fallback={null}>
            <SignupForm />
          </Suspense>
        </div>

        {/* Right column — value prop (lg+ only, same flavour as login) */}
        <AuthSidePanel flavor="renter" />
      </div>
    </Container>
  );
}
