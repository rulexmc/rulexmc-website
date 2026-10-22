import { isMetric, type Metric } from "@/lib/stats/types";

export const LEADERBOARD_PAGE_SIZE = 20;

export interface LeaderboardParams {
  metric: Metric;
  order: "asc" | "desc";
  page: number;
  q: string;
}

export type RawLeaderboardParams = { metric?: string | string[]; order?: string | string[]; page?: string | string[]; q?: string | string[] };

const first = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);

/** Parse and sanitise /leaderboards query parameters. Unknown values fall back to safe defaults. */
export function parseLeaderboardParams(sp: RawLeaderboardParams): LeaderboardParams {
  const m = first(sp.metric);
  const metric: Metric = isMetric(m) ? m : "kills";
  const order = first(sp.order) === "asc" ? "asc" : "desc";
  const page = Math.max(1, Math.min(10_000, Number.parseInt(first(sp.page) ?? "1", 10) || 1));
  const q = (first(sp.q) ?? "").trim().replace(/[^A-Za-z0-9_]/g, "").slice(0, 16);
  return { metric, order, page, q };
}

/** Canonical URL for a leaderboard view; default values are omitted to keep URLs short. */
export function leaderboardHref(base: LeaderboardParams, patch: Partial<LeaderboardParams> = {}): string {
  const v = { ...base, ...patch };
  const p = new URLSearchParams();
  if (v.metric !== "kills") p.set("metric", v.metric);
  if (v.order !== "desc") p.set("order", v.order);
  if (v.q) p.set("q", v.q);
  if (v.page > 1) p.set("page", String(v.page));
  const s = p.toString();
  return `/leaderboards${s ? `?${s}` : ""}`;
}

/** Profile URL for a player name. */
export function playerHref(name: string): string {
  return `/player/${encodeURIComponent(name)}`;
}
