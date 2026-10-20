import Link from "next/link";
import { ParticleCanvas } from "@/components/ParticleCanvas";
import { CopyAddress } from "@/components/CopyAddress";
import { StatusPanel } from "@/components/StatusPanel";
import { Logo, PixelHeart } from "@/components/Logo";
import { SectionHeading } from "@/components/SectionHeading";
import { Content } from "@/components/Content";
import { getConfig } from "@/lib/config";
import { getServerStatus } from "@/lib/status";
import { getBlock } from "@/lib/content";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

const FEATURES = [
  { title: "Steal hearts", text: "Every player kill transfers a heart. Your health bar is your rank.", icon: "♥" },
  { title: "Withdraw & trade", text: "Turn spare hearts into items, trade them, or save a friend.", icon: "⇄" },
  { title: "Revive the fallen", text: "Hit zero and you're out — until your team brings you back.", icon: "✚" },
  { title: "Combat tagging", text: "No combat logging. Leave mid-fight and it counts as a death.", icon: "⚔" },
  { title: "Real economy", text: "Earn, shop and auction gear. Track the richest players live.", icon: "◆" },
  { title: "Seasonal resets", text: "Fresh worlds, fair starts and leaderboards that crown a season champion.", icon: "↻" },
];

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

export default async function HomePage() {
  const cfg = getConfig();
  const [status, about, announcements] = await Promise.all([getServerStatus(), getBlock("home.about"), getAnnouncements()]);
  const address = cfg.server.address?.display ?? null;

  return (
    <>
      <section className="relative isolate overflow-hidden border-b border-white/5">
        <div className="block-grid absolute inset-0 -z-10 [mask-image:radial-gradient(ellipse_at_center,black_30%,transparent_75%)]" />
        <ParticleCanvas />
        <div className="relative mx-auto flex max-w-7xl flex-col items-center px-4 pb-20 pt-16 text-center sm:px-6 sm:pt-24 lg:pb-28">
          <div className="animate-rise"><Logo size="lg" /></div>
          <div className="mt-6 animate-rise [animation-delay:80ms]">
            <StatusPanel initial={status} variant="compact" />
          </div>
          <h1 className="h-display mt-8 max-w-4xl animate-rise text-4xl leading-[1.05] text-white [animation-delay:140ms] sm:text-6xl lg:text-7xl">
            Your heart.<br />
            <span className="bg-gradient-to-r from-blood-400 via-blood-500 to-blood-700 bg-clip-text text-transparent text-glow">Your survival.</span>
          </h1>
          <p className="mt-6 max-w-2xl animate-rise text-lg text-bone-300 [animation-delay:200ms]">
            A hardcore Lifesteal SMP for Minecraft: Java Edition. Kill a player, take their heart.
            Lose them all and you&apos;re out. Every fight matters.
          </p>
          <div className="mt-8 animate-rise [animation-delay:260ms]">
            <CopyAddress address={address} size="lg" />
          </div>
          <div className="mt-8 flex w-full max-w-xl animate-rise flex-col gap-3 [animation-delay:320ms] sm:flex-row sm:justify-center">
            <Link href="/server#join" className="btn-red animate-pulse-red">▶ Play now</Link>
            <Link href="/leaderboards" className="btn-ghost">Leaderboards</Link>
            <Link href="/store" className="btn-ghost">Store</Link>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6">
        <div className="grid gap-10 lg:grid-cols-[1.1fr_1fr] lg:items-center">
          <div>
            <SectionHeading eyebrow="The game" title={about.title} />
            <Content body={about.body} />
          </div>
          <div className="space-y-4">
            <StatusPanel initial={status} />
            <div className="panel flex items-center gap-4 p-5">
              <div className="flex gap-1" aria-hidden>
                {Array.from({ length: 10 }, (_, i) => <PixelHeart key={i} className={`h-4 w-5 ${i > 6 ? "opacity-25 grayscale" : ""}`} />)}
              </div>
              <p className="text-sm text-bone-300">Start with 10. Steal more. Never hit zero.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="border-y border-white/5 bg-ink-900/60">
        <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6">
          <SectionHeading eyebrow="Gameplay" title="Built for Lifesteal">
            Everything on RuleXMC is tuned around one rule: hearts are the only currency that really counts.
          </SectionHeading>
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((f) => (
              <li key={f.title} className="panel group p-6 transition duration-300 hover:-translate-y-1 hover:border-blood-500/40">
                <div className="flex h-11 w-11 items-center justify-center rounded-md border border-blood-500/40 bg-blood-500/10 font-hud text-xl text-blood-400 shadow-[0_0_18px_-4px_rgba(239,28,43,0.6)]" aria-hidden>
                  {f.icon}
                </div>
                <h3 className="mt-4 font-hud text-xl font-bold uppercase tracking-wider text-white">{f.title}</h3>
                <p className="mt-2 text-bone-300">{f.text}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6">
        <SectionHeading eyebrow="News" title="Latest announcements" />
        {announcements === null ? (
          <p className="panel p-6 text-bone-400">Announcements are unavailable right now.</p>
        ) : announcements.length === 0 ? (
          <p className="panel p-6 text-bone-400">No announcements yet. Check back soon.</p>
        ) : (
          <div className="grid gap-4 md:grid-cols-3">
            {announcements.map((a) => (
              <article key={a.id} className={`p-6 ${a.pinned ? "panel-glow" : "panel"}`}>
                <div className="flex items-center gap-2 text-xs text-bone-400">
                  {a.pinned ? <span className="badge bg-blood-500/20 text-blood-300">Pinned</span> : null}
                  <time dateTime={a.createdAt.toISOString()}>
                    {a.createdAt.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })}
                  </time>
                </div>
                <h3 className="mt-3 font-hud text-xl font-bold text-white">{a.title}</h3>
                <p className="mt-2 line-clamp-5 whitespace-pre-line text-bone-300">{a.body}</p>
              </article>
            ))}
          </div>
        )}
      </section>
    </>
  );
}
