import { getConfig } from "@/lib/config";
import { getDiscordInvite } from "@/lib/discord";
import { Icon } from "./Icon";
import { CountUp } from "./CountUp";

/** Discord call-to-action. Member counts are real (Discord's public invite API) and hidden when unavailable. */
export async function DiscordCTA() {
  const href = getConfig().community.discord;
  if (!href) return null;
  const info = await getDiscordInvite(href);

  return (
    <section aria-labelledby="discord-cta" className="container-x py-16 sm:py-20">
      <div className="reveal relative isolate overflow-hidden rounded-3xl border border-[#5865F2]/30 bg-gradient-to-br from-[#5865F2]/[0.16] via-ink-900 to-blood-900/40 p-8 sm:p-12">
        <div aria-hidden className="absolute -right-24 -top-24 -z-10 h-72 w-72 rounded-full bg-[#5865F2]/25 blur-3xl" />
        <div aria-hidden className="absolute -bottom-28 -left-16 -z-10 h-72 w-72 rounded-full bg-blood-600/25 blur-3xl" />
        <div className="flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-2xl">
            <div className="flex items-center gap-3">
              <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#5865F2] text-white shadow-[0_10px_30px_-8px_rgba(88,101,242,0.8)]">
                <Icon name="discord" className="h-7 w-7" />
              </span>
              <p className="font-hud text-sm font-semibold uppercase tracking-[0.3em] text-[#c9cdfb]">Community</p>
            </div>
            <h2 id="discord-cta" className="h-display mt-5 text-2xl leading-tight text-white sm:text-4xl">Join the RuleX MC Discord</h2>
            <p className="mt-4 text-bone-300 sm:text-lg">
              Get server news and updates first, find teammates, ask for help and talk with the community.
            </p>
            {info && (info.members !== null || info.online !== null) ? (
              <ul className="mt-5 flex flex-wrap gap-3" aria-label="Discord community size">
                {info.members !== null ? (
                  <li className="chip"><Icon name="users" className="h-4 w-4 text-[#c9cdfb]" /> <CountUp value={info.members} /> members</li>
                ) : null}
                {info.online !== null ? (
                  <li className="chip"><span className="h-2 w-2 rounded-full bg-emerald-400" aria-hidden /> <CountUp value={info.online} /> online now</li>
                ) : null}
              </ul>
            ) : null}
          </div>
          <a href={href} target="_blank" rel="noopener noreferrer" className="btn-discord shrink-0 px-7 py-4 text-lg">
            <Icon name="discord" className="h-6 w-6" /> Join Discord
            <span className="sr-only"> (opens in a new tab)</span>
          </a>
        </div>
      </div>
    </section>
  );
}
