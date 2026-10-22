"use client";

import { useEffect, useRef, useState } from "react";
import { easeOut, prefersReducedMotion } from "@/lib/client/motion";

const fmt = (n: number) => Math.round(n).toLocaleString("en-US");

/**
 * Animated integer for LIVE numbers only (never use it for sample data).
 * - The DOM text is always the real value (no-JS, crawlers, screen readers and aria-live regions see it
 *   exactly once and never mid-animation). The tween is painted on top with a CSS pseudo-element while the
 *   real text is transparent, so its width is reserved and nothing shifts (see `.countup` in globals.css).
 * - Counts up from 0 the first time it scrolls into view, unless it was already visible on load
 *   (that would flash the real number, then 0). Later value changes tween from the old value.
 * - Reduced motion: no animation at all.
 */
export function CountUp({ value, duration = 900, className = "", align = "start" }: { value: number; duration?: number; className?: string; align?: "start" | "end" }) {
  const [tween, setTween] = useState<number | null>(null);
  const ref = useRef<HTMLSpanElement>(null);
  const shownValue = useRef(value);
  const raf = useRef(0);
  const seen = useRef(false);

  const run = (start: number, end: number) => {
    cancelAnimationFrame(raf.current);
    if (start === end) { setTween(null); return; }
    const t0 = performance.now();
    const step = (now: number) => {
      const t = Math.min(1, (now - t0) / duration);
      if (t < 1) {
        setTween(start + (end - start) * easeOut(t));
        raf.current = requestAnimationFrame(step);
      } else {
        setTween(null);
      }
    };
    raf.current = requestAnimationFrame(step);
  };

  // First appearance.
  useEffect(() => {
    const el = ref.current;
    if (!el || prefersReducedMotion() || typeof IntersectionObserver === "undefined") { seen.current = true; return; }
    const r = el.getBoundingClientRect();
    if (r.top < window.innerHeight && r.bottom > 0) { seen.current = true; return; }
    setTween(0);
    const io = new IntersectionObserver((entries) => {
      if (entries.some((e) => e.isIntersecting)) {
        io.disconnect();
        seen.current = true;
        run(0, shownValue.current);
      }
    }, { threshold: 0.6 });
    io.observe(el);
    return () => { io.disconnect(); cancelAnimationFrame(raf.current); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Later updates (e.g. the status panel refreshing every minute).
  useEffect(() => {
    const prev = shownValue.current;
    if (value === prev) return;
    shownValue.current = value;
    if (!seen.current) return; // it will count up to the new value when it appears
    if (prefersReducedMotion()) { setTween(null); return; }
    run(prev, value);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  return (
    <span
      ref={ref}
      className={`countup ${className}`}
      data-align={align}
      data-anim={tween === null ? undefined : "1"}
      data-shown={tween === null ? undefined : fmt(tween)}
    >
      <span>{fmt(value)}</span>
    </span>
  );
}
