#!/usr/bin/env node
/**
 * Example sync: read vanilla Minecraft statistics from a Paper/Spigot server and
 * POST them to the website's ingest API. Runs on the machine that hosts the server
 * (or anywhere with read access to the world folder). No dependencies.
 *
 * Usage:
 *   INGEST_URL=https://your-site.example/api/ingest/stats \
 *   INGEST_SECRET=... \
 *   node scripts/sync-vanilla-stats.mjs --server /path/to/server [--world world] [--dry-run]
 *
 * Reads:
 *   <server>/usercache.json                     uuid -> name
 *   <server>/<world>/stats/<uuid>.json          (classic layout)
 *   <server>/<world>/players/stats/<uuid>.json  (newer layout) — both are checked
 * Sends per player: kills (minecraft:player_kills), deaths (minecraft:deaths),
 * playtimeSeconds (minecraft:play_time or legacy play_one_minute, in ticks / 20).
 * Vanilla has no economy: balance must come from a plugin (Vault/Essentials) — see README.
 *
 * Schedule it with cron/systemd every 5–15 minutes, e.g.
 *   0,10,20,30,40,50 * * * * cd /opt/rulexmc-website && INGEST_URL=... INGEST_SECRET=... node scripts/sync-vanilla-stats.mjs --server /opt/minecraft
 */
import { readFile, readdir, stat } from "node:fs/promises";
import path from "node:path";

const args = process.argv.slice(2);
const opt = (n, d) => { const i = args.indexOf(`--${n}`); return i === -1 ? d : args[i + 1]; };
const serverDir = opt("server");
const worldName = opt("world", "world");
const dryRun = args.includes("--dry-run");
const url = process.env.INGEST_URL;
const secret = process.env.INGEST_SECRET;

if (!serverDir) { console.error("Missing --server <path to Minecraft server folder>"); process.exit(1); }
if (!dryRun && (!url || !secret)) { console.error("Set INGEST_URL and INGEST_SECRET (or use --dry-run)"); process.exit(1); }

const UUID_RE = /^([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})\.json$/i;
const NAME_RE = /^[A-Za-z0-9_]{3,16}$/;

async function exists(p) { try { await stat(p); return true; } catch { return false; } }

async function loadNames() {
  const map = new Map();
  try {
    const cache = JSON.parse(await readFile(path.join(serverDir, "usercache.json"), "utf8"));
    for (const e of cache) if (e?.uuid && e?.name) map.set(e.uuid.toLowerCase(), e.name);
  } catch (e) {
    console.warn("Could not read usercache.json:", e.message);
  }
  return map;
}

async function statFiles() {
  const dirs = [path.join(serverDir, worldName, "stats"), path.join(serverDir, worldName, "players", "stats")];
  const out = new Map();
  for (const d of dirs) {
    if (!(await exists(d))) continue;
    for (const f of await readdir(d)) {
      const m = f.match(UUID_RE);
      if (m) out.set(m[1].toLowerCase(), path.join(d, f));
    }
  }
  return out;
}

function extract(json) {
  const c = json?.stats?.["minecraft:custom"] ?? {};
  const ticks = c["minecraft:play_time"] ?? c["minecraft:play_one_minute"] ?? 0;
  return {
    kills: Math.max(0, c["minecraft:player_kills"] ?? 0),
    deaths: Math.max(0, c["minecraft:deaths"] ?? 0),
    playtimeSeconds: Math.max(0, Math.floor(ticks / 20)),
  };
}

async function main() {
  const names = await loadNames();
  const files = await statFiles();
  const players = [];
  for (const [uuid, file] of files) {
    const name = names.get(uuid);
    if (!name || !NAME_RE.test(name)) continue; // skip unknown / invalid names
    try {
      const json = JSON.parse(await readFile(file, "utf8"));
      const { mtime } = await stat(file);
      players.push({ uuid, name, ...extract(json), lastSeen: mtime.toISOString() });
    } catch (e) {
      console.warn(`Skipping ${file}: ${e.message}`);
    }
  }
  console.log(`Found ${players.length} players with stats (${files.size} stat files).`);
  if (dryRun) { console.log(JSON.stringify(players.slice(0, 5), null, 2)); return; }

  for (let i = 0; i < players.length; i += 500) {
    const batch = players.slice(i, i + 500);
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${secret}` },
      body: JSON.stringify({ source: "vanilla-stats", players: batch }),
    });
    const text = await res.text();
    if (!res.ok) { console.error(`Ingest failed (${res.status}): ${text}`); process.exit(1); }
    console.log(`Batch ${i / 500 + 1}: ${text}`);
  }
}

main().catch((e) => { console.error(e); process.exit(1); });
