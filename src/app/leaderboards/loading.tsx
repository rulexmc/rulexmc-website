export default function Loading() {
  return (
    <div aria-busy="true" aria-live="polite" role="status">
      <span className="sr-only">Loading leaderboards…</span>
      <div className="border-b border-white/[0.06]">
        <div className="container-x py-14 sm:py-20">
          <div className="h-4 w-32 animate-pulse rounded bg-blood-900/60" />
          <div className="mt-5 h-12 w-72 max-w-full animate-pulse rounded-lg bg-ink-700" />
        </div>
      </div>
      <div className="container-x py-12">
        <div className="flex gap-2">{Array.from({ length: 4 }, (_, i) => <div key={i} className="h-9 w-24 animate-pulse rounded-md bg-ink-700" />)}</div>
        <div className="panel mt-8 divide-y divide-white/5">
          {Array.from({ length: 8 }, (_, i) => (
            <div key={i} className="flex items-center gap-4 px-4 py-4">
              <div className="h-6 w-6 animate-pulse rounded bg-ink-700" />
              <div className="h-8 w-8 animate-pulse rounded bg-ink-700" />
              <div className="h-5 w-40 animate-pulse rounded bg-ink-700" />
              <div className="ml-auto h-5 w-16 animate-pulse rounded bg-ink-800" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
