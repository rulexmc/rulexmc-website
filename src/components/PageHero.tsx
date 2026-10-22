import { Breadcrumbs } from "./Breadcrumbs";
import type { Crumb } from "@/lib/seo";

/** Consistent header band for inner pages. Pass `breadcrumbs` (excluding Home) to show a trail above the title. */
export function PageHero({
  eyebrow, title, children, actions, breadcrumbs, aside,
}: {
  eyebrow: string;
  title: React.ReactNode;
  children?: React.ReactNode;
  actions?: React.ReactNode;
  breadcrumbs?: Crumb[];
  /** Optional content shown beside the title on large screens (e.g. stat tiles). */
  aside?: React.ReactNode;
}) {
  return (
    <section className="relative isolate overflow-hidden border-b border-white/[0.06]">
      <div aria-hidden className="block-grid absolute inset-0 -z-10 [mask-image:radial-gradient(ellipse_at_top,black_20%,transparent_70%)]" />
      <div aria-hidden className="absolute -top-40 left-1/2 -z-10 h-80 w-[56rem] max-w-[140vw] -translate-x-1/2 rounded-full bg-blood-600/20 blur-3xl" />
      <div className="container-x py-12 sm:py-16 lg:py-20">
        <div className={aside ? "grid gap-10 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end" : undefined}>
          <div className="max-w-3xl">
            {breadcrumbs ? <div className="enter">{<Breadcrumbs items={breadcrumbs} />}</div> : null}
            <p className="eyebrow enter">{eyebrow}</p>
            <h1 className="h-display enter enter-1 mt-3 text-3xl leading-[1.05] text-white sm:text-5xl lg:text-6xl">{title}</h1>
            {children ? <div className="lead enter enter-2 mt-5 max-w-2xl">{children}</div> : null}
            {actions ? <div className="enter enter-3 mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">{actions}</div> : null}
          </div>
          {aside ? <div className="enter enter-3">{aside}</div> : null}
        </div>
      </div>
    </section>
  );
}
