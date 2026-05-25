import { Container } from "@/components/ui/Container";

/**
 * Skeleton shown while the Supabase search query resolves.
 *
 * The /search page is dynamic (`ƒ Dynamic` in the route table) so without
 * this file the browser would sit on the prior page until SSR finished.
 * Matching the post-load shape (h1 + filter line + card grid) keeps CLS low.
 */
export default function Loading() {
  return (
    <Container size="xl" className="py-10 sm:py-14">
      <div className="animate-pulse">
        <div className="h-10 bg-[var(--color-surface)] rounded w-1/2 mb-4" />
        <div className="h-4 bg-[var(--color-surface)] rounded w-1/3 mb-8" />
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="h-72 bg-[var(--color-surface)] rounded-2xl"
            />
          ))}
        </div>
      </div>
    </Container>
  );
}
