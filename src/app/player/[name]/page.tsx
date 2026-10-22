import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound, permanentRedirect } from "next/navigation";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { CountUp } from "@/components/CountUp";
import { EmptyState } from "@/components/EmptyState";
import { Icon } from "@/components/Icon";
import { JsonLd } from "@/components/JsonLd";
import { LiveBadge } from "@/components/LiveBadge";
import { SampleBadge } from "@/components/SampleBadge";
import { METRIC_ICON } from "@/components/metric-icons";
import { bodyUrl } from "@/lib/avatar";
import { getConfig } from "@/lib/config";
import { LEADERBOARD_PAGE_SIZE, leaderboardHref, playerHref } from "@/lib/leaderboard-params";
import { loadPlayerProfile } from "@/lib/player-profile";
import { pageMetadata } from "@/lib/seo";
import { METRICS, METRIC_LABELS, formatMetric, kdRatio, metricValue, type Metric, type PlayerStatRow } from "@/lib/stats";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ name: string }> };

function safeDecode(v: string): string {
  try {
    return decodeURIComponent(v);
  } catch {
    return v;
  }
}

const INT_METRICS: ReadonlySet<Metric> = new Set<Metric>(["kills", "deaths", "hearts", "level"]);

function describe(name: string, stats: PlayerStatRow | null): string {
  if (!stats) return `${name} on RuleX MC: verified player profile. Stats appear once the game server reports them.`;
  const bits = [`${stats.kills.toLocaleString("en-US")} kills`, `${stats.deaths.toLocaleString("en-US")} deaths`];
  if (stats.hearts !== null) bits.push(`${stats.hearts} hearts`);
  if (stats.level !== null) bits.push(`level ${stats.level}`);
  bits.push(`${formatMetric(stats, "playtime")} played`);
  return `${name}'s RuleX MC stats: ${bits.join(", ")}. See their leaderboard ranks.`;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { name } = await params;
  const profile = await loadPlayerProfile(safeDecode(name));
  if (profile.kind === "unavailable") return { title: "Player stats unavailable", robots: { index: false, follow: true } };
  // Throwing here (metadata is resolved before streaming starts) gives unknown players a real 404 status,
  // even though this route has a loading.tsx Suspense boundary.
  if (profile.kind !== "found") notFound();
  return pageMetadata({
    title: `${profile.name} · Player stats`,
    description: describe(profile.name, profile.stats),
    path: playerHref(profile.name),
    // Sample (development) data must never be indexed.
    noIndex: !profile.live,
  });
}

function rankHref(metric: Metric, rank: number) {
  return leaderboardHref({ metric, order: "desc", q: "", page: Math.ceil(rank / LEADERBOARD_PAGE_SIZE) });
}

function StatTile({ metric, stats, rank, live, index }: { metric: Metric; stats: PlayerStatRow; rank: number | null; live: boolean; index: number }) {
  const raw = metricValue(stats, metric);
  return (
    <li className="reveal" style={{ "--i": index % 3 } as React.CSSProperties}>
      <div className="card flex h-full flex-col p-5">
        <div className="flex items-center justify-between gap-3">
          <span className="table-head">{METRIC_LABELS[metric]}</span>
          <Icon name={METRIC_ICON[metric]} className="h-4 w-4 text-blood-400" />
        </div>
        <p className="mt-2 font-display text-3xl font-black text-white" data-testid={`stat-${metric}`}>
          {raw !== null && live && INT_METRICS.has(metric) ? <CountUp value={raw} /> : formatMetric(stats, metric)}
        </p>
        <p className="mt-auto pt-3 text-xs text-bone-400">
          {raw === null ? (
            "Not reported by the server yet"
          ) : rank ? (
            <Link href={rankHref(metric, rank)} className="link no-underline hover:underline">Rank #{rank.toLocaleString("en-US")} on {METRIC_LABELS[metric]}</Link>
          ) : (
            "Unranked"
          )}
        </p>
      </div>
    </li>
  );
}

export default async function PlayerPage({ params }: Props) {
  const { name: rawParam } = await params;
  const raw = safeDecode(rawParam);
  const profile = await loadPlayerProfile(raw);
  if (profile.kind === "invalid" || profile.kind === "not-found") notFound();

  if (profile.kind === "unavailable") {
    return (
      <div className="container-x py-12 sm:py-16">
        <Breadcrumbs items={[{ name: "Leaderboards", path: "/leaderboards" }, { name: profile.name, path: playerHref(profile.name) }]} />
        <EmptyState icon="alert" tone="error" title="Player stats are temporarily unavailable" role="alert"
          action={<Link href="/leaderboards" className="btn-ghost btn-sm">Back to leaderboards</Link>}>
          We couldn&apos;t load this profile right now. Please try again shortly.
        </EmptyState>
      </div>
    );
  }

  // One canonical URL per player (in-game capitalisation).
  if (profile.name !== raw) permanentRedirect(playerHref(profile.name));

  const { name, stats, ranks, verified, live } = profile;
  const base = getConfig().siteUrl.replace(/\/$/, "");
  const best = stats
    ? METRICS.filter((m) => m !== "deaths" && ranks[m] !== null).sort((a, b) => ranks[a]! - ranks[b]!)[0]
    : undefined;

  return (
    <>
      {live ? (
        <JsonLd
          data={{
            "@context": "https://schema.org",
            "@type": "ProfilePage",
            url: `${base}${playerHref(name)}`,
            name: `${name} on RuleX MC`,
            ...(stats?.updatedAt ? { dateModified: stats.updatedAt.toISOString() } : {}),
            mainEntity: { "@type": "Person", name, alternateName: name, description: `RuleX MC player ${name}` },
            isPartOf: { "@id": `${base}/#website` },
          }}
        />
      ) : null}

      <section className="relative isolate overflow-hidden border-b border-white/[0.06]">
        <div aria-hidden className="block-grid absolute inset-0 -z-10 [mask-image:radial-gradient(ellipse_at_top,black_20%,transparent_70%)]" />
        <div aria-hidden className="absolute -top-40 left-1/2 -z-10 h-80 w-[56rem] max-w-[140vw] -translate-x-1/2 rounded-full bg-blood-600/20 blur-3xl" />
        <div className="container-x py-10 sm:py-14">
          <div className="enter">
            <Breadcrumbs items={[{ name: "Leaderboards", path: "/leaderboards" }, { name, path: playerHref(name) }]} />
          </div>
          <div className="flex flex-col gap-8 sm:flex-row sm:items-end">
            <div className="enter enter-1 flex h-[200px] w-[100px] shrink-0 items-end justify-center self-center sm:self-auto">
              <Image
                src={bodyUrl(name, 200)}
                alt={`${name}'s Minecraft skin`}
                width={100}
                height={200}
                unoptimized
                priority
                className="[image-rendering:pixelated] drop-shadow-[0_0_28px_rgba(208,18,41,0.4)]"
              />
            </div>
            <div className="min-w-0 flex-1 text-center sm:text-left">
              <p className="eyebrow enter">Player profile</p>
              <h1 className="h-display enter enter-1 mt-3 break-words text-4xl leading-none text-white sm:text-5xl lg:text-6xl" data-testid="player-name">{name}</h1>
              <div className="enter enter-2 mt-5 flex flex-wrap items-center justify-center gap-2 sm:justify-start">
                {verified ? (
                  <span className="badge border border-emerald-400/40 bg-emerald-400/10 text-emerald-300" data-testid="verified-badge"
                    title={verified.verifiedAt ? `Ownership verified in-game on ${verified.verifiedAt.toLocaleDateString("en-US", { timeZone: "Asia/Kolkata", dateStyle: "medium" })}` : "Ownership verified in-game"}>
                    <Icon name="badge-check" className="h-3.5 w-3.5" /> Verified
                  </span>
                ) : null}
                {live ? <LiveBadge /> : <SampleBadge />}
                {best && ranks[best] ? (
                  <span className="chip"><Icon name="trophy" className="h-3.5 w-3.5 text-amber-200" /> #{ranks[best]} in {METRIC_LABELS[best]}</span>
                ) : null}
                {stats?.hearts != null ? (
                  <span className="chip"><Icon name="heart" className="h-3.5 w-3.5 text-blood-400" /> {stats.hearts} {stats.hearts === 1 ? "heart" : "hearts"}</span>
                ) : null}
              </div>
              {stats?.lastSeen ? (
                <p className="enter enter-3 mt-4 text-sm text-bone-400">
                  Last seen <time dateTime={stats.lastSeen.toISOString()}>{stats.lastSeen.toLocaleDateString("en-US", { timeZone: "Asia/Kolkata", dateStyle: "medium" })}</time>
                </p>
              ) : null}
            </div>
          </div>
        </div>
      </section>

      <div className="container-x py-10 sm:py-14">
        {!live ? (
          <p className="mb-8 flex items-start gap-3 rounded-xl border border-amber-400/40 bg-amber-400/10 px-4 py-3 text-sm text-amber-100" role="note">
            <Icon name="info" className="mt-0.5 h-4 w-4 shrink-0" />
            This profile uses generated sample data for development. It is not a real player and these are not live stats.
          </p>
        ) : null}

        {stats ? (
          <section aria-labelledby="stats-title">
            <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
              <h2 id="stats-title" className="h-display text-2xl text-white sm:text-3xl">Stats</h2>
              <p className="text-sm text-bone-400">K/D ratio <strong className="font-hud text-lg text-white">{kdRatio(stats)}</strong></p>
            </div>
            <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {METRICS.map((m, i) => <StatTile key={m} metric={m} stats={stats} rank={ranks[m]} live={live} index={i} />)}
            </ul>
            <p className="mt-5 text-xs text-bone-400">
              {stats.updatedAt
                ? <>Stats last synced from the game server on <time dateTime={stats.updatedAt.toISOString()}>{stats.updatedAt.toLocaleString("en-US", { timeZone: "Asia/Kolkata", dateStyle: "medium", timeStyle: "short" })} IST</time>.</>
                : "Stats shown here are not synced from the game server."}
              {" "}Ranks are among players who have that stat reported.
            </p>
          </section>
        ) : (
          <EmptyState icon="hud" title="No stats reported yet"
            action={<><Link href="/leaderboards" className="btn-ghost btn-sm">Leaderboards</Link><Link href="/server#join" className="btn-red btn-sm">Play now</Link></>}>
            {name} has verified their account, but the game server hasn&apos;t sent any stats for them yet. They&apos;ll show here after the next sync.
          </EmptyState>
        )}

        <div className="mt-12 flex flex-wrap gap-3">
          <Link href="/leaderboards" className="btn-ghost btn-sm"><Icon name="chevron-left" className="h-4 w-4" /> All leaderboards</Link>
          <Link href="/portal" className="btn-ghost btn-sm"><Icon name="badge-check" className="h-4 w-4" /> Verify your own account</Link>
        </div>
      </div>
    </>
  );
}
