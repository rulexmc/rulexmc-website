"use client";

import { useEffect, useRef } from "react";

/**
 * Lightweight drifting "ember" squares behind the hero.
 * Performance: starts only after the page is idle (never competes with first paint / hydration),
 * draws pre-rendered glow sprites instead of per-particle shadowBlur, caps the particle count
 * (fewer on small screens), renders at most 30 fps, and pauses when the hero is off-screen or the tab is hidden.
 * Disabled entirely for prefers-reduced-motion (and stops if the preference changes).
 */
export function ParticleCanvas() {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (media.matches) return;
    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) return;

    let w = 0, h = 0, raf = 0, last = 0;
    let visible = true, started = false, stopped = false;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    type P = { x: number; y: number; s: number; vy: number; vx: number; a: number; tw: number };
    let parts: P[] = [];

    // Glow sprite: one soft red square rendered once, then stamped with drawImage.
    const sprite = document.createElement("canvas");
    const SPR = 32;
    sprite.width = sprite.height = SPR;
    const sctx = sprite.getContext("2d")!;
    const g = sctx.createRadialGradient(SPR / 2, SPR / 2, 0, SPR / 2, SPR / 2, SPR / 2);
    g.addColorStop(0, "rgba(240, 65, 79, 0.55)");
    g.addColorStop(1, "rgba(208, 18, 41, 0)");
    sctx.fillStyle = g;
    sctx.fillRect(0, 0, SPR, SPR);
    sctx.fillStyle = "rgb(208, 18, 41)";
    sctx.fillRect(SPR / 2 - 2, SPR / 2 - 2, 4, 4);

    const spawn = (anywhere: boolean): P => ({
      x: Math.random() * w,
      y: anywhere ? Math.random() * h : h + 10,
      s: 1.5 + Math.random() * 3,
      vy: 0.3 + Math.random() * 0.9,
      vx: (Math.random() - 0.5) * 0.4,
      a: 0.25 + Math.random() * 0.6,
      tw: Math.random() * Math.PI * 2,
    });
    const resize = () => {
      w = canvas.clientWidth;
      h = canvas.clientHeight;
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const cap = w < 640 ? 28 : 60;
      const count = Math.min(cap, Math.round((w * h) / 24000));
      parts = Array.from({ length: count }, () => spawn(true));
    };
    const tick = (now: number) => {
      raf = requestAnimationFrame(tick);
      if (now - last < 33) return; // ~30 fps is plenty for slow embers
      last = now;
      ctx.clearRect(0, 0, w, h);
      for (const p of parts) {
        p.y -= p.vy;
        p.x += p.vx;
        p.tw += 0.06;
        if (p.y < -10) Object.assign(p, spawn(false));
        ctx.globalAlpha = p.a * (0.6 + 0.4 * Math.sin(p.tw));
        const size = p.s * 4;
        ctx.drawImage(sprite, p.x - size / 2, p.y - size / 2, size, size);
      }
      ctx.globalAlpha = 1;
    };
    const play = () => {
      cancelAnimationFrame(raf);
      if (started && visible && !document.hidden && !stopped) raf = requestAnimationFrame(tick);
    };

    const io = new IntersectionObserver(([e]) => { visible = !!e?.isIntersecting; play(); });
    io.observe(canvas);
    const onVis = () => play();
    const onMotion = () => {
      if (media.matches) { stopped = true; cancelAnimationFrame(raf); ctx.clearRect(0, 0, w, h); }
    };
    const onResize = () => { if (started) resize(); };

    // Defer until the browser is idle so the hero text paints and hydrates first.
    const begin = () => { started = true; resize(); play(); };
    const hasIdle = "requestIdleCallback" in window; // not in Safari
    const idle = hasIdle ? window.requestIdleCallback(begin, { timeout: 2500 }) : window.setTimeout(begin, 1200);

    window.addEventListener("resize", onResize);
    document.addEventListener("visibilitychange", onVis);
    media.addEventListener?.("change", onMotion);
    return () => {
      stopped = true;
      cancelAnimationFrame(raf);
      if (hasIdle) window.cancelIdleCallback(idle); else window.clearTimeout(idle);
      io.disconnect();
      window.removeEventListener("resize", onResize);
      document.removeEventListener("visibilitychange", onVis);
      media.removeEventListener?.("change", onMotion);
    };
  }, []);

  return <canvas ref={ref} aria-hidden className="pointer-events-none absolute inset-0 h-full w-full" />;
}
