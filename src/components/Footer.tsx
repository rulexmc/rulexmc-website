import Link from "next/link";
import { getConfig } from "@/lib/config";
import { SERVER_FACTS, SITE, VOTE_SITES } from "@/lib/site";
import { Logo } from "./Logo";
import { BlockStrip } from "./BlockStrip";
import { CopyAddress } from "./CopyAddress";
import { Icon } from "./Icon";

const EXPLORE: [string, string][] = [
  ["/", "Home"], ["/server", "Server info"], ["/server#join", "How to join"], ["/leaderboards", "Leaderboards"], ["/store", "Store"],
];
const PLAYERS: [string, string][] = [
  ["/portal", "Player portal"], ["/portal/reports", "Report a player"], ["/server#faq", "FAQ"], ["/server#rules", "Rules"],
];

function FooterLink({ href, children, external = false }: { href: string; children: React.ReactNode; external?: boolean }) {
  const cls = "inline-flex items-center gap-1.5 text-bone-300 transition hover:text-white";
  return external ? (
    <a className={cls} href={href} target="_blank" rel="noopener noreferrer">
      {children}<Icon name="external" className="h-3 w-3 opacity-50" /><span className="sr-only"> (opens in a new tab)</span>
    </a>
  ) : <Link className={cls} href={href}>{children}</Link>;
}

export function Footer() {
  const cfg = getConfig();
  const community = [
    { label: "Discord", href: cfg.community.discord },
    { label: "YouTube", href: cfg.community.youtube },
    { label: "TikTok", href: cfg.community.tiktok },
    { label: "X", href: cfg.community.x },
  ].filter((c): c is { label: string; href: string } => !!c.href);
  const vote = cfg.community.vote ?? VOTE_SITES[0].href;

  return (
    <footer className="relative mt-16 border-t border-white/[0.06] bg-ink-950">
      <BlockStrip />
      <div className="container-x grid grid-cols-2 gap-x-6 gap-y-10 py-14 md:grid-cols-3 lg:grid-cols-[1.4fr_1fr_1fr_1fr]">
        <div className="col-span-2 md:col-span-3 lg:col-span-1">
          <Link href="/" className="inline-block rounded-md"><Logo size="sm" /></Link>
          <p className="mt-4 max-w-sm text-sm leading-relaxed text-bone-400">
            {SITE.network}: Lifesteal, Survival and PvP Practice. Java + Bedrock crossplay, {SERVER_FACTS.versions}. Run by {SITE.owner}.
          </p>
          <div className="mt-5"><CopyAddress address={cfg.server.address?.display ?? null} /></div>
        </div>
        <nav aria-label="Footer: explore">
          <h2 className="table-head mb-4">Explore</h2>
          <ul className="space-y-2.5 text-sm">
            {EXPLORE.map(([href, label]) => <li key={href}><FooterLink href={href}>{label}</FooterLink></li>)}
          </ul>
        </nav>
        <nav aria-label="Footer: players">
          <h2 className="table-head mb-4">Players</h2>
          <ul className="space-y-2.5 text-sm">
            {PLAYERS.map(([href, label]) => <li key={href}><FooterLink href={href}>{label}</FooterLink></li>)}
          </ul>
        </nav>
        <nav aria-label="Footer: community" className="col-span-2 md:col-span-1">
          <h2 className="table-head mb-4">Community</h2>
          <ul className="space-y-2.5 text-sm">
            {community.map((c) => <li key={c.label}><FooterLink href={c.href} external>{c.label}</FooterLink></li>)}
            <li><FooterLink href={vote} external>Vote for us</FooterLink></li>
          </ul>
          {cfg.community.discord ? (
            <a href={cfg.community.discord} target="_blank" rel="noopener noreferrer" className="btn-discord btn-sm mt-5">
              <Icon name="discord" className="h-4 w-4" /> Join Discord<span className="sr-only"> (opens in a new tab)</span>
            </a>
          ) : null}
        </nav>
      </div>
      <div className="border-t border-white/[0.06]">
        <div className="container-x flex flex-col gap-2 py-6 text-xs text-bone-400 sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} {cfg.siteName}. All rights reserved.</p>
          <p>Not an official Minecraft product. Not approved by or associated with Mojang or Microsoft.</p>
        </div>
      </div>
    </footer>
  );
}
