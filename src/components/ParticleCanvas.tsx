"use client";

import { useEffect, useRef } from "react";

/** Lightweight drifting "ember" squares. Disabled entirely for prefers-reduced-motion. */
export function ParticleCanvas() {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (media.matches) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let w = 0, h = 0, raf = 0, running = true;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    type P = { x: number; y: number; s: number; vy: number; vx: number; a: number; tw: number };
    let parts: P[] = [];

    const resize = () => {
      w = canvas.clientWidth;
      h = canvas.clientHeight;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const count = Math.min(70, Math.round((w * h) / 22000));
      parts = Array.from({ length: count }, () => spawn(true));
    };
    const spawn = (anywhere: boolean): P => ({
      x: Math.random() * w,
      y: anywhere ? Math.random() * h : h + 10,
      s: 1.5 + Math.random() * 3,
      vy: 0.15 + Math.random() * 0.45,
      vx: (Math.random() - 0.5) * 0.2,
      a: 0.2 + Math.random() * 0.6,
      tw: Math.random() * Math.PI * 2,
    });
    const tick = () => {
      if (!running) return;
      ctx.clearRect(0, 0, w, h);
      for (const p of parts) {
        p.y -= p.vy;
        p.x += p.vx;
        p.tw += 0.03;
        if (p.y < -10) Object.assign(p, spawn(false));
        const alpha = p.a * (0.6 + 0.4 * Math.sin(p.tw));
        ctx.fillStyle = `rgba(208, 18, 41, ${alpha})`;
        ctx.shadowColor = "rgba(208, 18, 41, 0.8)";
        ctx.shadowBlur = 8;
        ctx.fillRect(p.x, p.y, p.s, p.s);
      }
      raf = requestAnimationFrame(tick);
    };
    const onVis = () => {
      running = !document.hidden;
      cancelAnimationFrame(raf);
      if (running) raf = requestAnimationFrame(tick);
    };

    resize();
    raf = requestAnimationFrame(tick);
    window.addEventListener("resize", resize);
    document.addEventListener("visibilitychange", onVis);
    return () => {
      running = false;
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
      document.removeEventListener("visibilitychange", onVis);
    };
  }, []);

  return <canvas ref={ref} aria-hidden className="pointer-events-none absolute inset-0 h-full w-full" />;
}
