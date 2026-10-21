import type { Metadata } from "next";
import Link from "next/link";
import { PixelHeart } from "@/components/Logo";
import { Icon } from "@/components/Icon";

export const metadata: Metadata = { title: "Page not found", robots: { index: false, follow: true } };

export default function NotFound() {
  return (
    <div className="relative isolate overflow-hidden">
      <div aria-hidden className="block-grid absolute inset-0 -z-10 [mask-image:radial-gradient(ellipse_at_center,black_20%,transparent_70%)]" />
      <div aria-hidden className="absolute left-1/2 top-1/3 -z-10 h-72 w-[40rem] max-w-[120vw] -translate-x-1/2 rounded-full bg-blood-700/25 blur-3xl" />
      <div className="container-x flex min-h-[72vh] flex-col items-center justify-center py-20 text-center">
        <PixelHeart className="h-14 w-16 opacity-50 grayscale" />
        <p className="mt-8 font-display text-7xl font-black text-white/10 sm:text-9xl" aria-hidden>404</p>
        <p className="eyebrow -mt-2">Error 404</p>
        <h1 className="h-display mt-3 text-3xl text-white sm:text-5xl">You fell into the void</h1>
        <p className="lead mt-4 max-w-md">This page doesn&apos;t exist. It may have moved, or it lost its last heart.</p>
        <div className="mt-9 flex w-full max-w-md flex-col gap-3 sm:flex-row sm:justify-center">
          <Link href="/" className="btn-red"><Icon name="heart" className="h-4 w-4" /> Respawn at home</Link>
          <Link href="/server" className="btn-ghost">Server info</Link>
          <Link href="/leaderboards" className="btn-ghost">Leaderboards</Link>
        </div>
      </div>
    </div>
  );
}
