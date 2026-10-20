"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { logoutAction } from "@/app/(auth)/actions";

export function MobileNav({ links, loggedIn }: { links: { href: string; label: string }[]; loggedIn: boolean }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  useEffect(() => setOpen(false), [pathname]);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <div className="md:hidden">
      <button
        type="button"
        className="btn-ghost btn-sm"
        aria-expanded={open}
        aria-controls="mobile-menu"
        onClick={() => setOpen((o) => !o)}
      >
        <span className="sr-only">{open ? "Close menu" : "Open menu"}</span>
        <span aria-hidden className="flex w-5 flex-col gap-1">
          <span className={`h-0.5 bg-current transition ${open ? "translate-y-1.5 rotate-45" : ""}`} />
          <span className={`h-0.5 bg-current transition ${open ? "opacity-0" : ""}`} />
          <span className={`h-0.5 bg-current transition ${open ? "-translate-y-1.5 -rotate-45" : ""}`} />
        </span>
      </button>
      {open ? (
        <nav id="mobile-menu" aria-label="Mobile" className="absolute inset-x-0 top-16 border-b border-blood-500/30 bg-ink-950/95 px-4 pb-6 pt-2 backdrop-blur-md">
          <ul className="flex flex-col">
            {links.map((l) => (
              <li key={l.href}>
                <Link
                  href={l.href}
                  aria-current={pathname === l.href ? "page" : undefined}
                  className="block border-b border-white/5 py-3.5 font-hud text-lg font-semibold uppercase tracking-[0.16em] text-bone-200 aria-[current=page]:text-blood-400"
                >
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
          {loggedIn ? (
            <form action={logoutAction} className="mt-4">
              <button type="submit" className="btn-ghost w-full">Log out</button>
            </form>
          ) : null}
        </nav>
      ) : null}
    </div>
  );
}
