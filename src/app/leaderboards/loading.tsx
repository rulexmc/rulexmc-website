import { HeroSkeleton } from "@/components/PageLoading";

export default function Loading() {
  return (
    <div aria-busy="true" aria-live="polite" role="status">
      <span className="sr-only">Loading leaderboards…</span>
      <HeroSkeleton />
      <div className="container-x py-10 sm:py-14">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex w-max max-w-full gap-1 overflow-hidden rounded-xl border border-white/[0.07] bg-ink-900/70 p-1">
            {Array.from({ length: 6 }, (_, i) => <div key={i} className={`h-10 w-24 rounded-lg ${i === 0 ? "bg-blood-700/50" : "skeleton-soft"}`} />)}
          </div>
          <div className="skeleton-soft h-11 w-full lg:w-80" />
        </div>
        <div className="skeleton-soft mb-8 mt-5 h-4 w-72 max-w-full" />
        <div className="mb-8 grid gap-4 sm:grid-cols-3" aria-hidden>
          {Array.from({ length: 3 }, (_, i) => (
            <div key={i} className="panel flex flex-col items-center p-6">
              <div className="skeleton h-4 w-10" />
              <div className="skeleton mt-4 h-16 w-16" />
              <div className="skeleton mt-3 h-5 w-28" />
              <div className="skeleton mt-2 h-7 w-16" />
            </div>
          ))}
        </div>
        <div className="panel divide-y divide-white/5" aria-hidden>
          {Array.from({ length: 8 }, (_, i) => (
            <div key={i} className="flex items-center gap-4 px-4 py-3.5">
              <div className="skeleton h-5 w-6" />
              <div className="skeleton h-8 w-8" />
              <div className="skeleton h-5 w-36" />
              <div className="skeleton-soft ml-auto h-5 w-14" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
