"use client";

import Link from "next/link";
import { useEffect } from "react";
import { PixelHeart } from "@/components/Logo";
import { Icon } from "@/components/Icon";

export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => console.error(error), [error]);
  return (
    <div className="relative isolate overflow-hidden">
      <div aria-hidden className="absolute left-1/2 top-1/3 -z-10 h-72 w-[40rem] max-w-[120vw] -translate-x-1/2 rounded-full bg-blood-700/20 blur-3xl" />
      <div className="container-x flex min-h-[64vh] flex-col items-center justify-center py-20 text-center" role="alert">
        <PixelHeart className="enter h-12 w-14 motion-safe:animate-pulse" />
        <p className="eyebrow enter enter-1 mt-8">Something broke</p>
        <h1 className="h-display enter enter-1 mt-3 text-3xl text-white sm:text-4xl">Creeper in the server room</h1>
        <p className="lead enter enter-2 mt-4 max-w-md">An unexpected error occurred on our side. Try again, or head back home.</p>
        {error.digest ? (
          <p className="enter enter-2 mt-4 rounded-md border border-white/10 bg-ink-900 px-3 py-1.5 font-mono text-xs text-bone-400">
            Reference: <span className="select-all text-bone-200">{error.digest}</span>
          </p>
        ) : null}
        <div className="enter enter-3 mt-9 flex w-full max-w-md flex-col gap-3 sm:flex-row sm:justify-center">
          <button type="button" onClick={reset} className="btn-red"><Icon name="zap" className="h-4 w-4" /> Try again</button>
          <Link href="/" className="btn-ghost">Home</Link>
          <a href="/discord" className="btn-ghost" target="_blank" rel="noopener noreferrer">
            <Icon name="discord" className="h-4 w-4" /> Tell us on Discord<span className="sr-only"> (opens in a new tab)</span>
          </a>
        </div>
        {error.digest ? <p className="mt-4 text-xs text-bone-400">Mention the reference above so the team can find the problem.</p> : null}
      </div>
    </div>
  );
}
