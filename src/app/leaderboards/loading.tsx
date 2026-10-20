export default function Loading() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6" aria-busy="true" aria-live="polite">
      <span className="sr-only">Loading leaderboards…</span>
      <div className="h-10 w-64 animate-pulse rounded bg-ink-700" />
      <div className="mt-8 flex gap-2">{Array.from({ length: 4 }, (_, i) => <div key={i} className="h-9 w-24 animate-pulse rounded bg-ink-700" />)}</div>
      <div className="panel mt-6 divide-y divide-white/5">
        {Array.from({ length: 8 }, (_, i) => (
          <div key={i} className="flex items-center gap-4 px-4 py-4">
            <div className="h-6 w-6 animate-pulse rounded bg-ink-700" />
            <div className="h-8 w-8 animate-pulse rounded bg-ink-700" />
            <div className="h-5 w-40 animate-pulse rounded bg-ink-700" />
          </div>
        ))}
      </div>
    </div>
  );
}
