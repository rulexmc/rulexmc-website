export function SampleBadge({ className = "" }: { className?: string }) {
  return (
    <span
      className={`badge border border-amber-400/60 bg-amber-400/15 text-amber-200 ${className}`}
      title="This is generated sample data for development. It is not live server data."
      data-testid="sample-badge"
    >
      <span aria-hidden>▲</span> Sample data — not live
    </span>
  );
}
