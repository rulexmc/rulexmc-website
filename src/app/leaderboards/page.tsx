import type { Metadata } from "next";
import Link from "next/link";
import { Avatar } from "@/components/Avatar";
import { SampleBadge } from "@/components/SampleBadge";
import { LiveBadge } from "@/components/LiveBadge";
import { PageHero } from "@/components/PageHero";
import { Icon } from "@/components/Icon";
import { METRIC_ICON } from "@/components/metric-icons";
import { CountUp } from "@/components/CountUp";
import { EmptyState } from "@/components/EmptyState";
import { Pagination } from "@/components/Pagination";
import { LeaderboardSearch } from "@/components/LeaderboardSearch";
import {
  getStatsProvider, METRICS, METRIC_BLURB, METRIC_LABELS, OPTIONAL_METRICS, formatMetric, formatPlaytime,
  type LeaderboardEntry, type LeaderboardResult, type Metric, type StatsSummary,
} from "@/lib/stats";
import {
  LEADERBOARD_PAGE_SIZE, leaderboardHref, parseLeaderboardParams, playerHref, type LeaderboardParams, type RawLeaderboardParams,
} from "@/lib/leaderboard-params";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: "Leaderboards",
  description: "Top RuleX MC players ranked by kills, hearts, playtime, balance, level and deaths. Search any player and climb the ranks.",
  path: "/leaderboards",
});
export const dynamic = "force-dynamic";

const PODIUM_STYLE = [
  { ring: "border-amber-300/50", label: "text-amber-200", glow: "shadow-[0_0_40px_-10px_rgba(252,211,77,0.55)]", place: "1st", order: "sm:order-2 sm:-translate-y-4" },
  { ring: "border-slate-300/40", label: "text-slate-200", glow: "shadow-[0_0_34px_-12px_rgba(203,213,225,0.45)]", place: "2nd", order: "sm:order-1" },
  { ring: "border-orange-400/40", label: "text-orange-300", glow: "shadow-[0_0_34px_-12px_rgba(251,146,60,0.45)]", place: "3rd", order: "sm:order-3" },
] as const;

function Podium({ rows, metric }: { rows: LeaderboardEntry[]; metric: Metric }) {
  return (
    <ol className="mb-8 grid gap-4 sm:grid-cols-3 sm:items-end" aria-label={`Top 3 by ${METRIC_LABELS[metric]}`} data-testid="podium">
      {rows.slice(0, 3).map((r, i) => {
        const st = PODIUM_STYLE[i]!;
        return (
          <li key={r.uuid} className={`${st.order} reveal`} style={{ "--i": i } as React.CSSProperties}>
            <Link
              href={playerHref(r.name)}
              className={`card flex flex-col items-center p-6 text-center ${st.ring} ${st.glow}`}
            >
              <span className={`font-display text-sm font-black uppercase tracking-[0.2em] ${st.label}`}>{st.place}</span>
              <Avatar name={r.name} size={64} className="mt-4 rounded-md" />
              <span className="mt-3 max-w-full truncate font-hud text-xl font-bold text-white">{r.name}</span>
              <span className="mt-1 font-display text-2xl font-black tabular-nums text-white">{formatMetric(r, metric)}</span>
              <span className="text-xs uppercase tracking-[0.18em] text-bone-400">{METRIC_LABELS[metric]}</span>
            </Link>
          </li>
        );
      })}
    </ol>
  );
}

function SummaryTiles({ summary, live }: { summary: StatsSummary; live: boolean }) {
  const tiles: { label: string; value: number | string }[] = [
    { label: "Players ranked", value: summary.players },
    { label: "Total kills", value: summary.totalKills },
    { label: "Time played", value: formatPlaytime(summary.totalPlaytimeSeconds) },
  ];
  return (
    <dl className="grid grid-cols-3 gap-px overflow-hidden rounded-xl border border-white/[0.07] bg-white/[0.05] lg:min-w-[26rem]" aria-label={live ? "Leaderboard totals" : "Leaderboard totals (sample data)"}>
      {tiles.map((t) => (
        <div key={t.label} className="bg-ink-850/90 px-4 py-3.5">
          <dt className="table-head truncate">{t.label}</dt>
          <dd className="mt-1 truncate font-hud text-xl font-bold text-white sm:text-2xl">
            {typeof t.value === "number" ? (live ? <CountUp value={t.value} /> : t.value.toLocaleString("en-US")) : t.value}
          </dd>
        </div>
      ))}
    </dl>
  );
}

function MetricTabs({ params }: { params: LeaderboardParams }) {
  return (
    <nav aria-label="Leaderboard metric" className="-mx-4 overflow-x-auto px-4 pb-1 sm:mx-0 sm:px-0">
      <ul className="flex w-max gap-1 rounded-xl border border-white/[0.07] bg-ink-900/70 p-1">
        {METRICS.map((m) => {
          const active = m === params.metric;
          return (
            <li key={m}>
              <Link
                href={leaderboardHref(params, { metric: m, page: 1, order: "desc" })}
                aria-current={active ? "page" : undefined}
                scroll={false}
                className={`flex min-h-10 items-center gap-2 rounded-lg px-3.5 font-hud text-sm font-bold uppercase tracking-[0.12em] transition-colors duration-200 ${
                  active
                    ? "bg-gradient-to-b from-blood-500 to-blood-700 text-white shadow-[0_6px_20px_-8px_rgba(208,18,41,0.9)]"
                    : "text-bone-300 hover:bg-white/[0.05] hover:text-white"
                }`}
              >
                <Icon name={METRIC_ICON[m]} className="h-4 w-4" /> {METRIC_LABELS[m]}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

export default async function LeaderboardsPage({ searchParams }: { searchParams: Promise<RawLeaderboardParams> }) {
  const params = parseLeaderboardParams(await searchParams);
  const { metric, order, q } = params;

  const provider = getStatsProvider();
  let result: LeaderboardResult | null = null;
  let summary: StatsSummary | null = null;
  try {
    [result, summary] = await Promise.all([
      provider.getLeaderboard({ metric, order, page: params.page, pageSize: LEADERBOARD_PAGE_SIZE, search: q || undefined }),
      provider.getSummary().catch(() => null),
    ]);
  } catch (err) {
    console.error("leaderboard query failed", err);
  }
  const current: LeaderboardParams = { ...params, page: result?.page ?? params.page };
  const showPodium = !!result && result.page === 1 && !q && order === "desc" && result.rows.length >= 3;
  const others = METRICS.filter((m) => m !== metric);

  return (
    <>
      <PageHero
        eyebrow="Hall of hearts"
        title="Leaderboards"
        breadcrumbs={[{ name: "Leaderboards", path: "/leaderboards" }]}
        actions={provider.live ? <LiveBadge className="self-start" /> : <SampleBadge className="self-start" />}
        aside={summary && summary.players > 0 ? <SummaryTiles summary={summary} live={provider.live} /> : undefined}
      >
        The top RuleX MC players by kills, hearts, playtime, balance and level. Search for any player to see where they rank.
      </PageHero>

      <div className="container-x py-10 sm:py-14">
        {!provider.live ? (
          <p className="mb-6 flex items-start gap-3 rounded-xl border border-amber-400/40 bg-amber-400/10 px-4 py-3 text-sm text-amber-100" role="note">
            <Icon name="info" className="mt-0.5 h-4 w-4 shrink-0" />
            These numbers are generated sample data for development. They are not real players or live stats.
          </p>
        ) : null}

        <div className="mb-4 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <MetricTabs params={current} />
          <LeaderboardSearch initial={q} metric={metric} order={order} />
        </div>
        <div className="mb-8 flex flex-col gap-3 text-sm sm:flex-row sm:items-center sm:justify-between">
          <p className="text-bone-400" id="metric-blurb">{METRIC_BLURB[metric]}</p>
          <Link
            href={leaderboardHref(current, { order: order === "desc" ? "asc" : "desc", page: 1 })}
            scroll={false}
            className="btn-ghost btn-sm shrink-0 self-start sm:self-auto"
            data-testid="order-toggle"
          >
            <Icon name="sort" className="h-4 w-4" />
            {order === "desc" ? "Highest first" : "Lowest first"}
            <span className="sr-only">. Switch to {order === "desc" ? "lowest" : "highest"} first.</span>
          </Link>
        </div>

        {result === null ? (
          <EmptyState icon="alert" tone="error" title="Leaderboards are temporarily unavailable" role="alert">
            We couldn&apos;t load player stats right now. Please try again shortly.
          </EmptyState>
        ) : result.rows.length === 0 ? (
          <EmptyState
            icon={q ? "search" : METRIC_ICON[metric]}
            title={q ? `No players matching “${q}”` : OPTIONAL_METRICS.has(metric) ? `No ${METRIC_LABELS[metric].toLowerCase()} reported yet` : "No stats yet"}
            action={q
              ? <Link href={leaderboardHref(current, { q: "", page: 1 })} className="btn-ghost btn-sm">Clear search</Link>
              : <Link href="/server#join" className="btn-red btn-sm">Start playing</Link>}
          >
            {q
              ? "Check the spelling, or try part of the name."
              : OPTIONAL_METRICS.has(metric)
                ? `This board fills up once the game server starts reporting ${METRIC_LABELS[metric].toLowerCase()} for players.`
                : "Website rankings appear here once the game server starts reporting stats. Until then, the live hologram leaderboards in-game show the top players."}
          </EmptyState>
        ) : (
          <>
            {showPodium ? <Podium rows={result.rows} metric={metric} /> : null}
            <div className="panel overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left md:min-w-[720px]" data-testid="leaderboard-table" aria-describedby="metric-blurb">
                  <caption className="sr-only">
                    Players ranked by {METRIC_LABELS[metric]}, {order === "desc" ? "highest first" : "lowest first"}
                    {q ? `, filtered by “${q}”` : ""}{provider.live ? "" : " (sample data)"}
                  </caption>
                  <thead className="border-b border-white/5 bg-ink-900/70">
                    <tr>
                      <th scope="col" className="table-head w-14 px-4 py-3">#</th>
                      <th scope="col" className="table-head w-full px-4 py-3 md:w-auto">Player</th>
                      <th scope="col" className="table-head px-4 py-3 text-right text-blood-300" aria-sort={order === "desc" ? "descending" : "ascending"}>
                        {METRIC_LABELS[metric]}
                      </th>
                      {others.map((m) => (
                        <th key={m} scope="col" className="table-head hidden px-4 py-3 text-right md:table-cell">
                          <Link href={leaderboardHref(current, { metric: m, page: 1, order: "desc" })} scroll={false} className="rounded transition-colors hover:text-white">
                            {METRIC_LABELS[m]}<span className="sr-only">: rank by this</span>
                          </Link>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {result.rows.map((r) => (
                      <tr key={r.uuid} className="group border-b border-white/[0.04] transition-colors hover:bg-blood-500/[0.06]">
                        <td className="px-4 py-3 font-display text-base font-black tabular-nums">
                          <span className={r.rank === 1 ? "text-blood-300 text-glow" : r.rank <= 3 ? "text-blood-300" : "text-bone-400"}>{r.rank}</span>
                        </td>
                        <td className="px-4 py-3">
                          <Link href={playerHref(r.name)} className="flex min-w-0 items-center gap-3 rounded">
                            <Avatar name={r.name} size={32} className="transition-transform duration-200 group-hover:scale-110" />
                            <span className="truncate font-hud text-lg font-semibold text-white group-hover:text-blood-200">{r.name}</span>
                          </Link>
                        </td>
                        <td className="whitespace-nowrap px-4 py-3 text-right font-semibold tabular-nums text-white">{formatMetric(r, metric)}</td>
                        {others.map((m) => (
                          <td key={m} className="hidden whitespace-nowrap px-4 py-3 text-right tabular-nums text-bone-300 md:table-cell">{formatMetric(r, m)}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <Pagination
                page={result.page}
                pageCount={result.pageCount}
                hrefFor={(p) => leaderboardHref(current, { page: p })}
                summary={<>Page {result.page} of {result.pageCount} · {result.total.toLocaleString("en-US")} {result.total === 1 ? "player" : "players"}</>}
              />
            </div>
          </>
        )}
        <p className="mt-5 text-xs text-bone-400">
          Avatars by mc-heads.net. “—” means the server hasn&apos;t reported that stat for the player. Select a player to see their profile.
        </p>
      </div>
    </>
  );
}
