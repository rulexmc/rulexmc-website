import type { Metadata } from "next";
import { CopyAddress } from "@/components/CopyAddress";
import { StatusPanel } from "@/components/StatusPanel";
import { SectionHeading } from "@/components/SectionHeading";
import { Content } from "@/components/Content";
import { getConfig } from "@/lib/config";
import { getServerStatus } from "@/lib/status";
import { getBlock } from "@/lib/content";

export const metadata: Metadata = { title: "Server", description: "How to join RuleXMC, rules, Lifesteal mechanics and FAQ." };
export const dynamic = "force-dynamic";

export default async function ServerPage() {
  const cfg = getConfig();
  const [status, lifesteal, rules, faq, join] = await Promise.all([
    getServerStatus(), getBlock("server.lifesteal"), getBlock("server.rules"), getBlock("server.faq"), getBlock("server.join"),
  ]);
  const address = cfg.server.address?.display ?? null;
  const version = cfg.server.versionLabel ?? status.version;

  return (
    <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6">
      <header className="mb-12">
        <p className="eyebrow">Server</p>
        <h1 className="h-display mt-2 text-3xl text-white sm:text-5xl">Join the fight</h1>
      </header>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="panel-glow p-6 lg:col-span-1">
          <h2 className="table-head">Compatibility</h2>
          <dl className="mt-4 space-y-3">
            <div className="flex justify-between gap-4"><dt className="text-bone-400">Edition</dt><dd className="font-hud font-bold text-white">{cfg.server.edition}</dd></div>
            <div className="flex justify-between gap-4"><dt className="text-bone-400">Version</dt><dd className="text-right font-hud font-bold text-white">{version ?? "Unknown (status unavailable)"}</dd></div>
            {status.software ? <div className="flex justify-between gap-4"><dt className="text-bone-400">Software</dt><dd className="font-hud font-bold text-white">{status.software}</dd></div> : null}
          </dl>
          <div className="mt-6"><CopyAddress address={address} /></div>
        </div>
        <div className="lg:col-span-2 space-y-4">
          <StatusPanel initial={status} />
          {status.motd.length > 0 ? (
            <div className="panel p-5">
              <h2 className="table-head mb-2">Message of the day</h2>
              {status.motd.map((l, i) => <p key={i} className="font-hud text-lg text-bone-200">{l}</p>)}
            </div>
          ) : null}
        </div>
      </div>

      <section id="join" className="mt-16 scroll-mt-24">
        <SectionHeading eyebrow="Get started" title={join.title} />
        <div className="grid gap-6 md:grid-cols-2">
          <div className="panel p-6"><Content body={join.body} /></div>
          <div className="panel p-6">
            <h3 className="font-hud text-lg font-bold uppercase tracking-wider text-white">Server address</h3>
            <p className="mt-2 mb-4 text-sm text-bone-400">Copy this into Multiplayer → Add Server.</p>
            <CopyAddress address={address} />
          </div>
        </div>
      </section>

      <section className="mt-16 grid gap-10 lg:grid-cols-2">
        <div><SectionHeading eyebrow="Mechanics" title={lifesteal.title} /><Content body={lifesteal.body} /></div>
        <div id="rules" className="scroll-mt-24"><SectionHeading eyebrow="Fair play" title={rules.title} /><Content body={rules.body} /></div>
      </section>

      <section id="faq" className="mt-16 scroll-mt-24">
        <SectionHeading eyebrow="Questions" title={faq.title} />
        <div className="space-y-3"><Content body={faq.body} faq /></div>
      </section>
    </div>
  );
}
