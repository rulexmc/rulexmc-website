/**
 * StatsProvider — the single interface the leaderboards, player profiles, player portal and
 * admin dashboard use to read player statistics. Swap implementations via
 * STATS_PROVIDER=database|sample.
 */

/** Leaderboard metrics, in display (tab) order. */
export const METRICS = ["kills", "hearts", "playtime", "balance", "level", "deaths"] as const;
export type Metric = (typeof METRICS)[number];

export const METRIC_LABELS: Record<Metric, string> = {
  kills: "Kills",
  hearts: "Hearts",
  playtime: "Playtime",
  balance: "Balance",
  level: "Level",
  deaths: "Deaths",
};

/** One-line explanation of each board, shown under the tabs. */
export const METRIC_BLURB: Record<Metric, string> = {
  kills: "Total player kills across the network.",
  hearts: "Current Lifesteal hearts. Only players whose hearts were reported by the server are ranked.",
  playtime: "Total time played on the network.",
  balance: "Economy balance. Only players whose balance was reported by the server are ranked.",
  level: "Aurora XP level. Only players whose level was reported by the server are ranked.",
  deaths: "Total deaths. Sort ascending to find the most careful survivors.",
};

/** Metrics that are optional per player (null = never reported); unreported players are left off those boards. */
export const OPTIONAL_METRICS: ReadonlySet<Metric> = new Set<Metric>(["hearts", "balance", "level"]);

export function isMetric(v: unknown): v is Metric {
  return typeof v === "string" && (METRICS as readonly string[]).includes(v);
}

export interface PlayerStatRow {
  uuid: string;
  name: string;
  kills: number;
  deaths: number;
  /** null when the server never reported an economy balance for this player. */
  balance: number | null;
  playtimeSeconds: number;
  hearts: number | null;
  /** Aurora XP level; null when never reported. */
  level: number | null;
  lastSeen: Date | null;
  updatedAt: Date | null;
}

export interface LeaderboardQuery {
  metric: Metric;
  order: "desc" | "asc";
  page: number;
  pageSize: number;
  search?: string;
}

export interface LeaderboardEntry extends PlayerStatRow {
  rank: number;
}

export interface LeaderboardResult {
  rows: LeaderboardEntry[];
  total: number;
  page: number;
  pageSize: number;
  pageCount: number;
}

export interface StatsSummary {
  players: number;
  totalKills: number;
  totalDeaths: number;
  totalPlaytimeSeconds: number;
  lastUpdated: Date | null;
}

export interface StatsProvider {
  readonly id: "database" | "sample";
  /** True only when data originates from the real game server. */
  readonly live: boolean;
  readonly label: string;
  getLeaderboard(q: LeaderboardQuery): Promise<LeaderboardResult>;
  getPlayer(nameOrUuid: string): Promise<PlayerStatRow | null>;
  /** 1-based rank of the player for the metric (descending, same tie-break as the leaderboard), or null when unranked. */
  getRank(uuid: string, metric: Metric): Promise<number | null>;
  getSummary(): Promise<StatsSummary>;
}

/** The raw value used for ranking, or null when the player has no value for that metric. */
export function metricValue(row: PlayerStatRow, metric: Metric): number | null {
  switch (metric) {
    case "kills": return row.kills;
    case "deaths": return row.deaths;
    case "balance": return row.balance;
    case "playtime": return row.playtimeSeconds;
    case "hearts": return row.hearts;
    case "level": return row.level;
  }
}

export function formatPlaytime(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h >= 24) return `${Math.floor(h / 24)}d ${h % 24}h`;
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

export function formatBalance(v: number | null): string {
  if (v === null) return "—";
  // Whole amounts stay whole ("1,200"); fractional ones always show cents ("1,234.50", not "1,234.5").
  return v.toLocaleString("en-US", Number.isInteger(v) ? { maximumFractionDigits: 0 } : { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

/** Display string for a metric; "—" when not reported. */
export function formatMetric(row: PlayerStatRow, metric: Metric): string {
  const v = metricValue(row, metric);
  if (v === null) return "—";
  switch (metric) {
    case "balance": return formatBalance(v);
    case "playtime": return formatPlaytime(v);
    default: return v.toLocaleString("en-US");
  }
}

/** Kills per death, as shown on profiles (deaths of 0 count as 1). */
export function kdRatio(row: Pick<PlayerStatRow, "kills" | "deaths">): string {
  return (row.kills / Math.max(1, row.deaths)).toFixed(2);
}
