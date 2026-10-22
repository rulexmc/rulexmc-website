import { SERVER_FACTS } from "@/lib/site";
import { CopyAddress } from "./CopyAddress";
import { Icon } from "./Icon";

function Steps({ steps }: { steps: React.ReactNode[] }) {
  return (
    <ol className="mt-5 space-y-4">
      {steps.map((s, i) => (
        <li key={i} className="flex gap-4">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-blood-500/40 bg-blood-500/10 font-display text-sm font-black text-blood-300">
            {i + 1}
          </span>
          <span className="pt-1 leading-relaxed text-bone-200">{s}</span>
        </li>
      ))}
    </ol>
  );
}

/** Step-by-step join instructions for both editions. */
export function JoinGuide({ address, host }: { address: string | null; host: string | null }) {
  const ip = address ?? SERVER_FACTS.javaAddress;
  const bedrockHost = host ?? SERVER_FACTS.bedrockAddress;
  return (
    <div className="grid gap-5 lg:grid-cols-2">
      <article className="panel edge-top reveal p-6 sm:p-8" aria-labelledby="join-java">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h3 id="join-java" className="flex items-center gap-3 font-hud text-2xl font-bold uppercase tracking-wider text-white">
            <span className="icon-tile h-10 w-10"><Icon name="server" className="h-5 w-5" /></span> Java Edition
          </h3>
          <span className="chip">{SERVER_FACTS.versions}</span>
        </div>
        <Steps
          steps={[
            <>Launch Minecraft: Java Edition on any version from <strong className="text-white">1.9 to 26.2+</strong>.</>,
            <>Open <strong className="text-white">Multiplayer</strong> and click <strong className="text-white">Add Server</strong>.</>,
            <>Paste <code className="kbd">{ip}</code> into Server Address and click <strong className="text-white">Done</strong>.</>,
            <>Join, then follow the AuthMe prompt in chat to register (first visit) or log in.</>,
          ]}
        />
        <div className="mt-7"><CopyAddress address={address} label="Java IP" /></div>
      </article>
      <article className="panel edge-top reveal p-6 sm:p-8 [--i:1]" aria-labelledby="join-bedrock">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h3 id="join-bedrock" className="flex items-center gap-3 font-hud text-2xl font-bold uppercase tracking-wider text-white">
            <span className="icon-tile h-10 w-10"><Icon name="devices" className="h-5 w-5" /></span> Bedrock Edition
          </h3>
          <span className="chip">Port {SERVER_FACTS.bedrockPort}</span>
        </div>
        <Steps
          steps={[
            <>Open Minecraft (Bedrock) on your phone, tablet or Windows PC and tap <strong className="text-white">Play</strong>.</>,
            <>Go to the <strong className="text-white">Servers</strong> tab and choose <strong className="text-white">Add Server</strong>.</>,
            <>Server address <code className="kbd">{bedrockHost}</code>, port <code className="kbd">{SERVER_FACTS.bedrockPort}</code>.</>,
            <>Save, join, and follow the AuthMe prompt in chat to register or log in.</>,
          ]}
        />
        <div className="mt-7 flex flex-wrap items-center gap-4">
          <CopyAddress address={host ? bedrockHost : null} label="Bedrock IP" />
          <div className="panel px-4 py-2.5">
            <span className="block font-hud text-[0.68rem] font-semibold uppercase tracking-[0.28em] text-bone-400">Port</span>
            <span className="font-hud text-lg font-bold tracking-wider text-white sm:text-xl">{SERVER_FACTS.bedrockPort}</span>
          </div>
        </div>
      </article>
    </div>
  );
}
