/** Client-side motion helpers. Every animation in the app must check this first. */
export function prefersReducedMotion(): boolean {
  return typeof window !== "undefined" && !!window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
}

/** easeOutCubic */
export function easeOut(t: number): number {
  return 1 - (1 - t) ** 3;
}
