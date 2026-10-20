/**
 * Fixed-window rate limiting. The Postgres store is atomic (single upsert) and
 * shared across all app instances; the memory store is used for tests or when
 * RATE_LIMIT_STORE=memory (single instance only).
 */

export interface RateLimitResult {
  ok: boolean;
  remaining: number;
  resetAt: Date;
}

export interface RateLimitStore {
  hit(key: string, windowMs: number): Promise<{ count: number; resetAt: Date }>;
}

export class MemoryRateLimitStore implements RateLimitStore {
  private map = new Map<string, { count: number; resetAt: number }>();
  constructor(private now: () => number = Date.now) {}
  async hit(key: string, windowMs: number) {
    const t = this.now();
    const cur = this.map.get(key);
    if (!cur || cur.resetAt <= t) {
      const v = { count: 1, resetAt: t + windowMs };
      this.map.set(key, v);
      return { count: 1, resetAt: new Date(v.resetAt) };
    }
    cur.count++;
    return { count: cur.count, resetAt: new Date(cur.resetAt) };
  }
}

export class PrismaRateLimitStore implements RateLimitStore {
  async hit(key: string, windowMs: number) {
    const { prisma } = await import("@/lib/db");
    const resetAt = new Date(Date.now() + windowMs);
    const rows = await prisma.$queryRaw<{ count: number; resetAt: Date }[]>`
      INSERT INTO "RateLimit" ("key", "count", "resetAt") VALUES (${key}, 1, ${resetAt})
      ON CONFLICT ("key") DO UPDATE SET
        "count" = CASE WHEN "RateLimit"."resetAt" <= NOW() THEN 1 ELSE "RateLimit"."count" + 1 END,
        "resetAt" = CASE WHEN "RateLimit"."resetAt" <= NOW() THEN EXCLUDED."resetAt" ELSE "RateLimit"."resetAt" END
      RETURNING "count", "resetAt"`;
    const row = rows[0]!;
    return { count: Number(row.count), resetAt: row.resetAt };
  }
}

let defaultStore: RateLimitStore | null = null;
function getStore(): RateLimitStore {
  defaultStore ??= process.env.RATE_LIMIT_STORE === "memory" ? new MemoryRateLimitStore() : new PrismaRateLimitStore();
  return defaultStore;
}

export async function rateLimit(
  key: string,
  limit: number,
  windowMs: number,
  store: RateLimitStore = getStore(),
): Promise<RateLimitResult> {
  try {
    const { count, resetAt } = await store.hit(key, windowMs);
    return { ok: count <= limit, remaining: Math.max(0, limit - count), resetAt };
  } catch (err) {
    // Fail closed for safety on sensitive endpoints.
    console.error("rate limit store error", err);
    return { ok: false, remaining: 0, resetAt: new Date(Date.now() + windowMs) };
  }
}

export const LIMITS = {
  login: { limit: 10, windowMs: 15 * 60_000 },
  register: { limit: 5, windowMs: 60 * 60_000 },
  report: { limit: 5, windowMs: 60 * 60_000 },
  ingest: { limit: 120, windowMs: 60_000 },
  linkCode: { limit: 6, windowMs: 60 * 60_000 },
  checkout: { limit: 20, windowMs: 60 * 60_000 },
} as const;
