import type { Metadata } from "next";
import { PurchaseButton } from "@/components/PurchaseButton";
import { SectionHeading } from "@/components/SectionHeading";
import { Content } from "@/components/Content";
import { prisma } from "@/lib/db";
import { getBlock } from "@/lib/content";
import { getConfig } from "@/lib/config";
import { formatPrice, getPaymentState } from "@/lib/payments";
import { pageMetadata } from "@/lib/seo";
import { PageHero } from "@/components/PageHero";
import { Icon } from "@/components/Icon";

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

export default async function StorePage({ searchParams }: { searchParams: Promise<{ checkout?: string }> }) {
  const { checkout } = await searchParams;
  const cfg = getConfig();
  const [listings, shop, auction, kits] = await Promise.all([getListings(), getBlock("store.shop"), getBlock("store.auction"), getBlock("store.kits")]);
  const ranks = listings?.filter((l) => l.kind === "RANK") ?? [];
  const extras = listings?.filter((l) => l.kind !== "RANK") ?? [];
  const allFeatures = Array.from(new Set(ranks.flatMap((r) => r.features)));
  const msg = checkout ? CHECKOUT_MSG[checkout] : undefined;
  const paymentsOff = cfg.payments.provider === "none";
  const anyExample = listings?.some((l) => l.isExample) ?? false;
  const discord = cfg.community.discord;

  return (
    <>
      <PageHero eyebrow="Support the server" title="Store">
        Ranks, kits and perks for the RuleX Network are on the way. This page previews how the store will look.
      </PageHero>

      <div className="container-x py-12 sm:py-14">
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
          <div className="panel p-10 text-center text-bone-300" role="alert">The store is temporarily unavailable.</div>
        ) : ranks.length === 0 ? (
          <div className="panel p-10 text-center text-bone-400">No ranks are listed yet.</div>
        ) : (
          <>
            <section aria-labelledby="ranks">
              <h2 id="ranks" className="sr-only">Ranks</h2>
              <ul className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
                {ranks.map((r) => (
                  <li key={r.id} className={`flex flex-col p-6 sm:p-7 ${r.highlight ? "panel-glow scanlines edge-top" : "card"}`}>
                    <div className="flex min-h-6 flex-wrap items-center gap-2">
                      {r.highlight ? <span className="badge bg-blood-500 text-white shadow-[0_0_20px_rgba(208,18,41,0.6)]">Most popular</span> : null}
                      {r.isExample ? <ExampleBadge /> : null}
                    </div>
                    <h3 className="h-display mt-4 text-2xl text-white">{r.name}</h3>
                    {r.tagline ? <p className="mt-1 font-hud text-lg text-bone-300">{r.tagline}</p> : null}
                    <p className="mt-5 flex items-baseline gap-2 font-display text-4xl font-black text-white">
                      {formatPrice(r.priceCents, r.currency)}
                      <span className="font-hud text-sm font-semibold uppercase tracking-widest text-bone-400">{r.isExample ? "example price" : "one-time"}</span>
                    </p>
                    {r.description ? <p className="mt-4 text-sm leading-relaxed text-bone-300">{r.description}</p> : null}
                    <ul className="mt-5 flex-1 space-y-2.5 border-t border-white/[0.06] pt-5 text-sm">
                      {r.features.map((f) => (
                        <li key={f} className="flex gap-2.5"><Icon name="check" className="mt-0.5 h-4 w-4 shrink-0 text-blood-400" /><span>{f}</span></li>
                      ))}
                    </ul>
                    <div className="mt-7"><PurchaseButton state={getPaymentState(r)} slug={r.slug} highlight={r.highlight} /></div>
                  </li>
                ))}
              </ul>
            </section>

            {allFeatures.length > 0 && ranks.length > 1 ? (
              <section className="mt-20" aria-labelledby="compare">
                <SectionHeading eyebrow="Compare" title="Feature comparison" id="compare" />
                <div className="panel overflow-x-auto">
                  <table className="w-full min-w-[560px] text-left text-sm">
                    <caption className="sr-only">Features included in each rank{anyExample ? " (example listings)" : ""}</caption>
                    <thead className="border-b border-white/5 bg-ink-900/70">
                      <tr>
                        <th scope="col" className="table-head px-4 py-3">Feature</th>
                        {ranks.map((r) => <th key={r.id} scope="col" className="table-head px-4 py-3 text-center">{r.name}</th>)}
                      </tr>
                    </thead>
                    <tbody>
                      {allFeatures.map((f) => (
                        <tr key={f} className="border-b border-white/[0.04] transition hover:bg-white/[0.02]">
                          <th scope="row" className="px-4 py-3 font-normal text-bone-200">{f}</th>
                          {ranks.map((r) => (
                            <td key={r.id} className="px-4 py-3 text-center">
                              {r.features.includes(f)
                                ? <Icon name="check" className="mx-auto h-4 w-4 text-blood-400" label="Included" />
                                : <span className="text-bone-400/50"><span aria-hidden>—</span><span className="sr-only">Not included</span></span>}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>
            ) : null}
          </>
        )}

        {extras.length > 0 ? (
          <section className="mt-20" aria-labelledby="extras">
            <SectionHeading eyebrow="Extras" title="Kits & perks" id="extras" />
            <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {extras.map((e) => (
                <li key={e.id} className="card flex flex-col p-6">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="badge border border-white/10 text-bone-300">{e.kind}</span>
                    {e.isExample ? <ExampleBadge /> : null}
                  </div>
                  <h3 className="mt-3 font-hud text-xl font-bold text-white">{e.name}</h3>
                  <p className="mt-1 flex-1 text-sm text-bone-300">{e.description || e.tagline}</p>
                  <p className="mt-4 font-display text-2xl font-black text-white">
                    {formatPrice(e.priceCents, e.currency)}
                    {e.isExample ? <span className="ml-2 font-hud text-xs font-semibold uppercase tracking-widest text-bone-400">example</span> : null}
                  </p>
                  <div className="mt-4"><PurchaseButton state={getPaymentState(e)} slug={e.slug} highlight={false} /></div>
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        <section className="mt-20 grid gap-6 lg:grid-cols-3" aria-label="Store information">
          {[kits, shop, auction].map((b, i) => (
            <div key={b.title} className="panel p-6 sm:p-7">
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
