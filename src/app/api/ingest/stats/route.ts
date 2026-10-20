import { NextResponse, type NextRequest } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { checkIngestAuth, readJson } from "@/lib/ingest-auth";
import { ingestStatsSchema } from "@/lib/validation";

export const dynamic = "force-dynamic";

/**
 * POST /api/ingest/stats — upsert player stats from the game server.
 * Only the fields present in each player object are updated (partial merge),
 * so a LifeStealZ hook can send hearts while a stats-file sync sends playtime.
 */
export async function POST(req: NextRequest) {
  const denied = await checkIngestAuth(req);
  if (denied) return denied;

  let body: unknown;
  try {
    body = await readJson(req);
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Invalid JSON" }, { status: 400 });
  }
  const parsed = ingestStatsSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Validation failed", issues: parsed.error.issues.slice(0, 20) }, { status: 422 });
  }
  const source = parsed.data.source ?? "ingest";

  await prisma.$transaction(
    parsed.data.players.map((p) => {
      const data = {
        name: p.name,
        nameLower: p.name.toLowerCase(),
        source,
        ...(p.kills !== undefined && { kills: p.kills }),
        ...(p.deaths !== undefined && { deaths: p.deaths }),
        ...(p.playtimeSeconds !== undefined && { playtimeSeconds: p.playtimeSeconds }),
        ...(p.balance !== undefined && { balance: new Prisma.Decimal(p.balance.toFixed(2)), hasBalance: true }),
        ...(p.hearts !== undefined && { hearts: p.hearts }),
        ...(p.lastSeen !== undefined && { lastSeen: new Date(p.lastSeen) }),
      };
      return prisma.playerStats.upsert({ where: { uuid: p.uuid }, create: { uuid: p.uuid, ...data }, update: data });
    }),
  );

  return NextResponse.json({ ok: true, upserted: parsed.data.players.length });
}
