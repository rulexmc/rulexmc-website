import Link from "next/link";
import { PixelHeart } from "@/components/Logo";

export default function NotFound() {
  return (
    <div className="block-grid">
      <div className="mx-auto flex min-h-[70vh] max-w-xl flex-col items-center justify-center px-4 text-center">
        <PixelHeart className="h-14 w-16 opacity-40 grayscale" />
        <p className="eyebrow mt-6">Error 404</p>
        <h1 className="h-display mt-2 text-4xl text-white sm:text-5xl">You fell into the void</h1>
        <p className="mt-4 text-bone-300">This page doesn&apos;t exist — or it lost its last heart.</p>
        <div className="mt-8 flex gap-3">
          <Link href="/" className="btn-red">Respawn</Link>
          <Link href="/server" className="btn-ghost">Server info</Link>
        </div>
      </div>
    </div>
  );
}
