import { z } from "zod";
import type { ServerStatus } from "./types";
import { unavailableStatus } from "./types";

/** Subset of https://api.mcsrvstat.us/3/<address> that we rely on. */
const McsrvSchema = z.object({
  online: z.boolean(),
  version: z.string().optional(),
  software: z.string().optional(),
  protocol: z.object({ version: z.number().optional(), name: z.string().optional() }).optional(),
  players: z.object({ online: z.number().int().nonnegative(), max: z.number().int().nonnegative() }).optional(),
  motd: z.object({ clean: z.array(z.string()).optional() }).optional(),
});

export function mapMcsrvstat(address: string, json: unknown): ServerStatus {
  const parsed = McsrvSchema.safeParse(json);
  if (!parsed.success) return unavailableStatus(address, "mcsrvstat", "Unexpected response from status API");
  const d = parsed.data;
  return {
    state: d.online ? "online" : "offline",
    address,
    version: d.online ? (d.protocol?.name ?? d.version ?? null) : null,
    protocol: d.online ? (d.protocol?.version ?? null) : null,
    software: d.online ? (d.software ?? null) : null,
    playersOnline: d.online ? (d.players?.online ?? null) : null,
    playersMax: d.online ? (d.players?.max ?? null) : null,
    motd: d.online ? (d.motd?.clean ?? []).map((l) => l.trim()).filter(Boolean) : [],
    source: "mcsrvstat",
    fetchedAt: new Date().toISOString(),
  };
}

export async function fetchMcsrvstat(address: string, revalidateSeconds: number): Promise<ServerStatus> {
  try {
    const res = await fetch(`https://api.mcsrvstat.us/3/${encodeURIComponent(address)}`, {
      headers: { "User-Agent": "RuleXMC-Website/1.0 (+status widget)" },
      next: { revalidate: revalidateSeconds },
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) return unavailableStatus(address, "mcsrvstat", `Status API returned HTTP ${res.status}`);
    return mapMcsrvstat(address, await res.json());
  } catch (err) {
    return unavailableStatus(address, "mcsrvstat", err instanceof Error ? err.message : "Status request failed");
  }
}
