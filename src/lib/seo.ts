import type { Metadata } from "next";
import { SERVER_FACTS, SITE } from "@/lib/site";
import type { ServerStatus } from "@/lib/status/types";

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

export interface Crumb {
  name: string;
  path: string;
}

function absolute(path: string, siteUrl: string): string {
  return `${siteUrl.replace(/\/$/, "")}${path === "/" ? "" : path}` || siteUrl;
}

/** schema.org BreadcrumbList for a trail of site-relative paths. */
export function breadcrumbJsonLd(trail: Crumb[], siteUrl: string) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: trail.map((c, i) => ({ "@type": "ListItem", position: i + 1, name: c.name, item: absolute(c.path, siteUrl) })),
  };
}

/** Organization + WebSite graph, shared by the home page. */
export function siteJsonLd(siteUrl: string, discord: string | null) {
  const base = siteUrl.replace(/\/$/, "");
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": `${base}/#org`,
        name: SITE.name,
        alternateName: SITE.network,
        url: base,
        logo: `${base}/icon.svg`,
        slogan: SITE.tagline,
        founder: { "@type": "Person", name: SITE.owner },
        ...(discord ? { sameAs: [discord] } : {}),
      },
      {
        "@type": "WebSite",
        "@id": `${base}/#website`,
        name: SITE.name,
        url: base,
        description: SITE.description,
        inLanguage: "en",
        publisher: { "@id": `${base}/#org` },
      },
    ],
  };
}

/**
 * schema.org GameServer for the Minecraft server. Live fields (status, players online) are only included
 * when the status lookup actually returned them; nothing is guessed.
 */
export function gameServerJsonLd(siteUrl: string, address: string | null, status: ServerStatus) {
  const base = siteUrl.replace(/\/$/, "");
  const online = status.state === "online";
  return {
    "@context": "https://schema.org",
    "@type": "GameServer",
    "@id": `${base}/server#gameserver`,
    name: `${SITE.name} Minecraft server`,
    url: `${base}/server`,
    description: `${SERVER_FACTS.editions} Minecraft network (${SERVER_FACTS.versions}) with Lifesteal, Survival and PvP Practice.${address ? ` Address: ${address}.` : ""}`,
    provider: { "@id": `${base}/#org` },
    game: {
      "@type": "VideoGame",
      name: "Minecraft",
      gamePlatform: ["Minecraft: Java Edition", "Minecraft: Bedrock Edition"],
      playMode: "MultiPlayer",
    },
    ...(status.state === "online" || status.state === "offline"
      ? { serverStatus: online ? "https://schema.org/Online" : "https://schema.org/OfflineTemporarily" }
      : {}),
    ...(online && status.playersOnline !== null ? { playersOnline: status.playersOnline } : {}),
  };
}
