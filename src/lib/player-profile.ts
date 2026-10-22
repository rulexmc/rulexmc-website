import "server-only";
import { cache } from "react";
import { prisma } from "@/lib/db";
import { getStatsProvider, METRICS, type Metric, type PlayerStatRow, type StatsProvider } from "@/lib/stats";
import { MC_USERNAME } from "@/lib/validation";

export interface VerifiedLink {
  mcUsername: string;
  verifiedAt: Date | null;
}

export type PlayerProfile =
  | { kind: "invalid" }
  | { kind: "not-found" }
  | { kind: "unavailable"; name: string; live: boolean }
  | {
      kind: "found";
      /** Canonical in-game spelling (from stats when present, else from the verified link). */
      name: string;
      live: boolean;
      providerLabel: string;
      stats: PlayerStatRow | null;
      ranks: Record<Metric, number | null>;
      verified: VerifiedLink | null;
    };

/** Rank of a player on every board, fetched in parallel; failures count as unranked. */
export async function getAllRanks(provider: StatsProvider, uuid: string): Promise<Record<Metric, number | null>> {
  const entries = await Promise.all(METRICS.map(async (m) => [m, await provider.getRank(uuid, m).catch(() => null)] as const));
  return Object.fromEntries(entries) as Record<Metric, number | null>;
}

/**
 * A website account that has proven ownership of this Minecraft name in-game. When stats are present
 * and the account has a verified UUID, the UUIDs must match (protects against name re-use).
 */
async function findVerifiedLink(name: string, stats: PlayerStatRow | null): Promise<VerifiedLink | null> {
  const user = await prisma.user.findFirst({
    where: { mcVerified: true, mcUsername: { equals: name, mode: "insensitive" } },
    select: { mcUsername: true, mcUuid: true, mcVerifiedAt: true },
  });
  if (!user?.mcUsername) return null;
  if (stats && user.mcUuid && user.mcUuid.toLowerCase() !== stats.uuid.toLowerCase()) return null;
  return { mcUsername: user.mcUsername, verifiedAt: user.mcVerifiedAt };
}

/**
 * Everything the public /player/[name] page shows. Never invents data: a player "exists" only when the
 * stats source knows them or a website account has verified the name in-game.
 */
export const loadPlayerProfile = cache(async (rawName: string): Promise<PlayerProfile> => {
  const name = rawName.trim();
  if (!MC_USERNAME.test(name)) return { kind: "invalid" };
  const provider = getStatsProvider();

  let stats: PlayerStatRow | null;
  try {
    stats = await provider.getPlayer(name);
  } catch (err) {
    console.error("player lookup failed", err);
    return { kind: "unavailable", name, live: provider.live };
  }
  // Only resolve by name here (never by UUID) so /player/<uuid> can't be used to probe accounts.
  if (stats && stats.name.toLowerCase() !== name.toLowerCase()) stats = null;

  const verified = await findVerifiedLink(name, stats).catch(() => null);
  if (!stats && !verified) return { kind: "not-found" };

  const ranks = stats
    ? await getAllRanks(provider, stats.uuid)
    : (Object.fromEntries(METRICS.map((m) => [m, null])) as Record<Metric, number | null>);

  return {
    kind: "found",
    name: stats?.name ?? verified!.mcUsername,
    live: provider.live,
    providerLabel: provider.label,
    stats,
    ranks,
    verified,
  };
});
