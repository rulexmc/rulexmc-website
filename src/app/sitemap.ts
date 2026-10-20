export const dynamic = "force-dynamic";

import type { MetadataRoute } from "next";
import { getConfig } from "@/lib/config";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = getConfig().siteUrl.replace(/\/$/, "");
  return ["", "/server", "/leaderboards", "/store", "/login", "/register"].map((p) => ({ url: `${base}${p}` }));
}
