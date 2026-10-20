"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth/session";
import { generateLinkCode } from "@/lib/auth/token";
import { LIMITS, rateLimit } from "@/lib/rate-limit";
import { fieldErrors, mcUsernameSchema, reportSchema, type FieldErrors } from "@/lib/validation";
import { logActivity } from "@/lib/audit";

export interface FormState {
  ok?: string;
  error?: string;
  fields?: FieldErrors;
}

export async function linkUsernameAction(_prev: FormState, form: FormData): Promise<FormState> {
  const user = await requireUser();
  const parsed = mcUsernameSchema.safeParse(form.get("mcUsername"));
  if (!parsed.success) return { fields: { mcUsername: [parsed.error.issues[0]?.message ?? "Invalid username"] } };
  const name = parsed.data;

  const taken = await prisma.user.findFirst({
    where: { mcUsername: { equals: name, mode: "insensitive" }, mcVerified: true, NOT: { id: user.id } },
    select: { id: true },
  });
  if (taken) return { fields: { mcUsername: ["This username is already verified by another account"] } };

  const changed = user.mcUsername?.toLowerCase() !== name.toLowerCase();
  await prisma.user.update({
    where: { id: user.id },
    data: changed ? { mcUsername: name, mcUuid: null, mcVerified: false, mcVerifiedAt: null } : { mcUsername: name },
  });
  if (changed) await prisma.linkCode.deleteMany({ where: { userId: user.id, usedAt: null } });
  await logActivity(user.id, "mc.linked", `Linked Minecraft username ${name} (unverified)`);
  revalidatePath("/portal");
  return { ok: changed ? `Linked ${name}. Verify it in-game to prove ownership.` : "Username unchanged." };
}

export async function unlinkUsernameAction(): Promise<void> {
  const user = await requireUser();
  await prisma.user.update({ where: { id: user.id }, data: { mcUsername: null, mcUuid: null, mcVerified: false, mcVerifiedAt: null } });
  await prisma.linkCode.deleteMany({ where: { userId: user.id, usedAt: null } });
  await logActivity(user.id, "mc.unlinked", "Unlinked Minecraft username");
  revalidatePath("/portal");
}

export async function createLinkCodeAction(_prev: FormState): Promise<FormState> {
  const user = await requireUser();
  if (!user.mcUsername) return { error: "Link a Minecraft username first." };
  if (user.mcVerified) return { ok: "Already verified." };
  const rl = await rateLimit(`linkcode:${user.id}`, LIMITS.linkCode.limit, LIMITS.linkCode.windowMs);
  if (!rl.ok) return { error: "Too many codes requested. Try again later." };
  await prisma.linkCode.deleteMany({ where: { userId: user.id, usedAt: null } });
  await prisma.linkCode.create({
    data: { userId: user.id, code: generateLinkCode(), mcUsername: user.mcUsername, expiresAt: new Date(Date.now() + 15 * 60_000) },
  });
  revalidatePath("/portal");
  return { ok: "New verification code generated." };
}

export async function submitReportAction(_prev: FormState, form: FormData): Promise<FormState> {
  const user = await requireUser("/portal/reports");
  const rl = await rateLimit(`report:${user.id}`, LIMITS.report.limit, LIMITS.report.windowMs);
  if (!rl.ok) return { error: "You have submitted several reports recently. Please wait before sending another." };
  const parsed = reportSchema.safeParse({
    targetName: form.get("targetName"),
    category: form.get("category"),
    description: form.get("description"),
    evidenceUrl: form.get("evidenceUrl") || undefined,
  });
  if (!parsed.success) return { fields: fieldErrors(parsed.error) };
  await prisma.report.create({ data: { ...parsed.data, reporterId: user.id } });
  await logActivity(user.id, "report.submitted", `Reported ${parsed.data.targetName} (${parsed.data.category.toLowerCase().replace("_", " ")})`);
  revalidatePath("/portal/reports");
  return { ok: "Report submitted. Staff will review it soon." };
}
