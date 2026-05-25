import { Container } from "@/components/ui/Container";

export default function Loading() {
  return (
    <Container size="xl" className="py-10 sm:py-14">
      <div className="animate-pulse">
        <div className="h-10 bg-[var(--color-surface)] rounded w-1/3 mb-4" />
        <div className="h-4 bg-[var(--color-surface)] rounded w-1/4 mb-8" />
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              className="h-20 bg-[var(--color-surface)] rounded-2xl"
            />
          ))}
        </div>
      </div>
    </Container>
  );
}
