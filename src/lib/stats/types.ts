/**
 * StatsProvider — the single interface the leaderboards, player portal and
 * admin dashboard use to read player statistics. Swap implementations via
 * STATS_PROVIDER=database|sample.
 */

export const METRICS = ["kills", "deaths", "balance", "playtime"] as const;
export type Metric = (typeof METRICS)[number];

export const METRIC_LABELS: Record<Metric, string> = {
  kills: "Kills",
  deaths: "Deaths",
  balance: "Balance",
  playtime: "Playtime",
};

export interface PlayerStatRow {
  uuid: string;
  name: string;
  kills: number;
  deaths: number;
  /** null when the server never reported an economy balance for this player. */
  balance: number | null;
  playtimeSeconds: number;
  hearts: number | null;
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
  /** 1-based rank of the player for the metric (descending), or null. */
  getRank(uuid: string, metric: Metric): Promise<number | null>;
  getSummary(): Promise<StatsSummary>;
}

export function metricValue(row: PlayerStatRow, metric: Metric): number {
  switch (metric) {
    case "kills": return row.kills;
    case "deaths": return row.deaths;
    case "balance": return row.balance ?? 0;
    case "playtime": return row.playtimeSeconds;
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
  return v.toLocaleString("en-US", { maximumFractionDigits: 2 });
}
