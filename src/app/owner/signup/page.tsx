import type { Metadata } from "next";
import { Container } from "@/components/ui/Container";
import { OwnerSignupForm } from "@/components/auth/OwnerSignupForm";
import { AuthSidePanel } from "@/components/auth/AuthSidePanel";
import { buildMetadata } from "@/lib/seo";

export const metadata: Metadata = buildMetadata({
  title: "Owner Sign Up — List Your PG / Hostel",
  description:
    "Create your HostelPups owner account. List your PG, hostel, or rental flat. Rs 999/year self-serve or Rs 1,999 full-service with photoshoot.",
  path: "/owner/signup",
  noindex: true,
});

export default function OwnerSignupPage() {
  return (
    <Container size="xl" className="py-10 sm:py-16">
      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)] gap-8 lg:gap-12 items-center">
        {/* Left column — multi-step owner signup */}
        <div className="w-full max-w-md mx-auto lg:mx-0 lg:max-w-lg">
          <OwnerSignupForm />
        </div>

        {/* Right column — owner-focused value prop */}
        <AuthSidePanel flavor="owner" />
      </div>
    </Container>
  );
}
