import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { checkIngestAuth, readJson } from "@/lib/ingest-auth";
import { ingestVerifySchema } from "@/lib/validation";
import { audit, logActivity } from "@/lib/audit";

export const dynamic = "force-dynamic";

/**
 * POST /api/ingest/verify — called by the game server when a player runs `/verify RX-XXXXXX`.
 * Body: { code, name, uuid } where name/uuid come from the authenticated in-game player.
 */
export async function POST(req: NextRequest) {
  const denied = await checkIngestAuth(req);
  if (denied) return denied;
  let body: unknown;
  try {
    body = await readJson(req, 4096);
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const parsed = ingestVerifySchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ ok: false, message: "Invalid request" }, { status: 422 });
  const { code, name, uuid } = parsed.data;

  const link = await prisma.linkCode.findUnique({ where: { code } });
  if (!link || link.usedAt || link.expiresAt < new Date()) {
    return NextResponse.json({ ok: false, message: "Code invalid or expired. Generate a new one on the website." }, { status: 404 });
  }
  if (link.mcUsername.toLowerCase() !== name.toLowerCase()) {
    return NextResponse.json({ ok: false, message: "This code was generated for a different username." }, { status: 409 });
  }
  const conflict = await prisma.user.findFirst({ where: { mcUuid: uuid, mcVerified: true, NOT: { id: link.userId } } });
  if (conflict) return NextResponse.json({ ok: false, message: "This Minecraft account is already linked to another website account." }, { status: 409 });

  await prisma.$transaction([
    prisma.linkCode.update({ where: { id: link.id }, data: { usedAt: new Date() } }),
    prisma.user.update({
      where: { id: link.userId },
      data: { mcUsername: name, mcUuid: uuid, mcVerified: true, mcVerifiedAt: new Date() },
    }),
  ]);
  await logActivity(link.userId, "mc.verified", `Verified Minecraft account ${name}`);
  await audit(null, "account.mc_verified", name, { userId: link.userId, uuid });
  return NextResponse.json({ ok: true, message: "Account verified! Your website profile is now linked." });
}
