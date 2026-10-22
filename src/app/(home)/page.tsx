import type { Metadata } from "next";
import Link from "next/link";
import { ParticleCanvas } from "@/components/ParticleCanvas";
import { CopyAddress } from "@/components/CopyAddress";
import { StatusPanel } from "@/components/StatusPanel";
import { Logo, PixelHeart } from "@/components/Logo";
import { SectionHeading } from "@/components/SectionHeading";
import { Content } from "@/components/Content";
import { RealmCards } from "@/components/RealmCards";
import { FeatureGrid } from "@/components/FeatureGrid";
import { JoinGuide } from "@/components/JoinGuide";
import { DiscordCTA } from "@/components/DiscordCTA";
import { VoteSection } from "@/components/VoteSection";
import { FaqList } from "@/components/FaqList";
import { Avatar } from "@/components/Avatar";
import { SampleBadge } from "@/components/SampleBadge";
import { Icon, type IconName } from "@/components/Icon";
import { getConfig } from "@/lib/config";
import { getServerStatus } from "@/lib/status";
import { getBlock } from "@/lib/content";
import { prisma } from "@/lib/db";
import { getStatsProvider, type LeaderboardResult } from "@/lib/stats";
import { FAQ, SERVER_FACTS, SITE } from "@/lib/site";
import { pageMetadata, siteJsonLd } from "@/lib/seo";
import { JsonLd } from "@/components/JsonLd";
import { playerHref } from "@/lib/leaderboard-params";

export const dynamic = "force-dynamic";

export const metadata: Metadata = pageMetadata({
  description: SITE.description,
  path: "/",
});

async function getAnnouncements() {
  try {
    return await prisma.announcement.findMany({
      where: { published: true },
      orderBy: [{ pinned: "desc" }, { createdAt: "desc" }],
      take: 3,
    });
  } catch {
    return null;
  }
}

async function getTopKillers(): Promise<{ result: LeaderboardResult; live: boolean } | null> {
  const provider = getStatsProvider();
  try {
    const result = await provider.getLeaderboard({ metric: "kills", order: "desc", page: 1, pageSize: 5 });
    return { result, live: provider.live };
  } catch {
    return null;
  }
}

const QUICK_FACTS: { icon: IconName; label: string }[] = [
  { icon: "devices", label: "Java + Bedrock" },
  { icon: "server", label: `Versions ${SERVER_FACTS.versions}` },
  { icon: "shield", label: "Cracked + premium" },
  { icon: "globe", label: SERVER_FACTS.region },
];

export default async function HomePage() {
  const cfg = getConfig();
  const [status, about, announcements, top] = await Promise.all([
    getServerStatus(), getBlock("home.about"), getAnnouncements(), getTopKillers(),
  ]);
  const address = cfg.server.address?.display ?? null;

  return (
    <>
      <JsonLd data={siteJsonLd(cfg.siteUrl, cfg.community.discord)} />

      {/* ── Hero ─────────────────────────────────────────────── */}
      <section className="relative isolate overflow-hidden border-b border-white/[0.06]" aria-labelledby="hero-title">
        <div aria-hidden className="block-grid absolute inset-0 -z-10 [mask-image:radial-gradient(ellipse_at_center,black_25%,transparent_72%)]" />
        <div aria-hidden className="absolute left-1/2 top-[-12rem] -z-10 h-[34rem] w-[60rem] max-w-[160vw] -translate-x-1/2 animate-drift rounded-full bg-[radial-gradient(closest-side,rgb(165_12_31/0.45),transparent)] blur-2xl" />
        <div aria-hidden className="absolute inset-x-0 bottom-0 -z-10 h-40 bg-gradient-to-b from-transparent to-ink-950" />
        <ParticleCanvas />
        <div className="container-x relative flex flex-col items-center pb-20 pt-14 text-center sm:pb-28 sm:pt-24">
          <div className="enter"><Logo size="lg" /></div>
          <div className="enter enter-1 mt-7">
            <StatusPanel initial={status} variant="compact" />
          </div>
          <h1 id="hero-title" className="h-display enter enter-2 mt-8 max-w-5xl text-[2.35rem] leading-[1.02] text-white min-[400px]:text-5xl sm:text-6xl lg:text-[5.5rem]">
            Your heart.<br />
            <span className="shine-text text-glow">Your survival.</span>
          </h1>
          <p className="lead enter enter-3 mt-6 max-w-2xl">
            Steal hearts on Lifesteal, build an empire in Survival, or sharpen your aim in PvP Practice.
            One crossplay network for Java and Bedrock, versions <span className="whitespace-nowrap">{SERVER_FACTS.versions}</span>.
          </p>
          <div className="enter enter-4 mt-9 w-full">
            <CopyAddress address={address} size="lg" note={address ? `Bedrock players: use port ${SERVER_FACTS.bedrockPort}` : undefined} />
          </div>
          <div className="enter enter-5 mt-8 flex w-full max-w-xl flex-col gap-3 sm:flex-row sm:justify-center">
            <Link href="/server#join" className="btn-red animate-pulse-red px-7">
              <Icon name="play" className="h-4 w-4 fill-current" /> Play now
            </Link>
            <Link href="/leaderboards" className="btn-ghost"><Icon name="trophy" className="h-4 w-4" /> Leaderboards</Link>
            <Link href="/store" className="btn-ghost"><Icon name="star" className="h-4 w-4" /> Store</Link>
          </div>
          <ul className="enter enter-6 mt-12 flex max-w-3xl flex-wrap justify-center gap-2.5" aria-label="Server at a glance">
            {QUICK_FACTS.map((f) => (
              <li key={f.label} className="chip"><Icon name={f.icon} className="h-4 w-4 text-blood-300" />{f.label}</li>
            ))}
          </ul>
        </div>
      </section>

      {/* ── About + live status ─────────────────────────────── */}
      <section className="container-x py-20 sm:py-24" aria-labelledby="about">
        <div className="grid gap-12 lg:grid-cols-[1.1fr_1fr] lg:items-center">
          <div>
            <SectionHeading eyebrow="The network" title={about.title} id="about" />
            <div className="-mt-4 text-lg"><Content body={about.body} /></div>
          </div>
          <div className="space-y-4">
            <StatusPanel initial={status} />
            <div className="panel flex flex-col gap-4 p-5 sm:flex-row sm:items-center">
              <div className="flex gap-1" aria-hidden>
                {Array.from({ length: 10 }, (_, i) => <PixelHeart key={i} className={`h-4 w-5 ${i > 6 ? "opacity-25 grayscale" : ""}`} />)}
              </div>
              <p className="text-sm text-bone-300">On Lifesteal every heart counts. Take theirs, keep yours.</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Realms ──────────────────────────────────────────── */}
      <section className="border-y border-white/[0.06] bg-ink-900/50" aria-labelledby="realms">
        <div className="container-x py-20 sm:py-24">
          <SectionHeading eyebrow="Choose your realm" title="Three realms. One network." id="realms" align="center">
            Jump between realms through the instant transfer portals in the hub.
          </SectionHeading>
          <RealmCards />
        </div>
      </section>

      {/* ── Network features ────────────────────────────────── */}
      <section className="container-x py-20 sm:py-24" aria-labelledby="features">
        <SectionHeading eyebrow="Built different" title="Premium network features" id="features">
          Custom systems built for RuleX MC, from the moment you load into the hub.
        </SectionHeading>
        <FeatureGrid />
      </section>

      {/* ── How to join ─────────────────────────────────────── */}
      <section id="join" className="scroll-mt-24 border-y border-white/[0.06] bg-ink-900/50" aria-labelledby="join-title">
        <div className="container-x py-20 sm:py-24">
          <SectionHeading eyebrow="Get started" title="Join in under a minute" id="join-title">
            Same address on both editions. Java uses the default port; Bedrock uses port {SERVER_FACTS.bedrockPort}.
          </SectionHeading>
          <JoinGuide address={address} host={cfg.server.address?.host ?? null} />
        </div>
      </section>

      {/* ── Leaderboard teaser + announcements ─────────────── */}
      <div className="container-x py-20 sm:py-24">
        <div className="grid gap-10 lg:grid-cols-[1fr_1.15fr]">
          <section aria-labelledby="top-killers" className="reveal">
            <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
              <div>
                <p className="eyebrow">Hall of hearts</p>
                <h2 id="top-killers" className="h-display mt-3 text-2xl text-white sm:text-3xl">Top fighters</h2>
              </div>
              {top && !top.live ? <SampleBadge /> : null}
            </div>
            <div className="panel overflow-hidden">
              {top === null ? (
                <p className="p-6 text-bone-400">Leaderboards are temporarily unavailable.</p>
              ) : top.result.rows.length === 0 ? (
                <div className="p-6">
                  <p className="font-hud text-lg font-bold text-white">No website stats yet</p>
                  <p className="mt-1 text-sm text-bone-400">
                    Rankings appear here once the game server starts reporting stats. Until then, check the live hologram leaderboards in-game.
                  </p>
                </div>
              ) : (
                <ol>
                  {top.result.rows.map((r) => (
                    <li key={r.uuid} className="border-b border-white/[0.05] last:border-0">
                      <Link href={playerHref(r.name)} className="group flex items-center gap-4 px-5 py-3 transition-colors hover:bg-blood-500/[0.06]">
                        <span className={`w-6 font-display text-sm font-black ${r.rank === 1 ? "text-blood-300 text-glow" : "text-bone-400"}`}>{r.rank}</span>
                        <Avatar name={r.name} size={32} className="transition-transform duration-200 motion-safe:group-hover:scale-110" />
                        <span className="min-w-0 flex-1 truncate font-hud text-lg font-semibold text-white group-hover:text-blood-200">{r.name}</span>
                        <span className="font-hud text-lg font-bold tabular-nums text-bone-100">{r.kills.toLocaleString("en-US")}<span className="ml-1 text-xs uppercase tracking-wider text-bone-400">kills</span></span>
                      </Link>
                    </li>
                  ))}
                </ol>
              )}
              <Link href="/leaderboards" className="group flex items-center justify-between border-t border-white/[0.06] bg-ink-900/60 px-5 py-3 font-hud text-sm font-bold uppercase tracking-[0.16em] text-blood-300 transition hover:text-white">
                View full leaderboards <Icon name="arrow-right" className="h-4 w-4 transition-transform duration-200 motion-safe:group-hover:translate-x-1" />
              </Link>
            </div>
          </section>

          <section aria-labelledby="news" className="reveal [--i:1]">
            <div className="mb-6">
              <p className="eyebrow">News</p>
              <h2 id="news" className="h-display mt-3 text-2xl text-white sm:text-3xl">Latest announcements</h2>
            </div>
            {announcements === null ? (
              <p className="panel p-6 text-bone-400">Announcements are unavailable right now.</p>
            ) : announcements.length === 0 ? (
              <p className="panel p-6 text-bone-400">No announcements yet. Check back soon, or follow updates on Discord.</p>
            ) : (
              <div className="space-y-4">
                {announcements.map((a) => (
                  <article key={a.id} className={`p-6 ${a.pinned ? "panel-glow" : "panel"}`}>
                    <div className="flex items-center gap-2 text-xs text-bone-400">
                      {a.pinned ? <span className="badge bg-blood-500/20 text-blood-200">Pinned</span> : null}
                      <time dateTime={a.createdAt.toISOString()}>
                        {a.createdAt.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric", timeZone: "Asia/Kolkata" })}
                      </time>
                    </div>
                    <h3 className="mt-3 font-hud text-xl font-bold text-white">{a.title}</h3>
                    <p className="mt-2 line-clamp-4 whitespace-pre-line text-bone-300">{a.body}</p>
                  </article>
                ))}
              </div>
            )}
          </section>
        </div>
      </div>

      <DiscordCTA />
      <VoteSection />

      {/* ── FAQ ─────────────────────────────────────────────── */}
      <section className="container-x py-16 sm:py-20" aria-labelledby="faq">
        <div className="grid gap-10 lg:grid-cols-[0.8fr_1.2fr]">
          <div>
            <SectionHeading eyebrow="Questions" title="Frequently asked" id="faq">
              Everything you need before your first login.
            </SectionHeading>
            <Link href="/server#faq" className="btn-ghost btn-sm -mt-4">All questions <Icon name="arrow-right" className="h-4 w-4" /></Link>
          </div>
          <FaqList items={FAQ.slice(0, 5)} />
        </div>
      </section>
    </>
  );
}
