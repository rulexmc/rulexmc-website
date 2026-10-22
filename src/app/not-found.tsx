import type { Metadata } from "next";
import Link from "next/link";
import { PixelHeart } from "@/components/Logo";
import { Icon } from "@/components/Icon";

export const metadata: Metadata = { title: "Page not found", robots: { index: false, follow: true } };

const DESTINATIONS = [
  { href: "/server#join", icon: "play" as const, title: "How to join", text: "IP, versions and step-by-step setup." },
  { href: "/leaderboards", icon: "trophy" as const, title: "Leaderboards", text: "Top players by kills, hearts and more." },
  { href: "/store", icon: "star" as const, title: "Store", text: "Preview ranks, kits and perks." },
];

export default function NotFound() {
  return (
    <div className="relative isolate overflow-hidden">
      <div aria-hidden className="block-grid absolute inset-0 -z-10 [mask-image:radial-gradient(ellipse_at_center,black_20%,transparent_70%)]" />
      <div aria-hidden className="absolute left-1/2 top-1/3 -z-10 h-72 w-[40rem] max-w-[120vw] -translate-x-1/2 rounded-full bg-blood-700/25 blur-3xl" />
      <div className="container-x flex min-h-[72vh] flex-col items-center justify-center py-20 text-center">
        <PixelHeart className="enter h-14 w-16 opacity-50 grayscale" />
        <p className="enter mt-8 font-display text-7xl font-black text-white/10 sm:text-9xl" aria-hidden>404</p>
        <p className="eyebrow enter enter-1 -mt-2">Error 404</p>
        <h1 className="h-display enter enter-1 mt-3 text-3xl text-white sm:text-5xl">You fell into the void</h1>
        <p className="lead enter enter-2 mt-4 max-w-md">This page doesn&apos;t exist. It may have moved, or it lost its last heart.</p>

        <form action="/leaderboards" method="get" role="search" aria-label="Find a player" className="enter enter-3 mt-9 flex w-full max-w-md gap-2">
          <label htmlFor="nf-q" className="sr-only">Looking for a player? Search by name</label>
          <div className="relative min-w-0 flex-1">
            <Icon name="search" className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-bone-400" />
            <input id="nf-q" name="q" type="search" placeholder="Looking for a player?" maxLength={16} pattern="[A-Za-z0-9_]*" autoComplete="off" spellCheck={false} className="field pl-9" />
          </div>
          <button type="submit" className="btn-ghost btn-sm">Search</button>
        </form>

        <ul className="enter enter-4 mt-10 grid w-full max-w-3xl gap-3 text-left sm:grid-cols-3">
          {DESTINATIONS.map((d) => (
            <li key={d.href}>
              <Link href={d.href} className="card group flex h-full flex-col p-5">
                <Icon name={d.icon} className="h-5 w-5 text-blood-400" />
                <span className="mt-3 font-hud text-lg font-bold text-white">{d.title}</span>
                <span className="mt-1 text-sm text-bone-400">{d.text}</span>
              </Link>
            </li>
          ))}
        </ul>
        <Link href="/" className="btn-red enter enter-5 mt-10"><Icon name="heart" className="h-4 w-4" /> Respawn at home</Link>
      </div>
    </div>
  );
}
