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
  ["/portal", "Player portal"], ["/register", "Create an account"], ["/portal/reports", "Report a player"], ["/server#faq", "FAQ"], ["/server#rules", "Rules"],
];

function FooterLink({ href, children, external = false }: { href: string; children: React.ReactNode; external?: boolean }) {
  const cls = "group inline-flex items-center gap-1.5 rounded text-bone-300 transition-colors hover:text-white";
  return external ? (
    <a className={cls} href={href} target="_blank" rel="noopener noreferrer">
      {children}
      <Icon name="external" className="h-3 w-3 opacity-50 transition-transform motion-safe:group-hover:-translate-y-px motion-safe:group-hover:translate-x-px" />
      <span className="sr-only"> (opens in a new tab)</span>
    </a>
  ) : <Link className={cls} href={href}>{children}</Link>;
}

function Column({ title, label, children, className = "" }: { title: string; label: string; children: React.ReactNode; className?: string }) {
  return (
    <nav aria-label={label} className={className}>
      <h2 className="table-head mb-4">{title}</h2>
      <ul className="space-y-2.5 text-sm">{children}</ul>
    </nav>
  );
}

export function Footer() {
  const cfg = getConfig();
  const address = cfg.server.address;
  const community = [
    { label: "Discord", href: cfg.community.discord },
    { label: "YouTube", href: cfg.community.youtube },
    { label: "TikTok", href: cfg.community.tiktok },
    { label: "X", href: cfg.community.x },
  ].filter((c): c is { label: string; href: string } => !!c.href);
  const votes: { name: string; href: string }[] = [
    ...(cfg.community.vote && !VOTE_SITES.some((s) => s.href === cfg.community.vote) ? [{ name: "Vote", href: cfg.community.vote }] : []),
    ...VOTE_SITES,
  ];
  const facts = [
    { icon: "devices" as const, text: SERVER_FACTS.editions },
    { icon: "server" as const, text: SERVER_FACTS.versions },
    { icon: "globe" as const, text: SERVER_FACTS.region },
  ];

  return (
    <footer className="relative mt-16 border-t border-white/[0.06] bg-ink-950">
      <BlockStrip />
      <div className="container-x grid grid-cols-2 gap-x-6 gap-y-10 py-14 md:grid-cols-3 lg:grid-cols-[1.5fr_1fr_1fr_1fr]">
        <div className="col-span-2 md:col-span-3 lg:col-span-1">
          <Link href="/" className="inline-block rounded-md" aria-label={`${cfg.siteName} home`}><Logo size="sm" /></Link>
          <p className="mt-4 max-w-sm text-sm leading-relaxed text-bone-400">
            {SITE.network}: Lifesteal, Survival and PvP Practice. Run by {SITE.owner}.
          </p>
          <div className="mt-5">
            <CopyAddress address={address?.display ?? null} note={address ? `Bedrock: ${address.host} · port ${SERVER_FACTS.bedrockPort}` : undefined} />
          </div>
          <ul className="mt-5 flex flex-wrap gap-2" aria-label="Server facts">
            {facts.map((f) => (
              <li key={f.text} className="chip normal-case tracking-[0.08em]"><Icon name={f.icon} className="h-3.5 w-3.5 text-blood-300" />{f.text}</li>
            ))}
          </ul>
        </div>
        <Column title="Explore" label="Footer: explore">
          {EXPLORE.map(([href, label]) => <li key={href}><FooterLink href={href}>{label}</FooterLink></li>)}
        </Column>
        <Column title="Players" label="Footer: players">
          {PLAYERS.map(([href, label]) => <li key={href}><FooterLink href={href}>{label}</FooterLink></li>)}
        </Column>
        <div className="col-span-2 md:col-span-1">
          <Column title="Community" label="Footer: community">
            {community.map((c) => <li key={c.label}><FooterLink href={c.href} external>{c.label}</FooterLink></li>)}
          </Column>
          <Column title="Vote for us" label="Footer: vote" className="mt-8">
            {votes.map((v) => <li key={v.href}><FooterLink href={v.href} external>{v.name}</FooterLink></li>)}
          </Column>
        </div>
      </div>
      <div className="border-t border-white/[0.06]">
        <div className="container-x flex flex-col gap-3 py-6 text-xs text-bone-400 md:flex-row md:items-center md:justify-between">
          <p>© {new Date().getFullYear()} {cfg.siteName}. All rights reserved.</p>
          <p>Not an official Minecraft product. Not approved by or associated with Mojang or Microsoft.</p>
          <a href="#top" className="group inline-flex items-center gap-1.5 self-start rounded font-hud font-semibold uppercase tracking-[0.16em] text-bone-300 transition-colors hover:text-white md:self-auto">
            Back to top <Icon name="chevron-down" className="h-3.5 w-3.5 rotate-180 transition-transform motion-safe:group-hover:-translate-y-0.5" />
          </a>
        </div>
      </div>
    </footer>
  );
}
