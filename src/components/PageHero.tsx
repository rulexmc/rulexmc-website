/** Consistent header band for inner pages. */
export function PageHero({
  eyebrow, title, children, actions,
}: { eyebrow: string; title: React.ReactNode; children?: React.ReactNode; actions?: React.ReactNode }) {
  return (
    <section className="relative isolate overflow-hidden border-b border-white/[0.06]">
      <div aria-hidden className="block-grid absolute inset-0 -z-10 [mask-image:radial-gradient(ellipse_at_top,black_20%,transparent_70%)]" />
      <div aria-hidden className="absolute -top-40 left-1/2 -z-10 h-80 w-[56rem] max-w-[140vw] -translate-x-1/2 rounded-full bg-blood-600/20 blur-3xl" />
      <div className="container-x py-14 sm:py-20">
        <div className="max-w-3xl animate-rise">
          <p className="eyebrow">{eyebrow}</p>
          <h1 className="h-display mt-3 text-3xl leading-[1.05] text-white sm:text-5xl lg:text-6xl">{title}</h1>
          {children ? <div className="lead mt-5 max-w-2xl">{children}</div> : null}
          {actions ? <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">{actions}</div> : null}
        </div>
      </div>
    </section>
  );
}
