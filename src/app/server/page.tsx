import type { Metadata } from "next";
import Link from "next/link";
import { CopyAddress } from "@/components/CopyAddress";
import { StatusPanel } from "@/components/StatusPanel";
import { SectionHeading } from "@/components/SectionHeading";
import { Content } from "@/components/Content";
import { PageHero } from "@/components/PageHero";
import { JoinGuide } from "@/components/JoinGuide";
import { RealmCards } from "@/components/RealmCards";
import { FeatureGrid } from "@/components/FeatureGrid";
import { FaqJsonLd, FaqList } from "@/components/FaqList";
import { Icon } from "@/components/Icon";
import { getConfig } from "@/lib/config";
import { getServerStatus } from "@/lib/status";
import { getBlock, getStoredBlock } from "@/lib/content";
import { FAQ, SERVER_FACTS, SITE } from "@/lib/site";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: "Server Info, IP & How to Join",
  description:
    "Join RuleX MC at rulexmc.mcsh.io (Bedrock port 19132). Java + Bedrock crossplay, versions 1.9 – 26.2+, cracked and premium. Lifesteal, Survival and PvP Practice.",
  path: "/server",
});
export const dynamic = "force-dynamic";

export default async function ServerPage() {
  const cfg = getConfig();
  const [status, lifesteal, rules, extraFaq, extraJoin] = await Promise.all([
    getServerStatus(), getBlock("server.lifesteal"), getBlock("server.rules"), getStoredBlock("server.faq"), getStoredBlock("server.join"),
  ]);
  const address = cfg.server.address?.display ?? null;
  const discord = cfg.community.discord;

  const facts: [string, string][] = [
    ["Java IP", address ?? "Not configured"],
    ["Bedrock IP", address ? `${cfg.server.address!.host} · port ${SERVER_FACTS.bedrockPort}` : "Not configured"],
    ["Editions", SERVER_FACTS.editions],
    ["Versions", cfg.server.versionLabel ?? SERVER_FACTS.versions],
    ["Software", SERVER_FACTS.software],
    ["Accounts", SERVER_FACTS.accounts],
    ["Region", SERVER_FACTS.region],
    ["Owner", SITE.owner],
  ];
  const liveMotd = status.state === "online" && status.motd.length > 0;

  return (
    <>
      <FaqJsonLd items={FAQ} />
      <PageHero
        eyebrow="Server info"
        title={<>Join the <span className="text-gradient-red">RuleX Network</span></>}
        actions={
          <>
            <Link href="#join" className="btn-red"><Icon name="play" className="h-4 w-4 fill-current" /> How to join</Link>
            {discord ? (
              <a href={discord} target="_blank" rel="noopener noreferrer" className="btn-ghost">
                <Icon name="discord" className="h-5 w-5" /> Discord<span className="sr-only"> (opens in a new tab)</span>
              </a>
            ) : null}
          </>
        }
      >
        Everything you need to connect: the IP, supported versions, the realms and answers to common questions.
      </PageHero>

      <div className="container-x py-14 sm:py-16">
        <div className="grid gap-6 lg:grid-cols-5">
          <section aria-labelledby="facts" className="panel-glow p-6 sm:p-7 lg:col-span-2">
            <h2 id="facts" className="table-head">Connection &amp; compatibility</h2>
            <dl className="mt-5 divide-y divide-white/[0.06]">
              {facts.map(([k, v]) => (
                <div key={k} className="flex items-baseline justify-between gap-4 py-2.5">
                  <dt className="shrink-0 text-sm text-bone-400">{k}</dt>
                  <dd className="min-w-0 break-words text-right font-hud text-base font-bold text-white">{v}</dd>
                </div>
              ))}
            </dl>
            <div className="mt-6"><CopyAddress address={address} /></div>
          </section>
          <div className="space-y-4 lg:col-span-3">
            <StatusPanel initial={status} />
            <section aria-labelledby="motd" className="panel overflow-hidden">
              <div className="flex items-center justify-between gap-3 border-b border-white/[0.06] px-5 py-3">
                <h2 id="motd" className="table-head">Message of the day</h2>
                <span className="text-xs text-bone-400">{liveMotd ? "Live from the server" : "Official MOTD"}</span>
              </div>
              <div className="scanlines relative bg-[#0b0b0b] px-5 py-4 font-hud text-lg leading-snug">
                {liveMotd
                  ? status.motd.map((l, i) => <p key={i} className={i === 0 ? "text-white" : "text-bone-300"}>{l}</p>)
                  : <p className="text-bone-200">{SITE.motd}</p>}
              </div>
            </section>
            <div className="panel flex items-start gap-4 p-5">
              <span className="icon-tile h-10 w-10"><Icon name="lock" className="h-5 w-5" /></span>
              <div className="text-sm leading-relaxed text-bone-300">
                <p className="font-hud text-base font-bold uppercase tracking-wider text-white">Cracked &amp; premium welcome</p>
                <p className="mt-1">
                  RuleX MC uses AuthMe. On your first join you register a password in chat, and you log in with it on later visits.
                  Pick a strong password and never share it.
                </p>
              </div>
            </div>
          </div>
        </div>

        <section id="join" className="mt-20 scroll-mt-24" aria-labelledby="join-title">
          <SectionHeading eyebrow="Get started" title="How to join" id="join-title">
            Same address on both editions. Java uses the default port; Bedrock uses port {SERVER_FACTS.bedrockPort}.
          </SectionHeading>
          <JoinGuide address={address} host={cfg.server.address?.host ?? null} />
          {extraJoin ? (
            <div className="panel mt-5 p-6">
              <h3 className="font-hud text-lg font-bold uppercase tracking-wider text-white">{extraJoin.title}</h3>
              <div className="mt-3"><Content body={extraJoin.body} /></div>
            </div>
          ) : null}
        </section>

        <section className="mt-20" aria-labelledby="realms">
          <SectionHeading eyebrow="Realms" title="Pick your battleground" id="realms">
            Spawn in the hub, then take a portal to any realm.
          </SectionHeading>
          <RealmCards detailed />
        </section>

        <section className="mt-20 grid gap-6 lg:grid-cols-2">
          <div className="panel p-6 sm:p-8" id="lifesteal">
            <p className="eyebrow">Mechanics</p>
            <h2 className="h-display mt-3 text-2xl text-white sm:text-3xl">{lifesteal.title}</h2>
            <div className="mt-5"><Content body={lifesteal.body} /></div>
          </div>
          <div className="panel p-6 sm:p-8 scroll-mt-24" id="rules">
            <p className="eyebrow">Fair play</p>
            <h2 className="h-display mt-3 text-2xl text-white sm:text-3xl">{rules.title}</h2>
            <div className="mt-5"><Content body={rules.body} /></div>
            {discord ? (
              <a href={discord} target="_blank" rel="noopener noreferrer" className="btn-ghost btn-sm mt-6">
                <Icon name="discord" className="h-4 w-4" /> Ask about the rules on Discord<span className="sr-only"> (opens in a new tab)</span>
              </a>
            ) : null}
          </div>
        </section>

        <section className="mt-20" aria-labelledby="features">
          <SectionHeading eyebrow="Network" title="What makes RuleX different" id="features" />
          <FeatureGrid />
        </section>

        <section id="faq" className="mt-20 scroll-mt-24" aria-labelledby="faq-title">
          <SectionHeading eyebrow="Questions" title="Frequently asked questions" id="faq-title" />
          <div className="grid gap-8 lg:grid-cols-[1fr_0.45fr]">
            <div className="space-y-3">
              <FaqList items={FAQ} />
              {extraFaq ? <div className="space-y-3 pt-2"><Content body={extraFaq.body} faq /></div> : null}
            </div>
            <aside className="panel h-fit p-6 lg:sticky lg:top-24" aria-label="Still need help">
              <span className="icon-tile"><Icon name="discord" className="h-6 w-6" /></span>
              <h3 className="mt-4 font-hud text-xl font-bold uppercase tracking-wider text-white">Still stuck?</h3>
              <p className="mt-2 text-sm leading-relaxed text-bone-300">Ask the community and the team on Discord. To report a player, use the player portal.</p>
              <div className="mt-5 flex flex-col gap-2">
                {discord ? <a href={discord} target="_blank" rel="noopener noreferrer" className="btn-discord btn-sm">Join Discord<span className="sr-only"> (opens in a new tab)</span></a> : null}
                <Link href="/portal/reports" className="btn-ghost btn-sm">Report a player</Link>
              </div>
            </aside>
          </div>
        </section>
      </div>
    </>
  );
}
