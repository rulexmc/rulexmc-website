"use client";

import Link from "next/link";
import { useEffect } from "react";

export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => console.error(error), [error]);
  return (
    <div className="mx-auto flex min-h-[60vh] max-w-xl flex-col items-center justify-center px-4 text-center" role="alert">
      <p className="eyebrow">Something broke</p>
      <h1 className="h-display mt-2 text-3xl text-white">Creeper in the server room</h1>
      <p className="mt-4 text-bone-300">An unexpected error occurred. Try again, or head back home.</p>
      {error.digest ? <p className="mt-2 text-xs text-bone-400">Reference: {error.digest}</p> : null}
      <div className="mt-8 flex gap-3">
        <button type="button" onClick={reset} className="btn-red">Try again</button>
        <Link href="/" className="btn-ghost">Home</Link>
      </div>
    </div>
  );
}
