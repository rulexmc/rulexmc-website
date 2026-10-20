import type { Metadata } from "next";
import { PurchaseButton } from "@/components/PurchaseButton";
import { SectionHeading } from "@/components/SectionHeading";
import { Content } from "@/components/Content";
import { prisma } from "@/lib/db";
import { getBlock } from "@/lib/content";
import { getConfig } from "@/lib/config";
import { formatPrice, getPaymentState } from "@/lib/payments";

export const metadata: Metadata = { title: "Store", description: "Ranks, kits and perks for RuleXMC." };
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

export default async function StorePage({ searchParams }: { searchParams: Promise<{ checkout?: string }> }) {
  const { checkout } = await searchParams;
  const cfg = getConfig();
  const [listings, shop, auction, kits] = await Promise.all([getListings(), getBlock("store.shop"), getBlock("store.auction"), getBlock("store.kits")]);
  const ranks = listings?.filter((l) => l.kind === "RANK") ?? [];
  const extras = listings?.filter((l) => l.kind !== "RANK") ?? [];
  const allFeatures = Array.from(new Set(ranks.flatMap((r) => r.features)));
  const msg = checkout ? CHECKOUT_MSG[checkout] : undefined;

  return (
    <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6">
      <header className="mb-10 max-w-3xl">
        <p className="eyebrow">Support the server</p>
        <h1 className="h-display mt-2 text-3xl text-white sm:text-5xl">Store</h1>
        <p className="mt-4 text-bone-300">
          Ranks and perks help keep RuleXMC online. Nothing in the store sells hearts or breaks Lifesteal balance.
        </p>
        {cfg.payments.provider === "none" ? (
          <p className="mt-4 inline-flex rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm text-bone-300" role="note">
            Payments not configured — purchases are currently disabled.
          </p>
        ) : null}
      </header>

      {msg ? <div className={`mb-8 rounded-md border px-4 py-3 text-sm ${msg.tone}`} role="status">{msg.text}</div> : null}

      {listings === null ? (
        <div className="panel p-10 text-center text-bone-300" role="alert">The store is temporarily unavailable.</div>
      ) : ranks.length === 0 ? (
        <div className="panel p-10 text-center text-bone-400">No ranks are listed yet.</div>
      ) : (
        <>
          <section aria-labelledby="ranks" className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            <h2 id="ranks" className="sr-only">Ranks</h2>
            {ranks.map((r) => (
              <article key={r.id} className={`flex flex-col p-6 ${r.highlight ? "panel-glow scanlines" : "panel"}`}>
                {r.highlight ? <span className="badge absolute -top-3 left-6 bg-blood-500 text-white shadow-[0_0_20px_rgba(239,28,43,0.6)]">Most popular</span> : null}
                <h3 className="h-display text-2xl text-white">{r.name}</h3>
                {r.tagline ? <p className="mt-1 font-hud text-bone-300">{r.tagline}</p> : null}
                <p className="mt-5 font-display text-3xl font-black text-white">
                  {formatPrice(r.priceCents, r.currency)}
                  <span className="ml-2 font-hud text-sm font-semibold uppercase tracking-widest text-bone-400">one-time</span>
                </p>
                {r.description ? <p className="mt-4 text-sm text-bone-300">{r.description}</p> : null}
                <ul className="mt-5 flex-1 space-y-2 text-sm">
                  {r.features.map((f) => (
                    <li key={f} className="flex gap-2.5"><span className="text-blood-400" aria-hidden>■</span><span>{f}</span></li>
                  ))}
                </ul>
                <div className="mt-6"><PurchaseButton state={getPaymentState(r)} slug={r.slug} highlight={r.highlight} /></div>
              </article>
            ))}
          </section>

          {allFeatures.length > 0 && ranks.length > 1 ? (
            <section className="mt-16" aria-labelledby="compare">
              <SectionHeading eyebrow="Compare" title="Feature comparison" />
              <h2 id="compare" className="sr-only">Feature comparison</h2>
              <div className="panel overflow-x-auto">
                <table className="w-full min-w-[560px] text-left text-sm">
                  <thead className="border-b border-white/5 bg-ink-900/70">
                    <tr>
                      <th scope="col" className="table-head px-4 py-3">Feature</th>
                      {ranks.map((r) => <th key={r.id} scope="col" className="table-head px-4 py-3 text-center">{r.name}</th>)}
                    </tr>
                  </thead>
                  <tbody>
                    {allFeatures.map((f) => (
                      <tr key={f} className="border-b border-white/[0.04]">
                        <th scope="row" className="px-4 py-3 font-normal text-bone-200">{f}</th>
                        {ranks.map((r) => (
                          <td key={r.id} className="px-4 py-3 text-center">
                            {r.features.includes(f)
                              ? <span className="text-blood-400" aria-label="Included">✓</span>
                              : <span className="text-bone-400/50" aria-label="Not included">—</span>}
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
        <section className="mt-16">
          <SectionHeading eyebrow="Extras" title="Kits & perks" />
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {extras.map((e) => (
              <article key={e.id} className="panel flex flex-col p-5">
                <span className="badge self-start border border-white/10 text-bone-300">{e.kind}</span>
                <h3 className="mt-3 font-hud text-xl font-bold text-white">{e.name}</h3>
                <p className="mt-1 flex-1 text-sm text-bone-300">{e.description || e.tagline}</p>
                <p className="mt-4 font-display text-xl font-black text-white">{formatPrice(e.priceCents, e.currency)}</p>
                <div className="mt-4"><PurchaseButton state={getPaymentState(e)} slug={e.slug} highlight={false} /></div>
              </article>
            ))}
          </div>
        </section>
      ) : null}

      <section className="mt-16 grid gap-6 lg:grid-cols-3">
        {[kits, shop, auction].map((b) => (
          <div key={b.title} className="panel p-6">
            <h2 className="font-hud text-xl font-bold uppercase tracking-wider text-white">{b.title}</h2>
            <div className="mt-3 text-sm"><Content body={b.body} /></div>
          </div>
        ))}
      </section>
    </div>
  );
}
