/**
 * Central runtime configuration. Every environment-driven value lives here so
 * nothing (server address, links, providers) is scattered through the code.
 * Server-only: never import secrets from this module into client components.
 */

import { SERVER_FACTS, SITE } from "@/lib/site";

export const DEFAULT_SERVER_ADDRESS = SERVER_FACTS.javaAddress;
export const DEFAULT_MC_PORT = 25565;

export interface ServerAddress {
  host: string;
  port: number;
  /** What players type into Minecraft (port omitted when it is the default). */
  display: string;
}

/** Parse "host", "host:port" or "[ipv6]:port". Returns null when empty/invalid. */
export function parseServerAddress(raw: string | undefined | null): ServerAddress | null {
  const value = (raw ?? "").trim();
  if (!value) return null;
  let host = value;
  let port = DEFAULT_MC_PORT;
  const ipv6 = value.match(/^\[([^\]]+)\](?::(\d+))?$/);
  if (ipv6) {
    host = ipv6[1]!;
    if (ipv6[2]) port = Number(ipv6[2]);
  } else if (value.includes(":")) {
    const idx = value.lastIndexOf(":");
    host = value.slice(0, idx);
    port = Number(value.slice(idx + 1));
  }
  if (!/^[a-zA-Z0-9.\-:]+$/.test(host) || host.length > 253) return null;
  if (!Number.isInteger(port) || port < 1 || port > 65535) return null;
  const display = port === DEFAULT_MC_PORT ? host : `${host}:${port}`;
  return { host, port, display };
}

function envUrl(name: string): string | null {
  const v = process.env[name]?.trim();
  if (!v) return null;
  try {
    const u = new URL(v);
    return u.protocol === "https:" || u.protocol === "http:" ? u.toString() : null;
  } catch {
    return null;
  }
}

/** Community link: unset -> fallback (verified default), "" -> hidden, otherwise must be http(s). */
function envUrlWithDefault(name: string, fallback: string | null): string | null {
  if (process.env[name] === undefined) return fallback;
  return envUrl(name);
}

/** Public site URL: SITE_URL, then Vercel's production domain, then localhost for development. */
function resolveSiteUrl(): string {
  const explicit = envUrl("SITE_URL");
  if (explicit) return explicit;
  const vercel = process.env.VERCEL_PROJECT_PRODUCTION_URL?.trim();
  if (vercel && /^[a-z0-9.-]+$/i.test(vercel)) return `https://${vercel}`;
  return "http://localhost:3000";
}

export type StatusSource = "mcsrvstat" | "ping";
export type StatsProviderName = "database" | "sample";
export type PaymentProviderName = "none" | "tebex" | "stripe";

export function getConfig() {
  // MC_SERVER_ADDRESS unset -> default address; set to "" -> explicitly unconfigured.
  const rawAddress =
    process.env.MC_SERVER_ADDRESS === undefined ? DEFAULT_SERVER_ADDRESS : process.env.MC_SERVER_ADDRESS;
  const statusSource: StatusSource = process.env.STATUS_SOURCE === "ping" ? "ping" : "mcsrvstat";
  const statsProvider: StatsProviderName = process.env.STATS_PROVIDER === "sample" ? "sample" : "database";
  const pp = process.env.PAYMENT_PROVIDER;
  const paymentProvider: PaymentProviderName = pp === "tebex" || pp === "stripe" ? pp : "none";

  return {
    siteName: process.env.SITE_NAME?.trim() || SITE.name,
    siteUrl: resolveSiteUrl(),
    server: {
      address: parseServerAddress(rawAddress),
      edition: SERVER_FACTS.editions,
      /** Supported client range shown on the site. MC_VERSION_LABEL overrides the verified default. */
      versionLabel: process.env.MC_VERSION_LABEL?.trim() || SERVER_FACTS.versions,
      statusSource,
      statusCacheSeconds: Math.max(15, Number(process.env.STATUS_CACHE_SECONDS) || 60),
    },
    statsProvider,
    payments: {
      provider: paymentProvider,
      currency: process.env.STORE_CURRENCY?.trim() || "USD",
    },
    community: {
      discord: envUrlWithDefault("DISCORD_URL", SITE.discordInvite),
      youtube: envUrl("YOUTUBE_URL"),
      tiktok: envUrl("TIKTOK_URL"),
      x: envUrl("X_URL"),
      vote: envUrl("VOTE_URL"),
    },
  };
}

export type AppConfig = ReturnType<typeof getConfig>;

/** Secrets: read lazily, server-side only. */
export const secrets = {
  ingest: () => process.env.INGEST_SECRET?.trim() || null,
  stripeSecretKey: () => process.env.STRIPE_SECRET_KEY?.trim() || null,
  stripeWebhookSecret: () => process.env.STRIPE_WEBHOOK_SECRET?.trim() || null,
};
