import { describe, expect, it } from "vitest";
import { SampleStatsProvider } from "@/lib/stats/sample";
import { METRICS, OPTIONAL_METRICS, formatMetric, isMetric, kdRatio, metricValue, type PlayerStatRow } from "@/lib/stats/types";

const row = (over: Partial<PlayerStatRow> = {}): PlayerStatRow => ({
  uuid: "u", name: "Alex", kills: 1234, deaths: 0, balance: null, playtimeSeconds: 3 * 3600 + 60,
  hearts: null, level: null, lastSeen: null, updatedAt: null, ...over,
});

describe("metric helpers", () => {
  it("includes the leaderboard metrics in tab order", () => {
    expect(METRICS).toEqual(["kills", "hearts", "playtime", "balance", "level", "deaths"]);
    expect(isMetric("hearts")).toBe(true);
    expect(isMetric("constructor")).toBe(false);
  });
  it("returns null for unreported optional metrics and formats them as a dash", () => {
    for (const m of OPTIONAL_METRICS) {
      expect(metricValue(row(), m)).toBeNull();
      expect(formatMetric(row(), m)).toBe("—");
    }
  });
  it("formats reported values", () => {
    expect(formatMetric(row(), "kills")).toBe("1,234");
    expect(formatMetric(row(), "playtime")).toBe("3h 1m");
    expect(formatMetric(row({ balance: 1520.5 }), "balance")).toBe("1,520.5");
    expect(formatMetric(row({ hearts: 0 }), "hearts")).toBe("0");
    expect(formatMetric(row({ level: 42 }), "level")).toBe("42");
  });
  it("computes K/D with zero deaths treated as one", () => {
    expect(kdRatio({ kills: 10, deaths: 0 })).toBe("10.00");
    expect(kdRatio({ kills: 7, deaths: 2 })).toBe("3.50");
  });
});

describe("SampleStatsProvider boards", () => {
  const p = new SampleStatsProvider();

  it("ranks hearts and level boards, excluding players without a value", async () => {
    for (const metric of ["hearts", "level"] as const) {
      const r = await p.getLeaderboard({ metric, order: "desc", page: 1, pageSize: 100 });
      expect(r.rows.every((x) => metricValue(x, metric) !== null)).toBe(true);
      for (let i = 1; i < r.rows.length; i++) {
        expect(metricValue(r.rows[i - 1]!, metric)!).toBeGreaterThanOrEqual(metricValue(r.rows[i]!, metric)!);
      }
    }
    const level = await p.getLeaderboard({ metric: "level", order: "desc", page: 1, pageSize: 100 });
    expect(level.total).toBe(35); // every 8th of the 40 sample players has no level
  });

  it("gives unreported players no rank", async () => {
    const all = await p.getLeaderboard({ metric: "kills", order: "desc", page: 1, pageSize: 100 });
    const noLevel = all.rows.find((x) => x.level === null)!;
    expect(await p.getRank(noLevel.uuid, "level")).toBeNull();
    expect(await p.getRank(noLevel.uuid, "kills")).not.toBeNull();
  });

  it("agrees with the leaderboard position for every metric", async () => {
    for (const metric of METRICS) {
      const r = await p.getLeaderboard({ metric, order: "desc", page: 2, pageSize: 7 });
      for (const x of r.rows) expect(await p.getRank(x.uuid, metric)).toBe(x.rank);
    }
  });

  it("finds players by name case-insensitively", async () => {
    expect((await p.getPlayer("crimsonfang"))?.name).toBe("CrimsonFang");
    expect(await p.getPlayer("NotARealPlayer")).toBeNull();
  });
});
