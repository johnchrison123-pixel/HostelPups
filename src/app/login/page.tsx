import type { Metadata } from "next";
import { Suspense } from "react";
import { Container } from "@/components/ui/Container";
import { LoginForm } from "@/components/auth/LoginForm";
import { AuthSidePanel } from "@/components/auth/AuthSidePanel";
import { AuthModeToggle } from "@/components/auth/AuthModeToggle";
import { buildMetadata } from "@/lib/seo";

export const metadata: Metadata = buildMetadata({
  title: "Login",
  description: "Login to your HostelPups account.",
  path: "/login",
  noindex: true,
});

export default function LoginPage() {
  return (
    <Container size="xl" className="py-10 sm:py-16">
      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)] gap-8 lg:gap-12 items-center">
        {/* Left column — form (45%) */}
        <div className="w-full max-w-md mx-auto lg:mx-0 lg:max-w-lg">
          {/* Renter / Business mode toggle */}
          <div className="mb-6">
            <AuthModeToggle active="renter" mode="login" />
          </div>
          {/*
            LoginForm reads `?next=` via useSearchParams. Next.js requires
            a Suspense boundary around components that bail out of static
            generation via that hook.
          */}
          <Suspense fallback={null}>
            <LoginForm flavor="renter" ownerLoginHref="/owner/login" />
          </Suspense>
        </div>

        {/* Right column — value prop (55%, lg+ only) */}
        <AuthSidePanel flavor="renter" />
      </div>
    </Container>
  );
}
