/** RuleX MC wordmark: a pixel-block heart split by a crimson "X" slash. Pure SVG, no external assets. */
const HEART = [
  "0110110",
  "1111111",
  "1111111",
  "0111110",
  "0011100",
  "0001000",
];

export function PixelHeart({ className = "", title }: { className?: string; title?: string }) {
  return (
    <svg viewBox="0 0 7 6" className={className} role={title ? "img" : undefined} aria-hidden={title ? undefined : true} shapeRendering="crispEdges">
      {title ? <title>{title}</title> : null}
      {HEART.flatMap((row, y) =>
        row.split("").map((c, x) =>
          c === "1" ? (
            <rect key={`${x}-${y}`} x={x} y={y} width={1} height={1} fill={(x + y) % 3 === 0 ? "#f0414f" : y > 3 ? "#720816" : "#d01229"} />
          ) : null,
        ),
      )}
      <rect x={1} y={1} width={1} height={1} fill="#ffb3b7" />
    </svg>
  );
}

export function Logo({ size = "md" }: { size?: "sm" | "md" | "lg" }) {
  const text = size === "lg" ? "text-[1.85rem] min-[400px]:text-[2.4rem] sm:text-6xl lg:text-7xl" : size === "sm" ? "text-lg" : "text-xl sm:text-2xl";
  const heart = size === "lg" ? "h-8 w-10 min-[400px]:h-10 min-[400px]:w-12 sm:h-16 sm:w-20 lg:h-20 lg:w-24" : size === "sm" ? "h-5 w-6" : "h-6 w-7";
  return (
    <span className="inline-flex items-center gap-2.5" role="img" aria-label="RuleX MC">
      <span className="relative inline-flex">
        <PixelHeart className={`${heart} drop-shadow-[0_0_12px_rgba(208,18,41,0.75)]`} />
      </span>
      <span className={`whitespace-nowrap font-display font-black uppercase leading-none tracking-wider ${text}`} aria-hidden>
        <span className="text-bone-100">Rule</span>
        <span className="relative mx-[0.04em] inline-block text-blood-500 text-glow">
          X
          <span className="absolute -inset-x-1 top-1/2 h-[0.08em] -translate-y-1/2 -rotate-[28deg] bg-blood-400/80" />
        </span>
        <span className="ml-[0.28em] text-bone-100">MC</span>
      </span>
    </span>
  );
}
