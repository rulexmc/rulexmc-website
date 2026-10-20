import Link from "next/link";
import { getConfig } from "@/lib/config";
import { Logo } from "./Logo";
import { BlockStrip } from "./BlockStrip";

export function Footer() {
  const cfg = getConfig();
  const community = [
    { label: "Discord", href: cfg.community.discord },
    { label: "YouTube", href: cfg.community.youtube },
    { label: "TikTok", href: cfg.community.tiktok },
    { label: "X", href: cfg.community.x },
    { label: "Vote", href: cfg.community.vote },
  ].filter((c): c is { label: string; href: string } => !!c.href);

  return (
    <footer className="mt-24 border-t border-white/5 bg-ink-950">
      <BlockStrip />
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-12 sm:px-6 md:grid-cols-4">
        <div className="md:col-span-2">
          <Logo size="sm" />
          <p className="mt-4 max-w-sm text-sm text-bone-400">
            {cfg.siteName} is a community Lifesteal SMP for Minecraft: Java Edition. Not an official Minecraft product.
            Not approved by or associated with Mojang or Microsoft.
          </p>
        </div>
        <nav aria-label="Footer">
          <h2 className="table-head mb-3">Explore</h2>
          <ul className="space-y-2 text-sm">
            {[
              ["/", "Home"], ["/server", "Server info"], ["/leaderboards", "Leaderboards"], ["/store", "Store"],
              ["/portal", "Player portal"], ["/portal/reports", "Report a player"],
            ].map(([href, label]) => (
              <li key={href}><Link className="text-bone-300 hover:text-white" href={href!}>{label}</Link></li>
            ))}
          </ul>
        </nav>
        {community.length > 0 ? (
          <div>
            <h2 className="table-head mb-3">Community</h2>
            <ul className="space-y-2 text-sm">
              {community.map((c) => (
                <li key={c.label}>
                  <a className="text-bone-300 hover:text-white" href={c.href} target="_blank" rel="noopener noreferrer">{c.label} ↗</a>
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </div>
      <div className="border-t border-white/5 py-5 text-center text-xs text-bone-400">
        © {new Date().getFullYear()} {cfg.siteName}. All rights reserved.
      </div>
    </footer>
  );
}
