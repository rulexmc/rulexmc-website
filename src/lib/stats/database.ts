import type { PlayerStats, Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import type {
  LeaderboardQuery, LeaderboardResult, Metric, PlayerStatRow, StatsProvider, StatsSummary,
} from "./types";

/** Reads the PlayerStats table, which the game server fills via POST /api/ingest/stats. */

type Column = "kills" | "deaths" | "balance" | "playtimeSeconds" | "hearts" | "level";

const COLUMN: Record<Metric, Column> = {
  kills: "kills",
  deaths: "deaths",
  balance: "balance",
  playtime: "playtimeSeconds",
  hearts: "hearts",
  level: "level",
};

/** Players eligible for a board: optional metrics only rank players whose value was reported. */
export function eligibleWhere(metric: Metric): Prisma.PlayerStatsWhereInput {
  switch (metric) {
    case "balance": return { hasBalance: true };
    case "hearts": return { hearts: { not: null } };
    case "level": return { level: { not: null } };
    default: return {};
  }
}

function toRow(p: PlayerStats): PlayerStatRow {
  return {
    uuid: p.uuid,
    name: p.name,
    kills: p.kills,
    deaths: p.deaths,
    balance: p.hasBalance ? Number(p.balance) : null,
    playtimeSeconds: p.playtimeSeconds,
    hearts: p.hearts,
    level: p.level,
    lastSeen: p.lastSeen,
    updatedAt: p.updatedAt,
  };
}

export class DatabaseStatsProvider implements StatsProvider {
  readonly id = "database" as const;
  readonly live = true;
  readonly label = "Live server data";

  /** Number of eligible players ranked ahead of `p` (metric, then lower-case name, as the board orders them). */
  private async ahead(p: PlayerStats, metric: Metric, order: "asc" | "desc"): Promise<number> {
    const col = COLUMN[metric];
    const value = p[col];
    return prisma.playerStats.count({
      where: {
        ...eligibleWhere(metric),
        OR: [
          { [col]: order === "desc" ? { gt: value } : { lt: value } },
          { [col]: value, nameLower: { lt: p.nameLower } },
        ],
      },
    });
  }

  async getLeaderboard(q: LeaderboardQuery): Promise<LeaderboardResult> {
    const col = COLUMN[q.metric];
    const where = eligibleWhere(q.metric);
    const search = q.search?.toLowerCase().trim();
    const filtered: Prisma.PlayerStatsWhereInput = search ? { ...where, nameLower: { contains: search } } : where;

    const total = await prisma.playerStats.count({ where: filtered });
    const pageCount = Math.max(1, Math.ceil(total / q.pageSize));
    const page = Math.min(Math.max(1, q.page), pageCount);
    const rows = await prisma.playerStats.findMany({
      where: filtered,
      orderBy: [{ [col]: q.order }, { nameLower: "asc" }],
      skip: (page - 1) * q.pageSize,
      take: q.pageSize,
    });

    // Without a search the rank is simply the position; with one, compute the true rank within the full board.
    const ranked = search
      ? await Promise.all(rows.map(async (r) => ({ ...toRow(r), rank: (await this.ahead(r, q.metric, q.order)) + 1 })))
      : rows.map((r, i) => ({ ...toRow(r), rank: (page - 1) * q.pageSize + i + 1 }));
    return { rows: ranked, total, page, pageSize: q.pageSize, pageCount };
  }

  async getPlayer(nameOrUuid: string) {
    const k = nameOrUuid.toLowerCase();
    const p = await prisma.playerStats.findFirst({ where: { OR: [{ uuid: k }, { nameLower: k }] }, orderBy: { updatedAt: "desc" } });
    return p ? toRow(p) : null;
  }

  async getRank(uuid: string, metric: Metric) {
    const p = await prisma.playerStats.findUnique({ where: { uuid } });
    if (!p) return null;
    const value = p[COLUMN[metric]];
    if (value === null || (metric === "balance" && !p.hasBalance)) return null;
    return (await this.ahead(p, metric, "desc")) + 1;
  }

  async getSummary(): Promise<StatsSummary> {
    const agg = await prisma.playerStats.aggregate({
      _count: { _all: true },
      _sum: { kills: true, deaths: true, playtimeSeconds: true },
      _max: { updatedAt: true },
    });
    return {
      players: agg._count._all,
      totalKills: agg._sum.kills ?? 0,
      totalDeaths: agg._sum.deaths ?? 0,
      totalPlaytimeSeconds: agg._sum.playtimeSeconds ?? 0,
      lastUpdated: agg._max.updatedAt,
    };
  }
}
