/** Decorative Minecraft-style block strip (pure CSS/SVG, procedurally shaded). */
export function BlockStrip({ className = "" }: { className?: string }) {
  const shades = ["#1a1112", "#231617", "#2c1a1c", "#3a0409", "#140e0f", "#720816", "#1f1415"];
  return (
    <svg className={`h-4 w-full ${className}`} viewBox="0 0 64 2" preserveAspectRatio="none" shapeRendering="crispEdges" aria-hidden>
      {Array.from({ length: 128 }, (_, i) => {
        const x = i % 64;
        const y = Math.floor(i / 64);
        const shade = shades[(x * 7 + y * 13 + ((x * x) % 5)) % shades.length];
        return <rect key={i} x={x} y={y} width={1} height={1} fill={shade} />;
      })}
    </svg>
  );
}
