import type { Metadata } from "next";
import { Bookmark } from "lucide-react";
import { Container } from "@/components/ui/Container";
import { Button } from "@/components/ui/Button";
import { buildMetadata } from "@/lib/seo";

export const metadata: Metadata = buildMetadata({
  title: "Saved Listings",
  path: "/saved",
  noindex: true,
});

export default function SavedPage() {
  return (
    <Container size="md" className="py-16 sm:py-24">
      <div className="text-center max-w-xl mx-auto">
        <div className="mx-auto inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--color-brand-100)] text-[var(--color-brand-700)] mb-6">
          <Bookmark size={28} />
        </div>
        <h1 className="text-3xl sm:text-4xl font-black tracking-tight">
          Saved Listings
        </h1>
        <p className="mt-4 text-lg text-[var(--color-ink-muted)] leading-relaxed">
          Sign in to save your favorite PGs and view them anytime.
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Button href="/login" variant="cta" size="lg">
            Sign in
          </Button>
          <Button href="/signup" variant="outline" size="lg">
            Create account
          </Button>
        </div>
      </div>
    </Container>
  );
}
