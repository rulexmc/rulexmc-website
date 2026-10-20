"use server";

import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { createSession, destroySession, getCurrentUser } from "@/lib/auth/session";
import { getDummyHash, hashPassword, verifyPassword } from "@/lib/auth/password";
import { LIMITS, rateLimit } from "@/lib/rate-limit";
import { getClientIp } from "@/lib/request";
import { fieldErrors, loginSchema, registerSchema, safeNextPath, type FieldErrors } from "@/lib/validation";
import { audit, logActivity } from "@/lib/audit";

export interface AuthState {
  error?: string;
  fields?: FieldErrors;
  values?: Record<string, string>;
}

export async function loginAction(_prev: AuthState, form: FormData): Promise<AuthState> {
  const values = { email: String(form.get("email") ?? "") };
  const ip = await getClientIp();
  const rl = await rateLimit(`login:${ip}`, LIMITS.login.limit, LIMITS.login.windowMs);
  if (!rl.ok) return { error: "Too many login attempts. Please wait a few minutes and try again.", values };

  const parsed = loginSchema.safeParse({ email: form.get("email"), password: form.get("password") });
  if (!parsed.success) return { fields: fieldErrors(parsed.error), values };

  const user = await prisma.user.findUnique({ where: { email: parsed.data.email } });
  const ok = user
    ? await verifyPassword(user.passwordHash, parsed.data.password)
    : (await verifyPassword(await getDummyHash(), parsed.data.password), false);
  if (!user || !ok) return { error: "Incorrect email or password.", values };

  await createSession(user.id);
  await logActivity(user.id, "login", "Signed in");
  if (user.role === "ADMIN") await audit(user.id, "auth.admin_login", user.email);
  redirect(safeNextPath(form.get("next")));
}

export async function registerAction(_prev: AuthState, form: FormData): Promise<AuthState> {
  const values = { email: String(form.get("email") ?? ""), displayName: String(form.get("displayName") ?? "") };
  const ip = await getClientIp();
  const rl = await rateLimit(`register:${ip}`, LIMITS.register.limit, LIMITS.register.windowMs);
  if (!rl.ok) return { error: "Too many accounts created from this network. Try again later.", values };

  const parsed = registerSchema.safeParse({
    email: form.get("email"),
    displayName: form.get("displayName"),
    password: form.get("password"),
    confirm: form.get("confirm"),
  });
  if (!parsed.success) return { fields: fieldErrors(parsed.error), values };

  const exists = await prisma.user.findUnique({ where: { email: parsed.data.email }, select: { id: true } });
  if (exists) return { fields: { email: ["An account with this email already exists"] }, values };

  const user = await prisma.user.create({
    data: {
      email: parsed.data.email,
      displayName: parsed.data.displayName,
      passwordHash: await hashPassword(parsed.data.password),
      role: "PLAYER",
    },
  });
  await logActivity(user.id, "register", "Account created");
  await createSession(user.id);
  redirect("/portal?welcome=1");
}

export async function logoutAction(): Promise<void> {
  const user = await getCurrentUser().catch(() => null);
  await destroySession();
  if (user) await logActivity(user.id, "logout", "Signed out");
  redirect("/");
}
