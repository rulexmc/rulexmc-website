"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function isActive(pathname: string, href: string) {
  return href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(`${href}/`);
}

/** Desktop primary navigation with an active-page indicator. */
export function NavLinks({ links }: { links: { href: string; label: string }[] }) {
  const pathname = usePathname();
  return (
    <ul className="flex items-center gap-1">
      {links.map((n) => {
        const active = isActive(pathname, n.href);
        return (
          <li key={n.href}>
            <Link
              href={n.href}
              aria-current={active ? "page" : undefined}
              className="group relative rounded-md px-3 py-2 font-hud text-sm font-semibold uppercase tracking-[0.16em] text-bone-300 transition hover:text-white aria-[current=page]:text-white"
            >
              {n.label}
              <span
                aria-hidden
                className={`absolute inset-x-3 -bottom-px h-px bg-gradient-to-r from-transparent via-blood-400 to-transparent transition-opacity ${active ? "opacity-100" : "opacity-0 group-hover:opacity-60"}`}
              />
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
