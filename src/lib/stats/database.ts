import type { PlayerStats, Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import type {
  LeaderboardQuery, LeaderboardResult, Metric, PlayerStatRow, StatsProvider, StatsSummary,
} from "./types";

/** Reads the PlayerStats table, which the game server fills via POST /api/ingest/stats. */

const COLUMN: Record<Metric, "kills" | "deaths" | "balance" | "playtimeSeconds"> = {
  kills: "kills",
  deaths: "deaths",
  balance: "balance",
  playtime: "playtimeSeconds",
};

function toRow(p: PlayerStats): PlayerStatRow {
  return {
    uuid: p.uuid,
    name: p.name,
    kills: p.kills,
    deaths: p.deaths,
    balance: p.hasBalance ? Number(p.balance) : null,
    playtimeSeconds: p.playtimeSeconds,
    hearts: p.hearts,
    lastSeen: p.lastSeen,
    updatedAt: p.updatedAt,
  };
}

export class DatabaseStatsProvider implements StatsProvider {
  readonly id = "database" as const;
  readonly live = true;
  readonly label = "Live server data";

  async getLeaderboard(q: LeaderboardQuery): Promise<LeaderboardResult> {
    const col = COLUMN[q.metric];
    const where: Prisma.PlayerStatsWhereInput = {};
    if (q.metric === "balance") where.hasBalance = true;
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

    // True rank within the full (unsearched) board, computed per row.
    const ranked = await Promise.all(
      rows.map(async (r) => {
        const value = r[col];
        const ahead = await prisma.playerStats.count({
          where: {
            ...where,
            OR: [
              { [col]: q.order === "desc" ? { gt: value } : { lt: value } },
              { [col]: value, nameLower: { lt: r.nameLower } },
            ],
          },
        });
        return { ...toRow(r), rank: ahead + 1 };
      }),
    );
    return { rows: ranked, total, page, pageSize: q.pageSize, pageCount };
  }

  async getPlayer(nameOrUuid: string) {
    const k = nameOrUuid.toLowerCase();
    const p = await prisma.playerStats.findFirst({ where: { OR: [{ uuid: k }, { nameLower: k }] }, orderBy: { updatedAt: "desc" } });
    return p ? toRow(p) : null;
  }

  async getRank(uuid: string, metric: Metric) {
    const col = COLUMN[metric];
    const p = await prisma.playerStats.findUnique({ where: { uuid } });
    if (!p) return null;
    if (metric === "balance" && !p.hasBalance) return null;
    const ahead = await prisma.playerStats.count({
      where: { ...(metric === "balance" ? { hasBalance: true } : {}), [col]: { gt: p[col] } },
    });
    return ahead + 1;
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
