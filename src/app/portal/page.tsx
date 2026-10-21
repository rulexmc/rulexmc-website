import type { Metadata } from "next";
import Link from "next/link";
import { requireUser } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { getStatsProvider, formatBalance, formatPlaytime, METRICS, METRIC_LABELS, type Metric } from "@/lib/stats";
import { bodyUrl } from "@/lib/avatar";
import { LinkCodeForm, LinkUsernameForm } from "@/components/PortalForms";
import { SampleBadge } from "@/components/SampleBadge";
import { unlinkUsernameAction } from "./actions";
import Image from "next/image";

export const metadata: Metadata = { title: "Player portal", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

function IntegrationNote({ children }: { children: React.ReactNode }) {
  return (
    <p className="mt-3 rounded border border-white/10 bg-white/[0.03] px-3 py-2 text-xs text-bone-400">
      <span className="badge mr-2 border border-bone-400/30 text-bone-300">Needs server integration</span>
      {children}
    </p>
  );
}

export default async function PortalPage({ searchParams }: { searchParams: Promise<{ welcome?: string; denied?: string }> }) {
  const user = await requireUser("/portal");
  const sp = await searchParams;
  const provider = getStatsProvider();

  const [activity, code] = await Promise.all([
    prisma.activity.findMany({ where: { userId: user.id }, orderBy: { createdAt: "desc" }, take: 10 }),
    prisma.linkCode.findFirst({ where: { userId: user.id, usedAt: null, expiresAt: { gt: new Date() } }, orderBy: { createdAt: "desc" } }),
  ]);

  const lookup = user.mcVerified && user.mcUuid ? user.mcUuid : user.mcUsername;
  const stats = lookup ? await provider.getPlayer(lookup).catch(() => null) : null;
  const ranks: Partial<Record<Metric, number | null>> = {};
  if (stats) for (const m of METRICS) ranks[m] = await provider.getRank(stats.uuid, m).catch(() => null);

  return (
    <div className="container-x py-14">
      {sp.welcome ? <div className="mb-6 rounded-md border border-emerald-400/40 bg-emerald-400/10 px-4 py-3 text-sm text-emerald-100" role="status">Welcome to RuleX MC, {user.displayName}! Link your Minecraft username below.</div> : null}
      {sp.denied ? <div className="mb-6 rounded-md border border-blood-500/50 bg-blood-900/40 px-4 py-3 text-sm text-blood-200" role="alert">You don&apos;t have access to that page.</div> : null}

      <header className="mb-10 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="eyebrow">Player portal</p>
          <h1 className="h-display mt-2 text-3xl text-white sm:text-4xl">{user.displayName}</h1>
          <p className="mt-1 text-sm text-bone-400">{user.email} · member since {user.createdAt.toLocaleDateString("en-US", { month: "short", year: "numeric" })}{user.role === "ADMIN" ? " · Admin" : ""}</p>
        </div>
        <Link href="/portal/reports" className="btn-ghost btn-sm self-start sm:self-auto">Report a player</Link>
      </header>

      <div className="grid gap-6 lg:grid-cols-3">
        <section className="panel p-6" aria-labelledby="mc">
          <h2 id="mc" className="font-hud text-xl font-bold uppercase tracking-wider text-white">Minecraft account</h2>
          <div className="mt-5 flex items-center gap-5">
            {user.mcUsername ? (
              <Image src={bodyUrl(user.mcUsername, 160)} alt={`${user.mcUsername}'s skin`} width={80} height={160} unoptimized className="[image-rendering:pixelated] drop-shadow-[0_0_20px_rgba(208,18,41,0.35)]" />
            ) : (
              <div className="flex h-40 w-20 items-center justify-center rounded border border-dashed border-white/15 text-xs text-bone-400">No skin</div>
            )}
            <div className="min-w-0">
              <p className="truncate font-hud text-2xl font-bold text-white">{user.mcUsername ?? "Not linked"}</p>
              {user.mcUsername ? (
                user.mcVerified
                  ? <span className="badge mt-2 border border-emerald-400/40 bg-emerald-400/10 text-emerald-300">✓ Verified</span>
                  : <span className="badge mt-2 border border-amber-400/40 bg-amber-400/10 text-amber-200">Unverified</span>
              ) : null}
            </div>
          </div>
          <div className="mt-6"><LinkUsernameForm current={user.mcUsername} /></div>
          {user.mcUsername ? (
            <form action={unlinkUsernameAction} className="mt-2">
              <button type="submit" className="text-xs text-bone-400 underline hover:text-white">Unlink username</button>
            </form>
          ) : null}

          {user.mcUsername && !user.mcVerified ? (
            <div className="mt-6 border-t border-white/5 pt-5">
              <h3 className="font-hud font-bold uppercase tracking-wider text-white">Verify ownership</h3>
              {code ? (
                <div className="mt-3">
                  <p className="text-sm text-bone-300">Join the server as <strong className="text-white">{user.mcUsername}</strong> and type:</p>
                  <code className="mt-2 block rounded border border-blood-500/40 bg-ink-900 px-3 py-2 font-hud text-lg font-bold tracking-widest text-blood-300">/verify {code.code}</code>
                  <p className="mt-1 text-xs text-bone-400">Expires {code.expiresAt.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", timeZone: "Asia/Kolkata", timeZoneName: "short" })}.</p>
                </div>
              ) : null}
              <div className="mt-3"><LinkCodeForm /></div>
              <IntegrationNote>The <code>/verify</code> command requires a small server plugin/script that calls <code>POST /api/ingest/verify</code>. See README → Integrations.</IntegrationNote>
            </div>
          ) : null}
        </section>

        <section className="panel p-6 lg:col-span-2" aria-labelledby="stats">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 id="stats" className="font-hud text-xl font-bold uppercase tracking-wider text-white">Your stats</h2>
            {!provider.live ? <SampleBadge /> : null}
          </div>
          {!user.mcUsername ? (
            <p className="mt-4 text-bone-400">Link your Minecraft username to see your stats and leaderboard rank.</p>
          ) : !stats ? (
            <>
              <p className="mt-4 text-bone-400">No stats found for <strong className="text-white">{user.mcUsername}</strong> yet. Stats appear after you play and the server syncs them.</p>
              <IntegrationNote>Stats, balance and playtime are pushed by the game server to <code>POST /api/ingest/stats</code>.</IntegrationNote>
            </>
          ) : (
            <>
              {!user.mcVerified ? <p className="mt-2 text-xs text-amber-200">Shown for the unverified name {user.mcUsername}. Verify to lock it to your account.</p> : null}
              <dl className="mt-5 grid grid-cols-2 gap-px overflow-hidden rounded-lg bg-white/5 sm:grid-cols-4">
                {METRICS.map((m) => {
                  const value =
                    m === "kills" ? stats.kills.toLocaleString("en-US")
                    : m === "deaths" ? stats.deaths.toLocaleString("en-US")
                    : m === "balance" ? formatBalance(stats.balance)
                    : formatPlaytime(stats.playtimeSeconds);
                  return (
                    <div key={m} className="bg-ink-850 p-4">
                      <dt className="table-head">{METRIC_LABELS[m]}</dt>
                      <dd className="mt-1 font-hud text-2xl font-bold text-white">{value}</dd>
                      <dd className="text-xs text-bone-400">{ranks[m] ? `Rank #${ranks[m]}` : m === "balance" && stats.balance === null ? "Not reported" : "Unranked"}</dd>
                    </div>
                  );
                })}
              </dl>
              <div className="mt-4 flex flex-wrap gap-4 text-sm text-bone-300">
                <span>K/D: <strong className="text-white">{(stats.kills / Math.max(1, stats.deaths)).toFixed(2)}</strong></span>
                {stats.hearts !== null ? <span>Hearts: <strong className="text-blood-300">♥ {stats.hearts}</strong></span> : null}
                {stats.lastSeen ? <span>Last seen: {stats.lastSeen.toLocaleDateString("en-US")}</span> : null}
              </div>
            </>
          )}

          <h3 className="mt-10 font-hud text-lg font-bold uppercase tracking-wider text-white">Recent activity</h3>
          {activity.length === 0 ? (
            <p className="mt-3 text-bone-400">No activity yet.</p>
          ) : (
            <ol className="mt-3 divide-y divide-white/5">
              {activity.map((a) => (
                <li key={a.id} className="flex items-center justify-between gap-4 py-2.5 text-sm">
                  <span className="text-bone-200">{a.message}</span>
                  <time className="shrink-0 text-xs text-bone-400" dateTime={a.createdAt.toISOString()}>
                    {a.createdAt.toLocaleString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit", timeZone: "Asia/Kolkata", timeZoneName: "short" })}
                  </time>
                </li>
              ))}
            </ol>
          )}
        </section>
      </div>
    </div>
  );
}
