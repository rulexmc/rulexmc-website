import { describe, expect, it } from "vitest";
import { MemoryRateLimitStore, rateLimit, type RateLimitStore } from "@/lib/rate-limit";

describe("rateLimit", () => {
  it("allows up to the limit then blocks, and resets after the window", async () => {
    let now = 1_000_000;
    const store = new MemoryRateLimitStore(() => now);
    for (let i = 0; i < 3; i++) expect((await rateLimit("k", 3, 1000, store)).ok).toBe(true);
    expect((await rateLimit("k", 3, 1000, store)).ok).toBe(false);
    expect((await rateLimit("other", 3, 1000, store)).ok).toBe(true);
    now += 1001;
    expect((await rateLimit("k", 3, 1000, store)).ok).toBe(true);
  });
  it("fails closed when the store errors", async () => {
    const broken: RateLimitStore = { hit: async () => { throw new Error("db down"); } };
    const orig = console.error;
    console.error = () => {};
    expect((await rateLimit("k", 3, 1000, broken)).ok).toBe(false);
    console.error = orig;
  });
});
