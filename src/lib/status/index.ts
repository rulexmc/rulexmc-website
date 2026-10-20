import "server-only";
import { getConfig } from "@/lib/config";
import { fetchMcsrvstat } from "./mcsrvstat";
import { flattenMotd, pingServer } from "./slp";
import type { ServerStatus } from "./types";
import { unavailableStatus } from "./types";

export type { ServerStatus } from "./types";

const pingCache = new Map<string, { at: number; value: ServerStatus }>();

async function viaPing(host: string, port: number, display: string, ttlMs: number): Promise<ServerStatus> {
  const key = `${host}:${port}`;
  const hit = pingCache.get(key);
  if (hit && Date.now() - hit.at < ttlMs) return hit.value;
  let value: ServerStatus;
  try {
    const r = await pingServer(host, port);
    value = {
      state: "online",
      address: display,
      version: r.version?.name ?? null,
      protocol: r.version?.protocol ?? null,
      software: null,
      playersOnline: r.players?.online ?? null,
      playersMax: r.players?.max ?? null,
      motd: flattenMotd(r.description),
      source: "ping",
      fetchedAt: new Date().toISOString(),
    };
  } catch (err) {
    // A failed direct ping cannot distinguish "offline" from "network issue" reliably.
    value = unavailableStatus(display, "ping", err instanceof Error ? err.message : "Ping failed");
  }
  pingCache.set(key, { at: Date.now(), value });
  return value;
}

/** Live server status. Cached (mcsrvstat: Next data cache; ping: in-memory). Never throws. */
export async function getServerStatus(): Promise<ServerStatus> {
  const cfg = getConfig();
  const addr = cfg.server.address;
  if (!addr) return unavailableStatus(null, "none", "Server address not configured");
  if (cfg.server.statusSource === "ping") {
    return viaPing(addr.host, addr.port, addr.display, cfg.server.statusCacheSeconds * 1000);
  }
  return fetchMcsrvstat(addr.display, cfg.server.statusCacheSeconds);
}
