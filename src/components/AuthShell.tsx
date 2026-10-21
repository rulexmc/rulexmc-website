import Link from "next/link";
import { PixelHeart } from "./Logo";

export function AuthShell({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) {
  return (
    <div className="relative isolate overflow-hidden">
      <div aria-hidden className="block-grid absolute inset-0 -z-10 [mask-image:radial-gradient(ellipse_at_center,black_20%,transparent_70%)]" />
      <div aria-hidden className="absolute left-1/2 top-10 -z-10 h-72 w-[36rem] max-w-[120vw] -translate-x-1/2 rounded-full bg-blood-700/25 blur-3xl" />
      <div className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-md flex-col justify-center px-4 py-16">
        <div className="panel-glow edge-top animate-rise p-6 sm:p-9">
          <PixelHeart className="mb-6 h-8 w-9" />
          <h1 className="h-display text-2xl text-white sm:text-3xl">{title}</h1>
          <p className="mb-8 mt-2 text-sm leading-relaxed text-bone-400">{subtitle}</p>
          {children}
        </div>
        <p className="mt-6 text-center text-xs leading-relaxed text-bone-400">
          This is your RuleX MC <strong className="text-bone-300">website</strong> account. It is separate from your in-game AuthMe password.{" "}
          <Link href="/server#join" className="link">How to join the server</Link>
        </p>
      </div>
    </div>
  );
}
