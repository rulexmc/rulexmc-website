"use client";

import Link from "next/link";
import { useEffect } from "react";
import { PixelHeart } from "@/components/Logo";

export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => console.error(error), [error]);
  return (
    <div className="container-x flex min-h-[64vh] flex-col items-center justify-center py-20 text-center" role="alert">
      <PixelHeart className="h-12 w-14 animate-pulse" />
      <p className="eyebrow mt-8">Something broke</p>
      <h1 className="h-display mt-3 text-3xl text-white sm:text-4xl">Creeper in the server room</h1>
      <p className="lead mt-4 max-w-md">An unexpected error occurred. Try again, or head back home.</p>
      {error.digest ? <p className="mt-3 font-mono text-xs text-bone-400">Reference: {error.digest}</p> : null}
      <div className="mt-9 flex flex-col gap-3 sm:flex-row">
        <button type="button" onClick={reset} className="btn-red">Try again</button>
        <Link href="/" className="btn-ghost">Home</Link>
      </div>
    </div>
  );
}
