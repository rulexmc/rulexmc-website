import { getConfig } from "@/lib/config";
import { VOTE_SITES } from "@/lib/site";
import { SectionHeading } from "./SectionHeading";
import { Icon } from "./Icon";

/** Links to RuleX MC's public server-list pages. VOTE_URL (env) adds an extra link at the top. */
export function VoteSection() {
  const extra = getConfig().community.vote;
  const sites: { name: string; href: string }[] = [
    ...(extra && !VOTE_SITES.some((s) => s.href === extra) ? [{ name: "Vote", href: extra }] : []),
    ...VOTE_SITES,
  ];
  return (
    <section aria-labelledby="vote" className="container-x py-16 sm:py-20">
      <div className="grid gap-10 lg:grid-cols-[1fr_1.2fr] lg:items-center">
        <SectionHeading eyebrow="Support us for free" title="Vote for RuleX MC" id="vote">
          Every vote pushes RuleX MC up the server lists so more players can find us. It takes less than a minute.
        </SectionHeading>
        <ul className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
          {sites.map((s, i) => (
            <li key={s.href}>
              <a
                href={s.href}
                target="_blank"
                rel="noopener noreferrer"
                className="card group flex items-center gap-4 p-4"
              >
                <span className="icon-tile h-11 w-11 font-display text-sm font-black">{String(i + 1).padStart(2, "0")}</span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-hud text-lg font-bold text-white">{s.name}</span>
                  <span className="text-xs uppercase tracking-[0.16em] text-bone-400">Vote &amp; review</span>
                </span>
                <Icon name="external" className="h-4 w-4 text-bone-400 transition group-hover:text-blood-300" />
                <span className="sr-only"> (opens in a new tab)</span>
              </a>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
