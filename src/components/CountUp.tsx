"use client";

import { useEffect, useRef, useState } from "react";
import { easeOut, prefersReducedMotion } from "@/lib/client/motion";

const fmt = (n: number) => Math.round(n).toLocaleString("en-US");

/**
 * Animated integer for LIVE numbers only (never use it for sample data).
 * - The server-rendered HTML always contains the real value (no-JS, crawlers and screen readers get it).
 * - Counts up from 0 the first time it scrolls into view, unless it was already visible on load
 *   (that would flash the real number, then 0). Later value changes tween from the old value.
 * - Width is reserved with an invisible copy of the final value, so nothing shifts while it counts.
 * - Reduced motion: no animation at all.
 */
export function CountUp({ value, duration = 900, className = "", align = "start" }: { value: number; duration?: number; className?: string; align?: "start" | "end" | "center" }) {
  const [shown, setShown] = useState(value);
  const ref = useRef<HTMLSpanElement>(null);
  const from = useRef(value);
  const raf = useRef(0);
  const seen = useRef(false);

  const run = (start: number, end: number) => {
    cancelAnimationFrame(raf.current);
    if (start === end) { setShown(end); return; }
    const t0 = performance.now();
    const step = (now: number) => {
      const t = Math.min(1, (now - t0) / duration);
      setShown(start + (end - start) * easeOut(t));
      if (t < 1) raf.current = requestAnimationFrame(step);
      else from.current = end;
    };
    raf.current = requestAnimationFrame(step);
  };

  // First appearance.
  useEffect(() => {
    const el = ref.current;
    if (!el || prefersReducedMotion() || typeof IntersectionObserver === "undefined") { seen.current = true; return; }
    const r = el.getBoundingClientRect();
    if (r.top < window.innerHeight && r.bottom > 0) { seen.current = true; return; }
    setShown(0);
    const io = new IntersectionObserver((entries) => {
      if (entries.some((e) => e.isIntersecting)) {
        io.disconnect();
        seen.current = true;
        run(0, from.current);
      }
    }, { threshold: 0.6 });
    io.observe(el);
    return () => { io.disconnect(); cancelAnimationFrame(raf.current); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Later updates (e.g. the status panel refreshing).
  useEffect(() => {
    if (value === from.current) return;
    const prev = from.current;
    from.current = value;
    if (!seen.current) return; // will animate to the new value when it appears
    if (prefersReducedMotion()) { setShown(value); return; }
    run(prev, value);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  const justify = align === "end" ? "justify-items-end" : align === "center" ? "justify-items-center" : "justify-items-start";
  return (
    <span ref={ref} className={`tabular-nums ${className}`}>
      <span className="sr-only">{fmt(value)}</span>
      <span aria-hidden className={`inline-grid ${justify}`}>
        <span className="invisible [grid-area:1/1]">{fmt(value)}</span>
        <span className="[grid-area:1/1]">{fmt(shown)}</span>
      </span>
    </span>
  );
}
