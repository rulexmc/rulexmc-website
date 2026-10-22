import { describe, expect, it } from "vitest";
import { groupByKind, tierFeatures } from "@/lib/store";

describe("groupByKind", () => {
  it("orders ranks, kits, perks and drops empty groups", () => {
    const g = groupByKind([
      { kind: "PERK" as const, id: 1 }, { kind: "RANK" as const, id: 2 }, { kind: "RANK" as const, id: 3 },
    ]);
    expect(g.map((x) => x.kind)).toEqual(["RANK", "PERK"]);
    expect(g[0]!.items.map((x) => x.id)).toEqual([2, 3]);
  });
});

describe("tierFeatures", () => {
  it("collapses inherited features into 'everything in previous'", () => {
    const t = tierFeatures([
      { name: "VIP", features: ["a", "b"] },
      { name: "MVP", features: ["a", "b", "c"] },
      { name: "Legend", features: ["a", "b", "c", "d"] },
    ]);
    expect(t).toEqual([
      { includes: null, features: ["a", "b"] },
      { includes: "VIP", features: ["c"] },
      { includes: "MVP", features: ["d"] },
    ]);
  });
  it("lists every feature when the previous tier is not a subset", () => {
    const t = tierFeatures([{ name: "A", features: ["x"] }, { name: "B", features: ["y"] }]);
    expect(t[1]).toEqual({ includes: null, features: ["y"] });
  });
  it("does not claim inheritance from a tier without features", () => {
    const t = tierFeatures([{ name: "A", features: [] }, { name: "B", features: ["y"] }]);
    expect(t[1]!.includes).toBeNull();
  });
});
