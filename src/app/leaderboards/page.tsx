import type { Metadata } from "next";
import Link from "next/link";
import { Avatar } from "@/components/Avatar";
import { SampleBadge } from "@/components/SampleBadge";
import { PageHero } from "@/components/PageHero";
import { Icon, type IconName } from "@/components/Icon";
import {
  getStatsProvider, METRICS, METRIC_LABELS, formatBalance, formatPlaytime,
  type LeaderboardEntry, type LeaderboardResult, type Metric,
} from "@/lib/stats";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: "Leaderboards",
  description: "Top RuleX MC players ranked by kills, deaths, balance and playtime. Search any player and climb the ranks.",
  path: "/leaderboards",
});
export const dynamic = "force-dynamic";

const PAGE_SIZE = 20;

const METRIC_ICON: Record<Metric, IconName> = { kills: "sword", deaths: "heart", balance: "coins", playtime: "zap" };

type SP = { metric?: string; order?: string; page?: string; q?: string };

function href(base: SP, patch: Partial<SP>) {
  const p = new URLSearchParams();
  const merged = { ...base, ...patch };
  for (const [k, v] of Object.entries(merged)) if (v) p.set(k, String(v));
  const s = p.toString();
  return `/leaderboards${s ? `?${s}` : ""}`;
}

function formatMetric(r: LeaderboardEntry, m: Metric): string {
  switch (m) {
    case "kills": return r.kills.toLocaleString("en-US");
    case "deaths": return r.deaths.toLocaleString("en-US");
    case "balance": return formatBalance(r.balance);
    case "playtime": return formatPlaytime(r.playtimeSeconds);
  }
}

const PODIUM_STYLE = [
  { ring: "border-amber-300/50", label: "text-amber-200", glow: "shadow-[0_0_40px_-10px_rgba(252,211,77,0.55)]", place: "1st", order: "sm:order-2 sm:-translate-y-4" },
  { ring: "border-slate-300/40", label: "text-slate-200", glow: "shadow-[0_0_34px_-12px_rgba(203,213,225,0.45)]", place: "2nd", order: "sm:order-1" },
  { ring: "border-orange-400/40", label: "text-orange-300", glow: "shadow-[0_0_34px_-12px_rgba(251,146,60,0.45)]", place: "3rd", order: "sm:order-3" },
] as const;

function Podium({ rows, metric }: { rows: LeaderboardEntry[]; metric: Metric }) {
  return (
    <ol className="mb-8 grid gap-4 sm:grid-cols-3 sm:items-end" aria-label={`Top 3 by ${METRIC_LABELS[metric]}`}>
      {rows.slice(0, 3).map((r, i) => {
        const st = PODIUM_STYLE[i]!;
        return (
          <li key={r.uuid} className={`panel flex flex-col items-center p-6 text-center ${st.ring} ${st.glow} ${st.order}`}>
            <span className={`font-display text-sm font-black uppercase tracking-[0.2em] ${st.label}`}>{st.place}</span>
            <Avatar name={r.name} size={64} className="mt-4 rounded-md" />
            <span className="mt-3 max-w-full truncate font-hud text-xl font-bold text-white">{r.name}</span>
            <span className="mt-1 font-display text-2xl font-black tabular-nums text-white">{formatMetric(r, metric)}</span>
            <span className="text-xs uppercase tracking-[0.18em] text-bone-400">{METRIC_LABELS[metric]}</span>
          </li>
        );
      })}
    </ol>
  );
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
  const showPodium = !!result && result.page === 1 && !q && order === "desc" && result.rows.length >= 3;

  return (
    <>
      <PageHero
        eyebrow="Hall of hearts"
        title="Leaderboards"
        actions={provider.live
          ? <span className="badge self-start border border-emerald-400/40 bg-emerald-400/10 text-emerald-300"><span className="h-1.5 w-1.5 rounded-full bg-emerald-400" aria-hidden /> Live server data</span>
          : <SampleBadge className="self-start" />}
      >
        The top RuleX MC players by kills, deaths, balance and playtime. Search for any player to see where they rank.
      </PageHero>

      <div className="container-x py-12 sm:py-14">
        {!provider.live ? (
          <p className="mb-6 flex items-start gap-3 rounded-xl border border-amber-400/40 bg-amber-400/10 px-4 py-3 text-sm text-amber-100" role="note">
            <Icon name="info" className="mt-0.5 h-4 w-4 shrink-0" />
            These numbers are generated sample data for development. They are not real players or live stats.
          </p>
        ) : null}

        <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <nav aria-label="Leaderboard metric" className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
            {METRICS.map((m) => (
              <Link
                key={m}
                href={href(base, { metric: m, page: undefined })}
                aria-current={m === metric ? "page" : undefined}
                className={`${m === metric ? "btn-red" : "btn-ghost"} btn-sm shrink-0`}
              >
                <Icon name={METRIC_ICON[m]} className="h-4 w-4" /> {METRIC_LABELS[m]}
              </Link>
            ))}
          </nav>
          <form method="get" action="/leaderboards" className="flex w-full gap-2 lg:w-auto" role="search">
            <input type="hidden" name="metric" value={metric} />
            {order === "asc" ? <input type="hidden" name="order" value="asc" /> : null}
            <label htmlFor="q" className="sr-only">Search player name</label>
            <input id="q" name="q" type="search" defaultValue={q} placeholder="Search player…" maxLength={16} pattern="[A-Za-z0-9_]*" className="field flex-1 lg:w-60" autoComplete="off" spellCheck={false} />
            <button type="submit" className="btn-ghost btn-sm">Search</button>
            {q ? <Link href={href(base, { q: undefined, page: undefined })} className="btn-ghost btn-sm">Clear</Link> : null}
          </form>
        </div>

        {result === null ? (
          <div className="panel p-10 text-center text-bone-300" role="alert">Leaderboards are temporarily unavailable. Please try again shortly.</div>
        ) : result.rows.length === 0 ? (
          <div className="panel flex flex-col items-center p-10 text-center sm:p-14">
            <span className="icon-tile"><Icon name="trophy" className="h-6 w-6" /></span>
            <p className="mt-5 font-hud text-2xl font-bold text-white">{q ? `No players matching “${q}”` : "No stats yet"}</p>
            <p className="mt-2 max-w-md text-bone-400">
              {q
                ? "Check the spelling and try again."
                : "Website rankings appear here once the game server starts reporting stats. Until then, the live hologram leaderboards in-game show the top players."}
            </p>
            {!q ? <Link href="/server#join" className="btn-red btn-sm mt-6">Start playing</Link> : null}
          </div>
        ) : (
          <>
            {showPodium ? <Podium rows={result.rows} metric={metric} /> : null}
            <div className="panel overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[640px] text-left">
                  <caption className="sr-only">Players ranked by {METRIC_LABELS[metric]}, {order === "desc" ? "highest first" : "lowest first"}</caption>
                  <thead className="border-b border-white/5 bg-ink-900/70">
                    <tr>
                      <th scope="col" className="table-head w-16 px-4 py-3">#</th>
                      <th scope="col" className="table-head px-4 py-3">Player</th>
                      {METRICS.map((m) => (
                        <th key={m} scope="col" className="table-head px-4 py-3 text-right" aria-sort={m === metric ? (order === "desc" ? "descending" : "ascending") : undefined}>
                          <Link
                            href={href(base, { metric: m, order: m === metric && order === "desc" ? "asc" : undefined, page: undefined })}
                            className={`inline-flex items-center gap-1 rounded transition hover:text-white ${m === metric ? "text-blood-300" : ""}`}
                          >
                            {METRIC_LABELS[m]}
                            {m === metric ? <span aria-hidden>{order === "desc" ? "▼" : "▲"}</span> : null}
                            <span className="sr-only">{m === metric ? `, sorted ${order === "desc" ? "descending" : "ascending"}. Click to reverse.` : ", sort by this column"}</span>
                          </Link>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {result.rows.map((r) => (
                      <tr key={r.uuid} className="border-b border-white/[0.04] transition hover:bg-blood-500/[0.06]">
                        <td className="px-4 py-3 font-display text-base font-black">
                          <span className={r.rank === 1 ? "text-blood-300 text-glow" : r.rank <= 3 ? "text-blood-300" : "text-bone-400"}>{r.rank}</span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <Avatar name={r.name} size={32} />
                            <span className="font-hud text-lg font-semibold text-white">{r.name}</span>
                            {r.hearts !== null ? <span className="text-xs text-blood-300" title="Hearts"><span aria-hidden>♥</span><span className="sr-only">Hearts:</span> {r.hearts}</span> : null}
                          </div>
                        </td>
                        {METRICS.map((m) => (
                          <td key={m} className={`px-4 py-3 text-right tabular-nums ${m === metric ? "font-semibold text-white" : "text-bone-300"}`}>{formatMetric(r, m)}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <nav aria-label="Pagination" className="flex flex-col gap-3 border-t border-white/5 px-4 py-3 text-sm sm:flex-row sm:items-center sm:justify-between">
                <span className="text-bone-400">
                  Page {result.page} of {result.pageCount} · {result.total.toLocaleString("en-US")} players
                </span>
                <div className="flex gap-2">
                  {result.page > 1 ? (
                    <Link className="btn-ghost btn-sm" href={href(base, { page: String(result.page - 1) })} rel="prev">← Prev</Link>
                  ) : <span className="btn-ghost btn-sm pointer-events-none opacity-40" aria-disabled="true">← Prev</span>}
                  {result.page < result.pageCount ? (
                    <Link className="btn-ghost btn-sm" href={href(base, { page: String(result.page + 1) })} rel="next">Next →</Link>
                  ) : <span className="btn-ghost btn-sm pointer-events-none opacity-40" aria-disabled="true">Next →</span>}
                </div>
              </nav>
            </div>
          </>
        )}
        <p className="mt-5 text-xs text-bone-400">
          Avatars by mc-heads.net. Balance only shows for players whose economy balance was reported by the server.
        </p>
      </div>
    </>
  );
}
