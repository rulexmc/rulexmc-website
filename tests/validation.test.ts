import { describe, expect, it } from "vitest";
import {
  ingestStatsSchema, ingestVerifySchema, registerSchema, reportSchema, safeNextPath, storeListingSchema,
} from "@/lib/validation";

describe("registerSchema", () => {
  const ok = { email: "A@Example.com ", displayName: "Steve", password: "correcthorse1", confirm: "correcthorse1" };
  it("accepts and normalises a valid registration", () => {
    expect(registerSchema.parse(ok).email).toBe("a@example.com");
  });
  it("rejects short passwords and mismatches", () => {
    expect(registerSchema.safeParse({ ...ok, password: "short", confirm: "short" }).success).toBe(false);
    expect(registerSchema.safeParse({ ...ok, confirm: "different123" }).success).toBe(false);
  });
});

describe("reportSchema", () => {
  it("requires a valid MC username and detail", () => {
    expect(reportSchema.safeParse({ targetName: "Not Valid!", category: "CHEATING", description: "x".repeat(30) }).success).toBe(false);
    expect(reportSchema.safeParse({ targetName: "Notch", category: "CHEATING", description: "too short" }).success).toBe(false);
    expect(reportSchema.safeParse({ targetName: "Notch", category: "CHEATING", description: "x".repeat(30) }).success).toBe(true);
  });
  it("only accepts https evidence links", () => {
    const base = { targetName: "Notch", category: "BUG", description: "x".repeat(30) };
    expect(reportSchema.safeParse({ ...base, evidenceUrl: "javascript:alert(1)" }).success).toBe(false);
    expect(reportSchema.safeParse({ ...base, evidenceUrl: "https://youtu.be/x" }).success).toBe(true);
  });
});

describe("ingest schemas", () => {
  it("normalises undashed UUIDs and accepts partial stats", () => {
    const r = ingestStatsSchema.parse({ players: [{ uuid: "069A79F444E94726A5BEFCA90E38AAF5", name: "Notch", kills: 5 }] });
    expect(r.players[0]!.uuid).toBe("069a79f4-44e9-4726-a5be-fca90e38aaf5");
    expect(r.players[0]!.deaths).toBeUndefined();
  });
  it("rejects negative counters, bad names and huge batches", () => {
    const p = { uuid: "069a79f4-44e9-4726-a5be-fca90e38aaf5", name: "Notch" };
    expect(ingestStatsSchema.safeParse({ players: [{ ...p, kills: -1 }] }).success).toBe(false);
    expect(ingestStatsSchema.safeParse({ players: [{ ...p, name: "a" }] }).success).toBe(false);
    expect(ingestStatsSchema.safeParse({ players: Array(501).fill(p) }).success).toBe(false);
  });
  it("validates verify codes case-insensitively", () => {
    expect(ingestVerifySchema.parse({ code: "rx-abc234", name: "Notch", uuid: "069a79f444e94726a5befca90e38aaf5" }).code).toBe("RX-ABC234");
  });
});

describe("storeListingSchema", () => {
  const base = { slug: "vip", name: "VIP", kind: "RANK", priceCents: 499, currency: "USD", features: [], highlight: false, active: true, sortOrder: 0 };
  it("accepts optional payment fields", () => {
    expect(storeListingSchema.safeParse({ ...base, tebexUrl: "", stripePriceId: "" }).success).toBe(true);
  });
  it("rejects non-https Tebex links and malformed Stripe prices", () => {
    expect(storeListingSchema.safeParse({ ...base, tebexUrl: "http://x.tebex.io" }).success).toBe(false);
    expect(storeListingSchema.safeParse({ ...base, stripePriceId: "sk_live_123" }).success).toBe(false);
  });
});

describe("safeNextPath", () => {
  it("blocks open redirects", () => {
    expect(safeNextPath("/admin")).toBe("/admin");
    expect(safeNextPath("//evil.com")).toBe("/portal");
    expect(safeNextPath("https://evil.com")).toBe("/portal");
    expect(safeNextPath("/\\evil.com")).toBe("/portal");
  });
});

describe("ingest level field", () => {
  it("accepts an optional, nullable, bounded integer level", async () => {
    const { ingestPlayerSchema } = await import("@/lib/validation");
    const base = { uuid: "00000000-0000-4000-8000-000000000001", name: "Alex" };
    expect(ingestPlayerSchema.safeParse({ ...base, level: 42 }).success).toBe(true);
    expect(ingestPlayerSchema.safeParse({ ...base, level: null }).success).toBe(true);
    expect(ingestPlayerSchema.safeParse(base).success).toBe(true);
    expect(ingestPlayerSchema.safeParse({ ...base, level: -1 }).success).toBe(false);
    expect(ingestPlayerSchema.safeParse({ ...base, level: 1.5 }).success).toBe(false);
    expect(ingestPlayerSchema.safeParse({ ...base, level: 2_000_000 }).success).toBe(false);
  });
});
