import Link from "next/link";
import { REALMS, type RealmId } from "@/lib/site";
import { Icon, type IconName } from "./Icon";

const REALM_ICON: Record<RealmId, IconName> = { lifesteal: "heart", survival: "map", practice: "sword" };

export function RealmCards({ detailed = false }: { detailed?: boolean }) {
  return (
    <ul className="grid gap-5 md:grid-cols-3">
      {REALMS.map((r, i) => (
        <li key={r.id} id={detailed ? `realm-${r.id}` : undefined} className={`card edge-top flex flex-col overflow-hidden p-6 sm:p-7 ${detailed ? "scroll-mt-24" : ""} ${i === 0 ? "border-blood-500/30" : ""}`}>
          <div aria-hidden className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-blood-600/10 blur-2xl" />
          <div className="flex items-center justify-between gap-3">
            <span className="icon-tile"><Icon name={REALM_ICON[r.id]} className="h-6 w-6" /></span>
            {i === 0 ? <span className="badge border border-blood-500/50 bg-blood-500/15 text-blood-200">Flagship</span> : null}
          </div>
          <p className="mt-6 font-hud text-xs font-semibold uppercase tracking-[0.28em] text-blood-300">{r.kicker}</p>
          <h3 className="h-display mt-2 text-2xl text-white">{r.name}</h3>
          <p className="mt-3 flex-1 leading-relaxed text-bone-300">{r.summary}</p>
          <ul className="mt-5 space-y-2 border-t border-white/[0.06] pt-5 text-sm text-bone-200">
            {r.points.map((p) => (
              <li key={p} className="flex gap-2.5">
                <Icon name="check" className="mt-0.5 h-4 w-4 shrink-0 text-blood-400" />
                <span>{p}</span>
              </li>
            ))}
          </ul>
          {!detailed ? (
            <Link href={`/server#realm-${r.id}`} className="mt-6 inline-flex items-center gap-2 font-hud text-sm font-bold uppercase tracking-[0.16em] text-blood-300 transition hover:text-white">
              Learn more <Icon name="arrow-right" className="h-4 w-4" />
              <span className="sr-only">about {r.name}</span>
            </Link>
          ) : null}
        </li>
      ))}
    </ul>
  );
}
