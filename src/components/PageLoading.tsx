/** Shared skeleton pieces for route-level loading states (shimmer is motion-gated in globals.css). */

export function HeroSkeleton({ crumbs = true }: { crumbs?: boolean }) {
  return (
    <div className="border-b border-white/[0.06]">
      <div className="container-x py-12 sm:py-16 lg:py-20">
        {crumbs ? <div className="skeleton-soft mb-5 h-3.5 w-40" /> : null}
        <div className="skeleton h-4 w-32 bg-blood-900/60" />
        <div className="skeleton mt-5 h-10 w-3/4 max-w-lg sm:h-14" />
        <div className="skeleton-soft mt-5 h-4 w-full max-w-xl" />
        <div className="skeleton-soft mt-2 h-4 w-2/3 max-w-md" />
      </div>
    </div>
  );
}

export function CardGridSkeleton({ count = 3, tall = false }: { count?: number; tall?: boolean }) {
  return (
    <ul className="grid gap-6 md:grid-cols-2 xl:grid-cols-3" aria-hidden>
      {Array.from({ length: count }, (_, i) => (
        <li key={i} className={`panel p-6 ${tall ? "min-h-96" : ""}`}>
          <div className="skeleton h-5 w-20" />
          <div className="skeleton mt-5 h-7 w-32" />
          <div className="skeleton-soft mt-3 h-4 w-44" />
          <div className="skeleton mt-6 h-10 w-28" />
          <div className="mt-6 space-y-3 border-t border-white/[0.06] pt-5">
            {Array.from({ length: 4 }, (_, j) => <div key={j} className="skeleton-soft h-3.5" style={{ width: `${70 - j * 10}%` }} />)}
          </div>
        </li>
      ))}
    </ul>
  );
}

/** Generic route loading state: hero skeleton plus content blocks. */
export function PageLoading({ label = "Loading…", crumbs = false }: { label?: string; crumbs?: boolean }) {
  return (
    <div role="status" aria-live="polite" aria-busy="true">
      <span className="sr-only">{label}</span>
      <HeroSkeleton crumbs={crumbs} />
      <div className="container-x py-12">
        <CardGridSkeleton />
      </div>
    </div>
  );
}
