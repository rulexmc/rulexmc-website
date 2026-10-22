import { CardGridSkeleton, HeroSkeleton } from "@/components/PageLoading";

export default function Loading() {
  return (
    <div role="status" aria-live="polite" aria-busy="true">
      <span className="sr-only">Loading store…</span>
      <HeroSkeleton />
      <div className="container-x py-10 sm:py-14">
        <div className="skeleton-soft mb-10 h-20 rounded-2xl" />
        <div className="panel mb-16 h-64" aria-hidden />
        <CardGridSkeleton tall />
      </div>
    </div>
  );
}
