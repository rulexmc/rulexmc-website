import type { Metadata } from "next";
import Link from "next/link";
import { Avatar } from "@/components/Avatar";
import { SampleBadge } from "@/components/SampleBadge";
import {
  getStatsProvider, METRICS, METRIC_LABELS, formatBalance, formatPlaytime, type LeaderboardResult, type Metric,
} from "@/lib/stats";

export const metadata: Metadata = { title: "Leaderboards", description: "Top RuleXMC players by kills, deaths, balance and playtime." };
export const dynamic = "force-dynamic";

const PAGE_SIZE = 20;

type SP = { metric?: string; order?: string; page?: string; q?: string };

function href(base: SP, patch: Partial<SP>) {
  const p = new URLSearchParams();
  const merged = { ...base, ...patch };
  for (const [k, v] of Object.entries(merged)) if (v) p.set(k, String(v));
  const s = p.toString();
  return `/leaderboards${s ? `?${s}` : ""}`;
}

export default async function LeaderboardsPage({ searchParams }: { searchParams: Promise<SP> }) {
  const sp = await searchParams;
  const metric: Metric = (METRICS as readonly string[]).includes(sp.metric ?? "") ? (sp.metric as Metric) : "kills";
  const order = sp.order === "asc" ? "asc" : "desc";
  const page = Math.max(1, Math.min(10_000, Number.parseInt(sp.page ?? "1", 10) || 1));
  const q = (sp.q ?? "").trim().slice(0, 16).replace(/[^A-Za-z0-9_]/g, "");
  const base: SP = { metric, order: order === "desc" ? undefined : "asc", q: q || undefined };

  const provider = getStatsProvider();
  let result: LeaderboardResult | null = null;
  try {
    result = await provider.getLeaderboard({ metric, order, page, pageSize: PAGE_SIZE, search: q || undefined });
  } catch (err) {
    console.error("leaderboard query failed", err);
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6">
      <header className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="eyebrow">Hall of hearts</p>
          <h1 className="h-display mt-2 text-3xl text-white sm:text-5xl">Leaderboards</h1>
        </div>
        <div className="flex items-center gap-3">
          {provider.live ? <span className="badge border border-emerald-400/40 bg-emerald-400/10 text-emerald-300">Live server data</span> : <SampleBadge />}
        </div>
      </header>

      {!provider.live ? (
        <p className="mb-6 rounded-md border border-amber-400/40 bg-amber-400/10 px-4 py-3 text-sm text-amber-100" role="note">
          These numbers are generated sample data for development. They are not real players or live stats.
        </p>
      ) : null}

      <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <nav aria-label="Leaderboard metric" className="flex flex-wrap gap-2">
          {METRICS.map((m) => (
            <Link
              key={m}
              href={href(base, { metric: m, page: undefined })}
              aria-current={m === metric ? "page" : undefined}
              className={m === metric ? "btn-red btn-sm" : "btn-ghost btn-sm"}
            >
              {METRIC_LABELS[m]}
            </Link>
          ))}
        </nav>
        <form method="get" action="/leaderboards" className="flex gap-2" role="search">
          <input type="hidden" name="metric" value={metric} />
          {order === "asc" ? <input type="hidden" name="order" value="asc" /> : null}
          <label htmlFor="q" className="sr-only">Search player name</label>
          <input id="q" name="q" defaultValue={q} placeholder="Search player…" maxLength={16} pattern="[A-Za-z0-9_]*" className="field w-full sm:w-56" />
          <button type="submit" className="btn-ghost btn-sm">Search</button>
          {q ? <Link href={href(base, { q: undefined, page: undefined })} className="btn-ghost btn-sm">Clear</Link> : null}
        </form>
      </div>

      {result === null ? (
        <div className="panel p-10 text-center text-bone-300" role="alert">Leaderboards are temporarily unavailable. Please try again shortly.</div>
      ) : result.rows.length === 0 ? (
        <div className="panel p-10 text-center">
          <p className="font-hud text-xl font-bold text-white">{q ? `No players matching “${q}”` : "No stats yet"}</p>
          <p className="mt-2 text-bone-400">
            {q ? "Try a different name." : "Stats appear here once the game server starts sending them to the website."}
          </p>
        </div>
      ) : (
        <div className="panel overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-left">
              <caption className="sr-only">Top players by {METRIC_LABELS[metric]}</caption>
              <thead className="border-b border-white/5 bg-ink-900/70">
                <tr>
                  <th scope="col" className="table-head px-4 py-3 w-16">#</th>
                  <th scope="col" className="table-head px-4 py-3">Player</th>
                  {METRICS.map((m) => (
                    <th key={m} scope="col" className="table-head px-4 py-3 text-right" aria-sort={m === metric ? (order === "desc" ? "descending" : "ascending") : undefined}>
                      <Link
                        href={href(base, { metric: m, order: m === metric && order === "desc" ? "asc" : undefined, page: undefined })}
                        className={`inline-flex items-center gap-1 hover:text-white ${m === metric ? "text-blood-400" : ""}`}
                      >
                        {METRIC_LABELS[m]}
                        {m === metric ? <span aria-hidden>{order === "desc" ? "▼" : "▲"}</span> : null}
                      </Link>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {result.rows.map((r) => (
                  <tr key={r.uuid} className="border-b border-white/[0.04] transition hover:bg-blood-500/[0.06]">
                    <td className="px-4 py-3 font-hud text-lg font-bold">
                      <span className={r.rank === 1 ? "text-blood-400 text-glow" : r.rank <= 3 ? "text-blood-300" : "text-bone-400"}>{r.rank}</span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <Avatar name={r.name} size={32} />
                        <span className="font-hud text-lg font-semibold text-white">{r.name}</span>
                        {r.hearts !== null ? <span className="text-xs text-blood-300" title="Hearts">♥ {r.hearts}</span> : null}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums">{r.kills.toLocaleString("en-US")}</td>
                    <td className="px-4 py-3 text-right tabular-nums">{r.deaths.toLocaleString("en-US")}</td>
                    <td className="px-4 py-3 text-right tabular-nums">{formatBalance(r.balance)}</td>
                    <td className="px-4 py-3 text-right tabular-nums">{formatPlaytime(r.playtimeSeconds)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <nav aria-label="Pagination" className="flex items-center justify-between border-t border-white/5 px-4 py-3 text-sm">
            <span className="text-bone-400">
              Page {result.page} of {result.pageCount} · {result.total.toLocaleString("en-US")} players
            </span>
            <div className="flex gap-2">
              {result.page > 1 ? (
                <Link className="btn-ghost btn-sm" href={href(base, { page: String(result.page - 1) })} rel="prev">← Prev</Link>
              ) : <span className="btn-ghost btn-sm opacity-40" aria-disabled>← Prev</span>}
              {result.page < result.pageCount ? (
                <Link className="btn-ghost btn-sm" href={href(base, { page: String(result.page + 1) })} rel="next">Next →</Link>
              ) : <span className="btn-ghost btn-sm opacity-40" aria-disabled>Next →</span>}
            </div>
          </nav>
        </div>
      )}
      <p className="mt-4 text-xs text-bone-400">
        Avatars by mc-heads.net. Balance only shows for players whose economy balance was reported by the server.
      </p>
    </div>
  );
}
