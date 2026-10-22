import type {
  LeaderboardQuery, LeaderboardResult, Metric, PlayerStatRow, StatsProvider, StatsSummary,
} from "./types";
import { OPTIONAL_METRICS, metricValue } from "./types";

/**
 * SAMPLE / DEV provider. Deterministic fake players for local development and
 * design previews. The UI must always badge this data as SAMPLE DATA.
 */

const NAMES = [
  "CrimsonFang", "HeartReaper", "VoidWalker_", "Blaze_Kn1ght", "ObsidianOwl", "RedstoneRex", "NetherNova",
  "IronHeartz", "SkyClutch", "EnderAce", "LavaLurker", "PixelPaladin", "Creep3rKing", "FrostByteMC",
  "DiamondDuchess", "BedrockBaron", "TotemTaker", "ShadowSmite", "AnvilAndy", "GhastGhost", "Wither_Wolf",
  "QuartzQueen", "CobbleCrusher", "EmeraldEdge", "SilkTouchSam", "MendingMax", "SharpnessSix", "PearlPhantom",
  "BastionBoss", "AxolotlArmy", "PiglinPrince", "RuneRaider", "SoulSandSage", "TridentTide", "ElytraEcho",
  "CritComboKid", "StrafeStorm", "RodRusher", "PotPvPPro", "HeartHoarder",
];

function mulberry32(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function buildSamplePlayers(): PlayerStatRow[] {
  const rand = mulberry32(1337);
  // Separate stream so adding fields never changes the existing sample values.
  const levelRand = mulberry32(4242);
  return NAMES.map((name, i) => {
    const hex = (n: number) => Math.floor(rand() * 16 ** n).toString(16).padStart(n, "0");
    const kills = Math.floor(rand() * 900);
    return {
      uuid: `${hex(8)}-${hex(4)}-4${hex(3)}-a${hex(3)}-${hex(12)}`,
      name,
      kills,
      deaths: Math.floor(rand() * 600),
      balance: Math.round(rand() * 2_500_000) / 100,
      playtimeSeconds: Math.floor(rand() * 400 * 3600),
      hearts: 1 + Math.floor(rand() * 20),
      // Every 8th sample player has no reported level, to exercise the "not reported" states.
      level: i % 8 === 7 ? null : 1 + Math.floor(levelRand() * 120),
      lastSeen: new Date(Date.UTC(2026, 0, 1) + i * 3600_000),
      updatedAt: null,
    };
  });
}

export class SampleStatsProvider implements StatsProvider {
  readonly id = "sample" as const;
  readonly live = false;
  readonly label = "Sample data (development)";
  private players = buildSamplePlayers();

  /** Same ordering as the database provider: metric, then lower-case name; unreported optional metrics are excluded. */
  private sorted(metric: Metric, order: "asc" | "desc") {
    const dir = order === "asc" ? 1 : -1;
    const eligible = OPTIONAL_METRICS.has(metric) ? this.players.filter((p) => metricValue(p, metric) !== null) : this.players;
    const lower = (n: string) => n.toLowerCase();
    return [...eligible].sort(
      (a, b) =>
        dir * ((metricValue(a, metric) ?? 0) - (metricValue(b, metric) ?? 0)) ||
        (lower(a.name) < lower(b.name) ? -1 : lower(a.name) > lower(b.name) ? 1 : 0),
    );
  }

  async getLeaderboard(q: LeaderboardQuery): Promise<LeaderboardResult> {
    const ranked = this.sorted(q.metric, q.order).map((r, i) => ({ ...r, rank: i + 1 }));
    const s = q.search?.toLowerCase();
    const filtered = s ? ranked.filter((r) => r.name.toLowerCase().includes(s)) : ranked;
    const pageCount = Math.max(1, Math.ceil(filtered.length / q.pageSize));
    const page = Math.min(Math.max(1, q.page), pageCount);
    return {
      rows: filtered.slice((page - 1) * q.pageSize, page * q.pageSize),
      total: filtered.length,
      page,
      pageSize: q.pageSize,
      pageCount,
    };
  }

  async getPlayer(nameOrUuid: string) {
    const k = nameOrUuid.toLowerCase();
    return this.players.find((p) => p.uuid === k || p.name.toLowerCase() === k) ?? null;
  }

  async getRank(uuid: string, metric: Metric) {
    const idx = this.sorted(metric, "desc").findIndex((p) => p.uuid === uuid);
    return idx === -1 ? null : idx + 1;
  }

  async getSummary(): Promise<StatsSummary> {
    return {
      players: this.players.length,
      totalKills: this.players.reduce((a, p) => a + p.kills, 0),
      totalDeaths: this.players.reduce((a, p) => a + p.deaths, 0),
      totalPlaytimeSeconds: this.players.reduce((a, p) => a + p.playtimeSeconds, 0),
      lastUpdated: null,
    };
  }
}
