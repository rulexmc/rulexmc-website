import Link from "next/link";
import { Logo } from "./Logo";
import { MobileNav } from "./MobileNav";
import { NavLinks } from "./NavLinks";
import { Icon } from "./Icon";
import { getCurrentUser } from "@/lib/auth/session";
import { logoutAction } from "@/app/(auth)/actions";
import { getConfig } from "@/lib/config";

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
  const [user, cfg] = [await safeUser(), getConfig()];
  const discord = cfg.community.discord;
  const authLinks = user
    ? [{ href: "/portal", label: "Portal" }, ...(user.role === "ADMIN" ? [{ href: "/admin", label: "Admin" }] : [])]
    : [{ href: "/login", label: "Log in" }, { href: "/register", label: "Register" }];

  return (
    <header className="sticky top-0 z-40 border-b border-white/[0.06] bg-ink-950/80 backdrop-blur-xl supports-[backdrop-filter]:bg-ink-950/65">
      <div className="container-x flex h-16 items-center justify-between gap-4">
        <Link href="/" className="shrink-0 rounded-md">
          <Logo size="sm" />
        </Link>
        <nav aria-label="Main" className="hidden md:block">
          <NavLinks links={NAV} />
        </nav>
        <div className="hidden items-center gap-2 md:flex">
          {discord ? (
            <a href={discord} target="_blank" rel="noopener noreferrer" className="btn-icon hover:border-[#5865F2]/70 hover:bg-[#5865F2]/15" aria-label="Join the RuleX MC Discord (opens in a new tab)">
              <Icon name="discord" className="h-5 w-5" />
            </a>
          ) : null}
          {user ? (
            <>
              {authLinks.map((n) => (
                <Link key={n.href} href={n.href} className="btn-ghost btn-sm">{n.label}</Link>
              ))}
              <form action={logoutAction}>
                <button type="submit" className="rounded-md px-3 py-2 font-hud text-sm font-semibold uppercase tracking-[0.14em] text-bone-400 transition hover:text-white">
                  Log out
                </button>
              </form>
            </>
          ) : (
            <>
              <Link href="/login" className="rounded-md px-3 py-2 font-hud text-sm font-semibold uppercase tracking-[0.14em] text-bone-300 transition hover:text-white">Log in</Link>
              <Link href="/server#join" className="btn-red btn-sm">
                <Icon name="play" className="h-3.5 w-3.5 fill-current" /> Play now
              </Link>
            </>
          )}
        </div>
        <MobileNav links={[...NAV, ...authLinks]} loggedIn={!!user} discord={discord} />
      </div>
    </header>
  );
}
