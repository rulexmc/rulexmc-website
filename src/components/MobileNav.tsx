"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { logoutAction } from "@/app/(auth)/actions";
import { Icon } from "./Icon";
import { isActive } from "./NavLinks";

export function MobileNav({
  links, loggedIn, discord,
}: { links: { href: string; label: string }[]; loggedIn: boolean; discord: string | null }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const buttonRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLElement>(null);

  // Close on navigation.
  useEffect(() => setOpen(false), [pathname]);

  useEffect(() => {
    if (!open) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    panelRef.current?.querySelector<HTMLElement>("a, button")?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        buttonRef.current?.focus();
        return;
      }
      // Keep keyboard focus inside the open menu (button + panel).
      if (e.key === "Tab" && panelRef.current) {
        const items = [buttonRef.current, ...panelRef.current.querySelectorAll<HTMLElement>("a, button")].filter(
          (el): el is HTMLElement => !!el,
        );
        const first = items[0];
        const last = items[items.length - 1];
        if (!first || !last) return;
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    };
    const onResize = () => window.innerWidth >= 768 && setOpen(false);
    window.addEventListener("keydown", onKey);
    window.addEventListener("resize", onResize);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("resize", onResize);
    };
  }, [open]);

  return (
    <div className="md:hidden">
      <button
        ref={buttonRef}
        type="button"
        className="btn-icon"
        aria-expanded={open}
        aria-controls="mobile-menu"
        aria-label={open ? "Close menu" : "Open menu"}
        onClick={() => setOpen((o) => !o)}
      >
        <Icon name={open ? "close" : "menu"} className="h-5 w-5" />
      </button>
      {open ? (
        <nav
          ref={panelRef}
          id="mobile-menu"
          aria-label="Mobile"
          className="fixed inset-x-0 top-16 z-40 h-[calc(100dvh-4rem)] overflow-y-auto overscroll-contain border-t border-blood-500/25 bg-ink-950 px-4 pb-10 pt-3 animate-rise [animation-duration:250ms]"
        >
          <ul className="flex flex-col">
            {links.map((l) => (
              <li key={l.href}>
                <Link
                  href={l.href}
                  onClick={() => setOpen(false)}
                  aria-current={isActive(pathname, l.href) ? "page" : undefined}
                  className="flex items-center justify-between border-b border-white/[0.06] py-4 font-hud text-lg font-semibold uppercase tracking-[0.16em] text-bone-200 transition hover:text-white aria-[current=page]:text-blood-400"
                >
                  {l.label}
                  <Icon name="arrow-right" className="h-4 w-4 opacity-40" />
                </Link>
              </li>
            ))}
          </ul>
          <div className="mt-6 grid gap-3">
            <Link href="/server#join" onClick={() => setOpen(false)} className="btn-red w-full">
              <Icon name="play" className="h-4 w-4 fill-current" /> Play now
            </Link>
            {discord ? (
              <a href={discord} target="_blank" rel="noopener noreferrer" className="btn-discord w-full">
                <Icon name="discord" className="h-5 w-5" /> Join Discord
              </a>
            ) : null}
            {loggedIn ? (
              <form action={logoutAction}>
                <button type="submit" className="btn-ghost w-full">Log out</button>
              </form>
            ) : null}
          </div>
        </nav>
      ) : null}
    </div>
  );
}
