export const dynamic = "force-dynamic";

import type { MetadataRoute } from "next";
import { getConfig } from "@/lib/config";

export default function robots(): MetadataRoute.Robots {
  const base = getConfig().siteUrl.replace(/\/$/, "");
  return {
    rules: [{ userAgent: "*", allow: "/", disallow: ["/admin", "/portal", "/api/"] }],
    sitemap: `${base}/sitemap.xml`,
    host: base,
  };
}
