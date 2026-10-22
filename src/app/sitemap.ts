export const dynamic = "force-dynamic";

import type { MetadataRoute } from "next";
import { getConfig } from "@/lib/config";
import { getStatsProvider } from "@/lib/stats";
import { playerHref } from "@/lib/leaderboard-params";

const PAGES: { path: string; priority: number; changeFrequency: "hourly" | "daily" | "weekly" | "monthly" }[] = [
  { path: "", priority: 1, changeFrequency: "daily" },
  { path: "/server", priority: 0.9, changeFrequency: "weekly" },
  { path: "/leaderboards", priority: 0.8, changeFrequency: "hourly" },
  { path: "/store", priority: 0.6, changeFrequency: "weekly" },
  { path: "/register", priority: 0.3, changeFrequency: "monthly" },
  { path: "/login", priority: 0.2, changeFrequency: "monthly" },
];

/** Profiles of the top players, only when stats are real (sample profiles are noindex). */
async function playerEntries(base: string): Promise<MetadataRoute.Sitemap> {
  const provider = getStatsProvider();
  if (!provider.live) return [];
  try {
    const { rows } = await provider.getLeaderboard({ metric: "kills", order: "desc", page: 1, pageSize: 100 });
    return rows.map((r) => ({
      url: `${base}${playerHref(r.name)}`,
      ...(r.updatedAt ? { lastModified: r.updatedAt } : {}),
      changeFrequency: "daily" as const,
      priority: 0.4,
    }));
  } catch {
    return [];
  }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = getConfig().siteUrl.replace(/\/$/, "");
  const lastModified = new Date();
  const pages = PAGES.map((p) => ({ url: `${base}${p.path}`, lastModified, changeFrequency: p.changeFrequency, priority: p.priority }));
  return [...pages, ...(await playerEntries(base))];
}
