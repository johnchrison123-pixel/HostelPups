import type { Metadata } from "next";
import { Container } from "@/components/ui/Container";
import { LoginForm } from "@/components/auth/LoginForm";
import { AuthSidePanel } from "@/components/auth/AuthSidePanel";
import { buildMetadata } from "@/lib/seo";

export const metadata: Metadata = buildMetadata({
  title: "Owner Login",
  description: "Log in to your HostelPups owner dashboard.",
  path: "/owner/login",
  noindex: true,
});

export default function OwnerLoginPage() {
  return (
    <Container size="xl" className="py-10 sm:py-16">
      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)] gap-8 lg:gap-12 items-center">
        {/* Left column — form (45%) */}
        <div className="w-full max-w-md mx-auto lg:mx-0 lg:max-w-lg">
          <LoginForm flavor="owner" ownerLoginHref="/login" />
        </div>

        {/* Right column — owner-focused value prop */}
        <AuthSidePanel flavor="owner" />
      </div>
    </Container>
  );
}
