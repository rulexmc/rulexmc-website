import "server-only";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { getClientIp } from "@/lib/request";

export async function audit(
  actorId: string | null,
  action: string,
  target?: string | null,
  meta?: Prisma.InputJsonValue,
): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: { actorId, action, target: target ?? null, meta: meta ?? undefined, ip: await getClientIp().catch(() => null) },
    });
  } catch (err) {
    console.error("audit log write failed", err);
  }
}

export async function logActivity(userId: string, type: string, message: string): Promise<void> {
  await prisma.activity.create({ data: { userId, type, message } }).catch(() => undefined);
}
