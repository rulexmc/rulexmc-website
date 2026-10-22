import Link from "next/link";
import { Icon } from "./Icon";
import { pageWindow } from "@/lib/pagination";

/** Accessible pagination using real links (works without JavaScript). */
export function Pagination({ page, pageCount, hrefFor, summary }: { page: number; pageCount: number; hrefFor: (p: number) => string; summary?: React.ReactNode }) {
  const pill = "inline-flex h-9 min-w-9 items-center justify-center rounded-md border px-2.5 font-hud text-sm font-bold tabular-nums transition";
  return (
    <nav aria-label="Pagination" className="flex flex-col gap-3 border-t border-white/5 px-4 py-3 text-sm sm:flex-row sm:items-center sm:justify-between">
      <span className="text-bone-400">{summary}</span>
      {pageCount > 1 ? (
        <ul className="flex flex-wrap items-center gap-1.5">
          <li>
            {page > 1
              ? <Link className={`${pill} border-white/10 text-bone-200 hover:border-blood-400/60 hover:text-white`} href={hrefFor(page - 1)} rel="prev" aria-label="Previous page"><Icon name="chevron-left" className="h-4 w-4" /></Link>
              : <span className={`${pill} border-white/5 text-bone-400/40`} aria-hidden><Icon name="chevron-left" className="h-4 w-4" /></span>}
          </li>
          {pageWindow(page, pageCount).map((p, i) =>
            p === null ? (
              <li key={`gap-${i}`} className="px-1 text-bone-400" aria-hidden>…</li>
            ) : (
              <li key={p}>
                <Link
                  href={hrefFor(p)}
                  aria-label={`Page ${p}`}
                  aria-current={p === page ? "page" : undefined}
                  className={`${pill} ${p === page ? "border-blood-500/60 bg-blood-500/20 text-white" : "border-white/10 text-bone-300 hover:border-blood-400/60 hover:text-white"}`}
                >
                  {p}
                </Link>
              </li>
            ),
          )}
          <li>
            {page < pageCount
              ? <Link className={`${pill} border-white/10 text-bone-200 hover:border-blood-400/60 hover:text-white`} href={hrefFor(page + 1)} rel="next" aria-label="Next page"><Icon name="chevron-right" className="h-4 w-4" /></Link>
              : <span className={`${pill} border-white/5 text-bone-400/40`} aria-hidden><Icon name="chevron-right" className="h-4 w-4" /></span>}
          </li>
        </ul>
      ) : null}
    </nav>
  );
}
