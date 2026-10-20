import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { checkIngestAuth, readJson } from "@/lib/ingest-auth";
import { audit } from "@/lib/audit";

export const dynamic = "force-dynamic";

/** GET: PAID purchases not yet delivered in-game (for a server plugin to poll). */
export async function GET(req: NextRequest) {
  const denied = await checkIngestAuth(req);
  if (denied) return denied;
  const rows = await prisma.purchase.findMany({
    where: { status: "PAID", delivered: false },
    include: { listing: { select: { slug: true, name: true, kind: true } } },
    orderBy: { createdAt: "asc" },
    take: 100,
  });
  return NextResponse.json({
    purchases: rows.map((r) => ({ id: r.id, mcUsername: r.mcUsername, listing: r.listing, createdAt: r.createdAt })),
  });
}

const DeliveredSchema = z.object({ delivered: z.array(z.string().min(1).max(40)).min(1).max(100) });

/** POST: mark purchases as delivered after the plugin has granted them. */
export async function POST(req: NextRequest) {
  const denied = await checkIngestAuth(req);
  if (denied) return denied;
  const parsed = DeliveredSchema.safeParse(await readJson(req, 16_384).catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Validation failed" }, { status: 422 });
  const res = await prisma.purchase.updateMany({ where: { id: { in: parsed.data.delivered }, status: "PAID" }, data: { delivered: true } });
  await audit(null, "store.purchases_delivered", null, { ids: parsed.data.delivered });
  return NextResponse.json({ ok: true, updated: res.count });
}
