import { describe, expect, it } from "vitest";
import { SampleStatsProvider } from "@/lib/stats/sample";
import { formatPlaytime } from "@/lib/stats/types";

describe("SampleStatsProvider", () => {
  const p = new SampleStatsProvider();
  it("is clearly not live", () => {
    expect(p.live).toBe(false);
    expect(p.id).toBe("sample");
  });
  it("sorts descending by metric with ranks", async () => {
    const r = await p.getLeaderboard({ metric: "kills", order: "desc", page: 1, pageSize: 10 });
    expect(r.rows).toHaveLength(10);
    expect(r.rows[0]!.rank).toBe(1);
    for (let i = 1; i < r.rows.length; i++) expect(r.rows[i - 1]!.kills).toBeGreaterThanOrEqual(r.rows[i]!.kills);
  });
  it("paginates and clamps page numbers", async () => {
    const r = await p.getLeaderboard({ metric: "deaths", order: "asc", page: 999, pageSize: 15 });
    expect(r.page).toBe(r.pageCount);
    expect(r.total).toBe(40);
  });
  it("searches by name and keeps the global rank", async () => {
    const r = await p.getLeaderboard({ metric: "playtime", order: "desc", page: 1, pageSize: 10, search: "heart" });
    expect(r.rows.length).toBeGreaterThan(0);
    expect(r.rows.every((x) => x.name.toLowerCase().includes("heart"))).toBe(true);
    const rank = await p.getRank(r.rows[0]!.uuid, "playtime");
    expect(rank).toBe(r.rows[0]!.rank);
  });
  it("is deterministic", async () => {
    const a = await new SampleStatsProvider().getSummary();
    const b = await p.getSummary();
    expect(a).toEqual(b);
  });
});

describe("formatPlaytime", () => {
  it("formats minutes, hours and days", () => {
    expect(formatPlaytime(59 * 60)).toBe("59m");
    expect(formatPlaytime(3 * 3600 + 120)).toBe("3h 2m");
    expect(formatPlaytime(50 * 3600)).toBe("2d 2h");
  });
});
