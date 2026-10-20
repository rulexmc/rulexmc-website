export type ServerState = "online" | "offline" | "unavailable" | "unconfigured";

export interface ServerStatus {
  state: ServerState;
  address: string | null;
  version: string | null;
  protocol: number | null;
  software: string | null;
  playersOnline: number | null;
  playersMax: number | null;
  motd: string[];
  source: "mcsrvstat" | "ping" | "none";
  fetchedAt: string;
  error?: string;
}

export function unavailableStatus(
  address: string | null,
  source: ServerStatus["source"],
  error: string,
): ServerStatus {
  return {
    state: address ? "unavailable" : "unconfigured",
    address,
    version: null,
    protocol: null,
    software: null,
    playersOnline: null,
    playersMax: null,
    motd: [],
    source,
    fetchedAt: new Date().toISOString(),
    error,
  };
}
