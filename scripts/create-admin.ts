/**
 * Create (or promote) an ADMIN account.
 *   npm run admin:create -- --email you@example.com --password 'long-password' [--name Owner]
 * or with env: ADMIN_EMAIL=... ADMIN_PASSWORD=... npm run admin:create
 * If the user exists it is promoted to ADMIN; the password is only changed with --reset-password.
 */
import { PrismaClient } from "@prisma/client";
import { hashPassword } from "../src/lib/auth/password";
import { z } from "zod";

function arg(name: string): string | undefined {
  const i = process.argv.indexOf(`--${name}`);
  return i !== -1 ? process.argv[i + 1] : undefined;
}

const schema = z.object({
  email: z.string().trim().toLowerCase().pipe(z.email()),
  password: z.string().min(12, "Admin password must be at least 12 characters").max(128),
  name: z.string().min(2).max(32),
});

async function main() {
  const parsed = schema.safeParse({
    email: arg("email") ?? process.env.ADMIN_EMAIL,
    password: arg("password") ?? process.env.ADMIN_PASSWORD,
    name: arg("name") ?? process.env.ADMIN_NAME ?? "Admin",
  });
  if (!parsed.success) {
    console.error("Invalid input:", parsed.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("; "));
    console.error("Usage: npm run admin:create -- --email you@example.com --password '<12+ chars>' [--name Owner]");
    process.exit(1);
  }
  const { email, password, name } = parsed.data;
  const prisma = new PrismaClient();
  try {
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      await prisma.user.update({
        where: { id: existing.id },
        data: { role: "ADMIN", ...(process.argv.includes("--reset-password") ? { passwordHash: await hashPassword(password) } : {}) },
      });
      await prisma.auditLog.create({ data: { action: "user.promote_cli", target: email } });
      console.log(`Promoted existing user ${email} to ADMIN.`);
    } else {
      await prisma.user.create({ data: { email, displayName: name, passwordHash: await hashPassword(password), role: "ADMIN" } });
      await prisma.auditLog.create({ data: { action: "user.create_admin_cli", target: email } });
      console.log(`Created ADMIN ${email}.`);
    }
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
