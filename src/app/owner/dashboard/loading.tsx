import { Container } from "@/components/ui/Container";

/**
 * Dashboard skeleton — matches the layout (welcome strip + 4 stat cards
 * + 3 sections) so CLS stays low while server queries resolve.
 */
export default function Loading() {
  return (
    <Container size="xl" className="py-10 sm:py-14">
      <div className="animate-pulse">
        <div className="h-10 bg-[var(--color-surface)] rounded w-1/2 mb-4" />
        <div className="h-4 bg-[var(--color-surface)] rounded w-1/3 mb-8" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="h-24 bg-[var(--color-surface)] rounded-2xl"
            />
          ))}
        </div>
        <div className="h-72 bg-[var(--color-surface)] rounded-2xl" />
      </div>
    </Container>
  );
}
