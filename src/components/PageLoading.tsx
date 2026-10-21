import { PixelHeart } from "@/components/Logo";

/** Route-level loading state: hero skeleton plus a pulsing heart. */
export function PageLoading({ label = "Loading…" }: { label?: string }) {
  return (
    <div role="status" aria-live="polite" aria-busy="true">
      <div className="border-b border-white/[0.06]">
        <div className="container-x py-14 sm:py-20">
          <div className="h-4 w-32 animate-pulse rounded bg-blood-900/60" />
          <div className="mt-5 h-10 w-3/4 max-w-lg animate-pulse rounded-lg bg-ink-700 sm:h-14" />
          <div className="mt-5 h-4 w-full max-w-xl animate-pulse rounded bg-ink-800" />
          <div className="mt-2 h-4 w-2/3 max-w-md animate-pulse rounded bg-ink-800" />
        </div>
      </div>
      <div className="container-x flex justify-center py-16">
        <PixelHeart className="h-10 w-12 animate-pulse" />
      </div>
      <span className="sr-only">{label}</span>
    </div>
  );
}
