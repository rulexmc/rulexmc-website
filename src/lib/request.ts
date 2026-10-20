import { headers } from "next/headers";

/** Best-effort client IP. Assumes a trusted reverse proxy (Vercel, Nginx, Caddy) sets X-Forwarded-For. */
export function ipFromHeaders(h: Headers): string {
  const xff = h.get("x-forwarded-for");
  if (xff) return xff.split(",")[0]!.trim().slice(0, 64);
  return h.get("x-real-ip")?.trim().slice(0, 64) || "unknown";
}

export async function getClientIp(): Promise<string> {
  return ipFromHeaders(await headers());
}
