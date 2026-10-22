import { describe, expect, it } from "vitest";
import { leaderboardHref, parseLeaderboardParams, playerHref } from "@/lib/leaderboard-params";

describe("parseLeaderboardParams", () => {
  it("defaults to kills, descending, page 1, no search", () => {
    expect(parseLeaderboardParams({})).toEqual({ metric: "kills", order: "desc", page: 1, q: "" });
  });
  it("accepts every leaderboard metric", () => {
    for (const metric of ["kills", "hearts", "playtime", "balance", "level", "deaths"]) {
      expect(parseLeaderboardParams({ metric }).metric).toBe(metric);
    }
  });
  it("falls back on unknown metric/order and clamps page", () => {
    const p = parseLeaderboardParams({ metric: "wins", order: "sideways", page: "-4" });
    expect(p).toMatchObject({ metric: "kills", order: "desc", page: 1 });
    expect(parseLeaderboardParams({ page: "999999" }).page).toBe(10_000);
    expect(parseLeaderboardParams({ page: "abc" }).page).toBe(1);
  });
  it("sanitises the search to Minecraft-name characters (max 16)", () => {
    expect(parseLeaderboardParams({ q: " <script>Heart_Reaper!!" }).q).toBe("scriptHeart_Reap");
    expect(parseLeaderboardParams({ q: "a b%20c" }).q).toBe("ab20c");
  });
  it("uses the first value of repeated params", () => {
    expect(parseLeaderboardParams({ metric: ["level", "kills"], order: ["asc"] })).toMatchObject({ metric: "level", order: "asc" });
  });
});

describe("leaderboardHref", () => {
  const base = parseLeaderboardParams({});
  it("omits defaults", () => {
    expect(leaderboardHref(base)).toBe("/leaderboards");
  });
  it("encodes metric, order, search and page", () => {
    expect(leaderboardHref(base, { metric: "hearts", order: "asc", q: "Fang", page: 3 })).toBe(
      "/leaderboards?metric=hearts&order=asc&q=Fang&page=3",
    );
  });
  it("round-trips through the parser", () => {
    const p = { metric: "level" as const, order: "asc" as const, page: 2, q: "abc" };
    const url = new URL(leaderboardHref(p), "http://x");
    expect(parseLeaderboardParams(Object.fromEntries(url.searchParams))).toEqual(p);
  });
});

describe("playerHref", () => {
  it("builds the profile URL", () => {
    expect(playerHref("Crimson_Fang")).toBe("/player/Crimson_Fang");
  });
});
