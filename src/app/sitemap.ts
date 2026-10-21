export const dynamic = "force-dynamic";

import type { MetadataRoute } from "next";
import { getConfig } from "@/lib/config";

const PAGES: { path: string; priority: number; changeFrequency: "hourly" | "daily" | "weekly" | "monthly" }[] = [
  { path: "", priority: 1, changeFrequency: "daily" },
  { path: "/server", priority: 0.9, changeFrequency: "weekly" },
  { path: "/leaderboards", priority: 0.8, changeFrequency: "hourly" },
  { path: "/store", priority: 0.6, changeFrequency: "weekly" },
  { path: "/register", priority: 0.3, changeFrequency: "monthly" },
  { path: "/login", priority: 0.2, changeFrequency: "monthly" },
];

export default function sitemap(): MetadataRoute.Sitemap {
  const base = getConfig().siteUrl.replace(/\/$/, "");
  const lastModified = new Date();
  return PAGES.map((p) => ({ url: `${base}${p.path}`, lastModified, changeFrequency: p.changeFrequency, priority: p.priority }));
}
