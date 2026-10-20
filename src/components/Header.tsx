import Link from "next/link";
import { Logo } from "./Logo";
import { MobileNav } from "./MobileNav";
import { getCurrentUser } from "@/lib/auth/session";
import { logoutAction } from "@/app/(auth)/actions";

export const NAV = [
  { href: "/", label: "Home" },
  { href: "/server", label: "Server" },
  { href: "/leaderboards", label: "Leaderboards" },
  { href: "/store", label: "Store" },
];

async function safeUser() {
  try {
    return await getCurrentUser();
  } catch {
    return null; // DB unreachable: public pages still render
  }
}

export async function Header() {
  const user = await safeUser();
  const authLinks = user
    ? [{ href: "/portal", label: "Portal" }, ...(user.role === "ADMIN" ? [{ href: "/admin", label: "Admin" }] : [])]
    : [{ href: "/login", label: "Log in" }, { href: "/register", label: "Register" }];

  return (
    <header className="sticky top-0 z-40 border-b border-white/5 bg-ink-950/75 backdrop-blur-md">
      <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-3 focus:z-50 btn-red btn-sm">
        Skip to content
      </a>
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6">
        <Link href="/" className="shrink-0" aria-label="RuleXMC home">
          <Logo size="sm" />
        </Link>
        <nav aria-label="Main" className="hidden items-center gap-1 md:flex">
          {NAV.map((n) => (
            <Link key={n.href} href={n.href} className="rounded px-3 py-2 font-hud text-sm font-semibold uppercase tracking-[0.16em] text-bone-300 transition hover:bg-white/5 hover:text-white">
              {n.label}
            </Link>
          ))}
        </nav>
        <div className="hidden items-center gap-2 md:flex">
          {user ? (
            <>
              {authLinks.map((n) => (
                <Link key={n.href} href={n.href} className="btn-ghost btn-sm">{n.label}</Link>
              ))}
              <form action={logoutAction}>
                <button type="submit" className="rounded px-3 py-2 font-hud text-sm font-semibold uppercase tracking-[0.14em] text-bone-400 hover:text-white">
                  Log out
                </button>
              </form>
            </>
          ) : (
            <>
              <Link href="/login" className="btn-ghost btn-sm">Log in</Link>
              <Link href="/register" className="btn-red btn-sm">Register</Link>
            </>
          )}
        </div>
        <MobileNav links={[...NAV, ...authLinks]} loggedIn={!!user} />
      </div>
    </header>
  );
}
