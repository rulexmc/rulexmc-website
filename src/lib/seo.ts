import type { Metadata } from "next";
import { SITE } from "@/lib/site";

export const OG_IMAGE = { url: "/opengraph-image", width: 1200, height: 630, alt: "RuleX MC: Your heart. Your survival." };

/**
 * Per-page metadata with canonical URL, Open Graph and Twitter card tags.
 * Paths are resolved against `metadataBase` (set from SITE_URL in the root layout).
 */
export function pageMetadata({
  title, description, path, noIndex = false,
}: { title?: string; description: string; path: string; noIndex?: boolean }): Metadata {
  const fullTitle = title ? `${title} | ${SITE.name}` : `${SITE.name} | Lifesteal, Survival & PvP Practice`;
  return {
    ...(title ? { title } : {}),
    description,
    alternates: { canonical: path },
    openGraph: {
      type: "website",
      siteName: SITE.name,
      locale: "en_US",
      url: path,
      title: fullTitle,
      description,
      images: [OG_IMAGE],
    },
    twitter: { card: "summary_large_image", title: fullTitle, description, images: [OG_IMAGE.url] },
    ...(noIndex ? { robots: { index: false, follow: false } } : {}),
  };
}
