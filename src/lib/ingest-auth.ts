import { NextResponse, type NextRequest } from "next/server";
import { secrets } from "@/lib/config";
import { safeEqual } from "@/lib/auth/token";
import { LIMITS, rateLimit } from "@/lib/rate-limit";
import { ipFromHeaders } from "@/lib/request";

/**
 * Shared-secret auth for game-server → website calls.
 * Header: Authorization: Bearer <INGEST_SECRET>
 * Returns a NextResponse to short-circuit with, or null when authorised.
 */
export async function checkIngestAuth(req: NextRequest): Promise<NextResponse | null> {
  const rl = await rateLimit(`ingest:${ipFromHeaders(req.headers)}`, LIMITS.ingest.limit, LIMITS.ingest.windowMs);
  if (!rl.ok) {
    return NextResponse.json({ error: "Rate limited" }, {
      status: 429, headers: { "Retry-After": String(Math.ceil((rl.resetAt.getTime() - Date.now()) / 1000)) },
    });
  }
  const secret = secrets.ingest();
  if (!secret || secret.length < 32) {
    return NextResponse.json({ error: "Ingest disabled: INGEST_SECRET not configured (min 32 chars)" }, { status: 503 });
  }
  const header = req.headers.get("authorization") ?? "";
  const token = header.startsWith("Bearer ") ? header.slice(7).trim() : "";
  if (!token || !safeEqual(token, secret)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  return null;
}

export async function readJson(req: NextRequest, maxBytes = 512 * 1024): Promise<unknown> {
  const len = Number(req.headers.get("content-length") ?? 0);
  if (len > maxBytes) throw new Error("Payload too large");
  const text = await req.text();
  if (text.length > maxBytes) throw new Error("Payload too large");
  return JSON.parse(text);
}
