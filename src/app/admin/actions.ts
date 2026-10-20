"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth/session";
import { audit } from "@/lib/audit";
import { announcementSchema, contentBlockSchema, storeListingSchema } from "@/lib/validation";
import { z } from "zod";

const idSchema = z.string().min(1).max(40);
const bool = (f: FormData, k: string) => f.get(k) === "on" || f.get(k) === "true";

function fail(path: string, message: string): never {
  redirect(`${path}?error=${encodeURIComponent(message)}`);
}
function done(path: string, message: string): never {
  revalidatePath(path);
  revalidatePath("/");
  redirect(`${path}?ok=${encodeURIComponent(message)}`);
}
function firstIssue(e: z.ZodError) {
  const i = e.issues[0];
  return i ? `${i.path.join(".") || "input"}: ${i.message}` : "Invalid input";
}

/* ---------- Announcements ---------- */
export async function saveAnnouncement(form: FormData) {
  const admin = await requireAdmin();
  const path = "/admin/announcements";
  const parsed = announcementSchema.safeParse({
    title: form.get("title"), body: form.get("body"), published: bool(form, "published"), pinned: bool(form, "pinned"),
  });
  if (!parsed.success) fail(path, firstIssue(parsed.error));
  const id = form.get("id");
  if (id) {
    const ok = idSchema.safeParse(id);
    if (!ok.success) fail(path, "Bad id");
    await prisma.announcement.update({ where: { id: ok.data }, data: parsed.data });
    await audit(admin.id, "announcement.update", ok.data, { title: parsed.data.title });
    done(path, "Announcement updated");
  }
  const a = await prisma.announcement.create({ data: { ...parsed.data, authorId: admin.id } });
  await audit(admin.id, "announcement.create", a.id, { title: a.title });
  done(path, "Announcement created");
}

export async function deleteAnnouncement(form: FormData) {
  const admin = await requireAdmin();
  const id = idSchema.parse(form.get("id"));
  await prisma.announcement.delete({ where: { id } }).catch(() => null);
  await audit(admin.id, "announcement.delete", id);
  done("/admin/announcements", "Announcement deleted");
}

/* ---------- Content blocks ---------- */
export async function saveContentBlock(form: FormData) {
  const admin = await requireAdmin();
  const path = "/admin/content";
  const parsed = contentBlockSchema.safeParse({ key: form.get("key"), title: form.get("title"), body: form.get("body") });
  if (!parsed.success) fail(path, firstIssue(parsed.error));
  await prisma.contentBlock.upsert({ where: { key: parsed.data.key }, create: parsed.data, update: { title: parsed.data.title, body: parsed.data.body } });
  await audit(admin.id, "content.update", parsed.data.key);
  revalidatePath("/server");
  revalidatePath("/store");
  done(path, `Saved “${parsed.data.key}”`);
}

export async function resetContentBlock(form: FormData) {
  const admin = await requireAdmin();
  const key = contentBlockSchema.shape.key.parse(form.get("key"));
  await prisma.contentBlock.delete({ where: { key } }).catch(() => null);
  await audit(admin.id, "content.reset", key);
  done("/admin/content", `Reset “${key}” to default`);
}

/* ---------- Reports ---------- */
const reportUpdateSchema = z.object({
  id: idSchema,
  status: z.enum(["OPEN", "REVIEWING", "RESOLVED", "DISMISSED"]),
  adminNote: z.string().trim().max(1000).optional(),
});

export async function updateReport(form: FormData) {
  const admin = await requireAdmin();
  const path = "/admin/reports";
  const parsed = reportUpdateSchema.safeParse({ id: form.get("id"), status: form.get("status"), adminNote: form.get("adminNote") ?? undefined });
  if (!parsed.success) fail(path, firstIssue(parsed.error));
  const r = await prisma.report.update({
    where: { id: parsed.data.id },
    data: { status: parsed.data.status, adminNote: parsed.data.adminNote || null, handledById: admin.id },
  });
  await audit(admin.id, "report.update", r.id, { status: r.status, target: r.targetName });
  done(path, "Report updated");
}

/* ---------- Store listings ---------- */
export async function saveListing(form: FormData) {
  const admin = await requireAdmin();
  const path = "/admin/store";
  const parsed = storeListingSchema.safeParse({
    slug: form.get("slug"),
    name: form.get("name"),
    kind: form.get("kind"),
    tagline: form.get("tagline") ?? "",
    description: form.get("description") ?? "",
    priceCents: Math.round(Number(form.get("price") ?? "0") * 100),
    currency: String(form.get("currency") ?? "USD").toUpperCase(),
    features: String(form.get("features") ?? "").split("\n").map((s) => s.trim()).filter(Boolean),
    highlight: bool(form, "highlight"),
    active: bool(form, "active"),
    sortOrder: form.get("sortOrder") ?? 0,
    tebexUrl: form.get("tebexUrl") || undefined,
    stripePriceId: form.get("stripePriceId") || undefined,
  });
  if (!parsed.success) fail(path, firstIssue(parsed.error));
  const data = { ...parsed.data, tebexUrl: parsed.data.tebexUrl ?? null, stripePriceId: parsed.data.stripePriceId ?? null };
  const id = form.get("id");
  try {
    if (id) {
      const lid = idSchema.parse(id);
      await prisma.storeListing.update({ where: { id: lid }, data });
      await audit(admin.id, "store.listing_update", data.slug, { priceCents: data.priceCents, active: data.active });
    } else {
      await prisma.storeListing.create({ data });
      await audit(admin.id, "store.listing_create", data.slug, { priceCents: data.priceCents });
    }
  } catch (e) {
    if (e && typeof e === "object" && "code" in e && e.code === "P2002") fail(path, "A listing with that slug already exists");
    throw e;
  }
  revalidatePath("/store");
  done(path, `Saved ${data.name}`);
}

export async function deleteListing(form: FormData) {
  const admin = await requireAdmin();
  const id = idSchema.parse(form.get("id"));
  const l = await prisma.storeListing.delete({ where: { id } }).catch(() => null);
  await audit(admin.id, "store.listing_delete", l?.slug ?? id);
  revalidatePath("/store");
  done("/admin/store", "Listing deleted");
}

/* ---------- Users ---------- */
export async function setUserRole(form: FormData) {
  const admin = await requireAdmin();
  const id = idSchema.parse(form.get("id"));
  const role = z.enum(["PLAYER", "ADMIN"]).parse(form.get("role"));
  if (id === admin.id && role !== "ADMIN") fail("/admin", "You cannot demote yourself");
  const u = await prisma.user.update({ where: { id }, data: { role } });
  if (role !== "ADMIN") await prisma.session.deleteMany({ where: { userId: id } });
  await audit(admin.id, "user.role_change", u.email, { role });
  done("/admin", `${u.email} is now ${role}`);
}
