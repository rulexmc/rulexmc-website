import { PixelHeart } from "@/components/Logo";

export function PageLoading() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center" role="status" aria-live="polite">
      <PixelHeart className="h-10 w-12 animate-pulse" />
      <span className="sr-only">Loading…</span>
    </div>
  );
}
