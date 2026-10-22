import type { Metadata } from "next";
import type { StoreListing } from "@prisma/client";
import { PurchaseButton } from "@/components/PurchaseButton";
import { SectionHeading } from "@/components/SectionHeading";
import { Content } from "@/components/Content";
import { EmptyState } from "@/components/EmptyState";
import { prisma } from "@/lib/db";
import { getBlock } from "@/lib/content";
import { getConfig } from "@/lib/config";
import { formatPrice, getPaymentState } from "@/lib/payments";
import { pageMetadata } from "@/lib/seo";
import { KIND_META, groupByKind, tierFeatures, type Kind } from "@/lib/store";
import { PageHero } from "@/components/PageHero";
import { Icon, type IconName } from "@/components/Icon";

export const metadata: Metadata = pageMetadata({
  title: "Store",
  description: "The RuleX MC store: ranks, kits and perks. The store is not open yet; packages shown are examples and payments are disabled.",
  path: "/store",
});
export const dynamic = "force-dynamic";

const CHECKOUT_MSG: Record<string, { text: string; tone: string }> = {
  success: { text: "Thanks! Your payment was received. Delivery to your Minecraft account can take a few minutes.", tone: "border-emerald-400/40 bg-emerald-400/10 text-emerald-100" },
  cancelled: { text: "Checkout cancelled. You have not been charged.", tone: "border-white/10 bg-white/5 text-bone-200" },
  login: { text: "Please log in and link your Minecraft username before purchasing.", tone: "border-amber-400/40 bg-amber-400/10 text-amber-100" },
  link: { text: "Link your Minecraft username in the Player Portal before purchasing so we know where to deliver.", tone: "border-amber-400/40 bg-amber-400/10 text-amber-100" },
  error: { text: "Checkout could not be started. Please try again later.", tone: "border-blood-500/50 bg-blood-900/40 text-blood-200" },
  unavailable: { text: "That item is not available for purchase right now.", tone: "border-blood-500/50 bg-blood-900/40 text-blood-200" },
  limited: { text: "Too many checkout attempts. Please wait and try again.", tone: "border-amber-400/40 bg-amber-400/10 text-amber-100" },
};

const KIND_ICON: Record<Kind, IconName> = { RANK: "star", KIT: "box", PERK: "spark" };

async function getListings() {
  try {
    return await prisma.storeListing.findMany({ where: { active: true }, orderBy: [{ kind: "asc" }, { sortOrder: "asc" }, { priceCents: "asc" }] });
  } catch {
    return null;
  }
}

function ExampleBadge() {
  return (
    <span className="badge border border-amber-400/60 bg-amber-400/15 text-amber-200" title="Example listing, not a real package" data-testid="example-badge">
      <span aria-hidden>▲</span> Example
    </span>
  );
}

function Price({ l, size = "lg" }: { l: StoreListing; size?: "lg" | "md" }) {
  return (
    <p className={`flex flex-wrap items-baseline gap-x-2 font-display font-black text-white ${size === "lg" ? "text-4xl" : "text-2xl"}`}>
      {formatPrice(l.priceCents, l.currency)}
      <span className="font-hud text-sm font-semibold uppercase tracking-widest text-bone-400">{l.isExample ? "example price" : "one-time"}</span>
    </p>
  );
}

function FeatureList({ features, includes, className = "" }: { features: string[]; includes?: string | null; className?: string }) {
  return (
    <ul className={`space-y-2.5 text-sm ${className}`} aria-label="Included">
      {includes ? (
        <li className="flex gap-2.5 font-semibold text-bone-100">
          <Icon name="check" className="mt-0.5 h-4 w-4 shrink-0 text-blood-400" />
          <span>Everything in {includes}, plus:</span>
        </li>
      ) : null}
      {features.map((f) => (
        <li key={f} className={`flex gap-2.5 ${includes ? "pl-6.5" : ""}`}>
          <Icon name={includes ? "arrow-right" : "check"} className="mt-0.5 h-4 w-4 shrink-0 text-blood-400" />
          <span className="text-bone-200">{f}</span>
        </li>
      ))}
    </ul>
  );
}

function Featured({ l }: { l: StoreListing }) {
  return (
    <section aria-labelledby="featured-title" className="panel-glow scanlines edge-top reveal mb-16 overflow-hidden p-6 sm:p-8 lg:p-10" data-testid="featured-package">
      <div className="grid gap-8 lg:grid-cols-[1.1fr_1fr] lg:items-center">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="badge bg-blood-500 text-white shadow-[0_0_20px_rgba(208,18,41,0.6)]"><Icon name="star" className="h-3 w-3" /> Featured</span>
            <span className="badge border border-white/10 text-bone-300">{KIND_META[l.kind].title.replace(/s$/, "")}</span>
            {l.isExample ? <ExampleBadge /> : null}
          </div>
          <h2 id="featured-title" className="h-display mt-5 text-3xl text-white sm:text-4xl">{l.name}</h2>
          {l.tagline ? <p className="mt-2 font-hud text-xl text-bone-300">{l.tagline}</p> : null}
          {l.description ? <p className="mt-4 max-w-xl leading-relaxed text-bone-300">{l.description}</p> : null}
          <div className="mt-6"><Price l={l} /></div>
          <div className="mt-6 max-w-sm"><PurchaseButton state={getPaymentState(l)} slug={l.slug} idKey={`featured-${l.slug}`} highlight /></div>
        </div>
        {l.features.length > 0 ? (
          <div className="rounded-xl border border-white/[0.07] bg-ink-900/60 p-5 sm:p-6">
            <p className="table-head mb-4">What&apos;s included{l.isExample ? " (example)" : ""}</p>
            <FeatureList features={l.features} className="sm:columns-2 sm:gap-6 sm:space-y-0 [&>li]:mb-2.5 [&>li]:break-inside-avoid" />
          </div>
        ) : null}
      </div>
    </section>
  );
}

export default async function StorePage({ searchParams }: { searchParams: Promise<{ checkout?: string }> }) {
  const { checkout } = await searchParams;
  const cfg = getConfig();
  const [listings, shop, auction, kits] = await Promise.all([getListings(), getBlock("store.shop"), getBlock("store.auction"), getBlock("store.kits")]);
  const groups = groupByKind(listings ?? []);
  const ranks = groups.find((g) => g.kind === "RANK")?.items ?? [];
  const tiers = tierFeatures(ranks);
  const featured = listings?.find((l) => l.highlight) ?? null;
  const allFeatures = Array.from(new Set(ranks.flatMap((r) => r.features)));
  const msg = checkout ? CHECKOUT_MSG[checkout] : undefined;
  const paymentsOff = cfg.payments.provider === "none";
  const anyExample = listings?.some((l) => l.isExample) ?? false;
  const discord = cfg.community.discord;

  return (
    <>
      <PageHero eyebrow="Support the server" title="Store" breadcrumbs={[{ name: "Store", path: "/store" }]}>
        Ranks, kits and perks for the RuleX Network are on the way. This page previews how the store will look.
      </PageHero>

      <div className="container-x py-10 sm:py-14">
        {paymentsOff || anyExample ? (
          <div className="mb-10 flex flex-col gap-4 rounded-2xl border border-amber-400/40 bg-amber-400/[0.08] p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6" role="note" data-testid="store-notice">
            <div className="flex items-start gap-3">
              <Icon name="info" className="mt-0.5 h-5 w-5 shrink-0 text-amber-200" />
              <div className="text-sm leading-relaxed text-amber-50">
                <p className="font-hud text-base font-bold uppercase tracking-wider text-amber-100">The store is not open yet</p>
                <p className="mt-1">
                  {anyExample ? "Packages marked “Example” are placeholders: names, contents and prices are not final. " : ""}
                  {paymentsOff ? "Payments not configured — purchases are currently disabled." : ""}
                </p>
              </div>
            </div>
            {discord ? (
              <a href={discord} target="_blank" rel="noopener noreferrer" className="btn-ghost btn-sm shrink-0">
                <Icon name="discord" className="h-4 w-4" /> Get notified on Discord<span className="sr-only"> (opens in a new tab)</span>
              </a>
            ) : null}
          </div>
        ) : null}

        {msg ? <div className={`mb-8 rounded-xl border px-4 py-3 text-sm ${msg.tone}`} role="status">{msg.text}</div> : null}

        {listings === null ? (
          <EmptyState icon="alert" tone="error" title="The store is temporarily unavailable" role="alert">Please try again in a moment.</EmptyState>
        ) : groups.length === 0 ? (
          <EmptyState icon="box" title="Nothing listed yet">Packages will appear here when the store launches. Follow Discord for the announcement.</EmptyState>
        ) : (
          <>
            {groups.length > 1 ? (
              <nav aria-label="Store categories" className="mb-10 flex flex-wrap gap-2">
                {groups.map((g) => (
                  <a key={g.kind} href={`#${KIND_META[g.kind].anchor}`} className="chip transition-colors hover:border-blood-400/60 hover:text-white">
                    <Icon name={KIND_ICON[g.kind]} className="h-3.5 w-3.5 text-blood-300" />
                    {KIND_META[g.kind].title}
                    <span className="text-bone-400">{g.items.length}</span>
                  </a>
                ))}
              </nav>
            ) : null}

            {featured ? <Featured l={featured} /> : null}

            {groups.map((g) => (
              <section key={g.kind} id={KIND_META[g.kind].anchor} className="mb-16 scroll-mt-24 last:mb-0" aria-labelledby={`${KIND_META[g.kind].anchor}-title`}>
                <div className="mb-6 flex items-center gap-3">
                  <span className="icon-tile h-10 w-10"><Icon name={KIND_ICON[g.kind]} className="h-5 w-5" /></span>
                  <h2 id={`${KIND_META[g.kind].anchor}-title`} className="h-display text-2xl text-white sm:text-3xl">{KIND_META[g.kind].title}</h2>
                  <span className="text-sm text-bone-400">{g.items.length} {g.items.length === 1 ? "package" : "packages"}</span>
                </div>
                {g.kind === "RANK" ? (
                  <ul className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
                    {g.items.map((r, i) => (
                      <li key={r.id} className="reveal" style={{ "--i": i % 3 } as React.CSSProperties}>
                        <article className={`flex h-full flex-col p-6 sm:p-7 ${r.highlight ? "panel-glow edge-top transition-[translate,box-shadow] duration-300 hover:-translate-y-1" : "card"}`} aria-labelledby={`rank-${r.slug}`}>
                          <div className="flex min-h-6 flex-wrap items-center gap-2">
                            {r.highlight ? <span className="badge bg-blood-500 text-white">Featured</span> : null}
                            {r.isExample ? <ExampleBadge /> : null}
                          </div>
                          <h3 id={`rank-${r.slug}`} className="h-display mt-4 text-2xl text-white">{r.name}</h3>
                          {r.tagline ? <p className="mt-1 font-hud text-lg text-bone-300">{r.tagline}</p> : null}
                          <div className="mt-5"><Price l={r} /></div>
                          {r.description ? <p className="mt-4 text-sm leading-relaxed text-bone-300">{r.description}</p> : null}
                          <FeatureList features={tiers[i]!.features} includes={tiers[i]!.includes} className="mt-5 flex-1 border-t border-white/[0.06] pt-5" />
                          <div className="mt-7"><PurchaseButton state={getPaymentState(r)} slug={r.slug} highlight={r.highlight} /></div>
                        </article>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {g.items.map((e, i) => (
                      <li key={e.id} className="reveal" style={{ "--i": i % 3 } as React.CSSProperties}>
                        <article className="card flex h-full flex-col p-6" aria-labelledby={`item-${e.slug}`}>
                          <div className="flex flex-wrap items-center gap-2">
                            {e.highlight ? <span className="badge bg-blood-500 text-white">Featured</span> : null}
                            {e.isExample ? <ExampleBadge /> : null}
                          </div>
                          <h3 id={`item-${e.slug}`} className="mt-3 font-hud text-xl font-bold text-white">{e.name}</h3>
                          {e.tagline ? <p className="mt-0.5 text-sm text-bone-400">{e.tagline}</p> : null}
                          {e.description ? <p className="mt-3 text-sm leading-relaxed text-bone-300">{e.description}</p> : null}
                          {e.features.length > 0 ? <FeatureList features={e.features} className="mt-4" /> : null}
                          <div className="mt-auto pt-5"><Price l={e} size="md" /></div>
                          <div className="mt-4"><PurchaseButton state={getPaymentState(e)} slug={e.slug} highlight={false} /></div>
                        </article>
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            ))}

            {allFeatures.length > 0 && ranks.length > 1 ? (
              <section className="mt-20" aria-labelledby="compare">
                <SectionHeading eyebrow="Compare" title="Rank comparison" id="compare" />
                <div className="panel overflow-x-auto" tabIndex={0} role="region" aria-label="Rank comparison table (scrolls sideways on small screens)">
                  <table className="w-full min-w-[560px] text-left text-sm">
                    <caption className="sr-only">Features included in each rank{anyExample ? " (example listings)" : ""}</caption>
                    <thead className="border-b border-white/5 bg-ink-900/70">
                      <tr>
                        <th scope="col" className="table-head px-4 py-3">Feature</th>
                        {ranks.map((r) => <th key={r.id} scope="col" className={`table-head px-4 py-3 text-center ${r.highlight ? "text-blood-300" : ""}`}>{r.name}</th>)}
                      </tr>
                    </thead>
                    <tbody>
                      {allFeatures.map((f) => (
                        <tr key={f} className="border-b border-white/[0.04] transition-colors hover:bg-white/[0.02]">
                          <th scope="row" className="px-4 py-3 font-normal text-bone-200">{f}</th>
                          {ranks.map((r) => (
                            <td key={r.id} className={`px-4 py-3 text-center ${r.highlight ? "bg-blood-500/[0.04]" : ""}`}>
                              {r.features.includes(f)
                                ? <Icon name="check" className="mx-auto h-4 w-4 text-blood-400" label="Included" />
                                : <span className="text-bone-400/50"><span aria-hidden>—</span><span className="sr-only">Not included</span></span>}
                            </td>
                          ))}
                        </tr>
                      ))}
                      <tr>
                        <th scope="row" className="px-4 py-3 font-hud text-xs font-semibold uppercase tracking-[0.18em] text-bone-400">Price{anyExample ? " (example)" : ""}</th>
                        {ranks.map((r) => <td key={r.id} className="px-4 py-3 text-center font-hud text-base font-bold text-white">{formatPrice(r.priceCents, r.currency)}</td>)}
                      </tr>
                    </tbody>
                  </table>
                </div>
              </section>
            ) : null}
          </>
        )}

        <section className="mt-20 grid gap-6 lg:grid-cols-3" aria-label="Store information">
          {[kits, shop, auction].map((b, i) => (
            <div key={b.title} className="panel reveal p-6 sm:p-7" style={{ "--i": i } as React.CSSProperties}>
              <span className="icon-tile h-10 w-10"><Icon name={(["info", "coins", "discord"] as const)[i]!} className="h-5 w-5" /></span>
              <h2 className="mt-4 font-hud text-xl font-bold uppercase tracking-wider text-white">{b.title}</h2>
              <div className="mt-3 text-sm"><Content body={b.body} /></div>
            </div>
          ))}
        </section>
      </div>
    </>
  );
}
