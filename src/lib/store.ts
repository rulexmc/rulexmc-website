/** Pure helpers for laying out store listings (no data is invented here, only regrouped). */

export type Kind = "RANK" | "KIT" | "PERK";

export const KIND_META: Record<Kind, { title: string; anchor: string }> = {
  RANK: { title: "Ranks", anchor: "ranks" },
  KIT: { title: "Kits", anchor: "kits" },
  PERK: { title: "Perks", anchor: "perks" },
};

const KIND_ORDER: Kind[] = ["RANK", "KIT", "PERK"];

/** Group listings by kind in a fixed order (ranks, kits, perks), dropping empty groups and keeping input order inside each. */
export function groupByKind<T extends { kind: Kind }>(listings: T[]): { kind: Kind; items: T[] }[] {
  return KIND_ORDER.map((kind) => ({ kind, items: listings.filter((l) => l.kind === kind) })).filter((g) => g.items.length > 0);
}

export interface TierFeatures {
  /** Name of the previous tier when this one contains all of its features. */
  includes: string | null;
  /** Features to list on the card (only the new ones when `includes` is set). */
  features: string[];
}

/**
 * For a sorted list of ranks, collapse features already granted by the previous rank into
 * "Everything in <previous>, plus:" when (and only when) the previous rank's features are a subset.
 */
export function tierFeatures(ranks: { name: string; features: string[] }[]): TierFeatures[] {
  return ranks.map((r, i) => {
    const prev = ranks[i - 1];
    if (!prev || prev.features.length === 0) return { includes: null, features: r.features };
    const mine = new Set(r.features);
    const isSuperset = prev.features.every((f) => mine.has(f));
    if (!isSuperset) return { includes: null, features: r.features };
    const prevSet = new Set(prev.features);
    return { includes: prev.name, features: r.features.filter((f) => !prevSet.has(f)) };
  });
}
