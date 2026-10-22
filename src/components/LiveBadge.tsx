/** Badge for data that comes from the real game server. */
export function LiveBadge({ className = "", label = "Live server data" }: { className?: string; label?: string }) {
  return (
    <span className={`badge border border-emerald-400/40 bg-emerald-400/10 text-emerald-300 ${className}`} data-testid="live-badge">
      <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 motion-safe:animate-pulse" aria-hidden /> {label}
    </span>
  );
}
