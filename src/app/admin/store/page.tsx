import type { StoreListing } from "@prisma/client";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth/session";
import { getConfig } from "@/lib/config";
import { formatPrice } from "@/lib/payments";
import { AdminFlash, type FlashParams } from "@/components/AdminFlash";
import { SubmitButton } from "@/components/SubmitButton";
import { deleteListing, saveListing } from "../actions";

function ListingFields({ l }: { l?: StoreListing }) {
  const p = l?.id ?? "new";
  const f = (name: string, label: string, props: React.InputHTMLAttributes<HTMLInputElement> = {}) => (
    <div><label className="label" htmlFor={`${name}-${p}`}>{label}</label><input id={`${name}-${p}`} name={name} className="field" {...props} /></div>
  );
  return (
    <>
      {l ? <input type="hidden" name="id" value={l.id} /> : null}
      <div className="grid gap-3 sm:grid-cols-3">
        {f("name", "Name", { required: true, defaultValue: l?.name, maxLength: 40 })}
        {f("slug", "Slug", { required: true, defaultValue: l?.slug, pattern: "[a-z0-9-]{2,40}" })}
        <div><label className="label" htmlFor={`kind-${p}`}>Kind</label>
          <select id={`kind-${p}`} name="kind" defaultValue={l?.kind ?? "RANK"} className="field"><option>RANK</option><option>KIT</option><option>PERK</option></select></div>
        {f("price", "Price", { required: true, type: "number", min: 0, step: "0.01", defaultValue: l ? (l.priceCents / 100).toFixed(2) : "" })}
        {f("currency", "Currency", { defaultValue: l?.currency ?? getConfig().payments.currency, maxLength: 3 })}
        {f("sortOrder", "Sort order", { type: "number", defaultValue: l?.sortOrder ?? 0 })}
      </div>
      {f("tagline", "Tagline", { defaultValue: l?.tagline, maxLength: 120 })}
      <div><label className="label" htmlFor={`d-${p}`}>Description</label><textarea id={`d-${p}`} name="description" rows={2} defaultValue={l?.description} maxLength={2000} className="field" /></div>
      <div><label className="label" htmlFor={`fe-${p}`}>Features (one per line)</label><textarea id={`fe-${p}`} name="features" rows={5} defaultValue={l?.features.join("\n")} className="field font-mono text-sm" /></div>
      <div className="grid gap-3 sm:grid-cols-2">
        {f("tebexUrl", "Tebex checkout URL (PAYMENT_PROVIDER=tebex)", { type: "url", defaultValue: l?.tebexUrl ?? "", placeholder: "https://yourstore.tebex.io/checkout/packages/add/…" })}
        {f("stripePriceId", "Stripe Price ID (PAYMENT_PROVIDER=stripe)", { defaultValue: l?.stripePriceId ?? "", placeholder: "price_…" })}
      </div>
      <div className="flex gap-6 text-sm">
        <label className="flex items-center gap-2"><input type="checkbox" name="active" defaultChecked={l?.active ?? true} className="accent-blood-500" /> Active</label>
        <label className="flex items-center gap-2"><input type="checkbox" name="highlight" defaultChecked={l?.highlight ?? false} className="accent-blood-500" /> Highlight</label>
        <label className="flex items-center gap-2"><input type="checkbox" name="isExample" defaultChecked={l?.isExample ?? false} className="accent-blood-500" /> Example (badged as sample)</label>
      </div>
    </>
  );
}

export default async function AdminStore({ searchParams }: { searchParams: FlashParams }) {
  await requireAdmin();
  const sp = await searchParams;
  const listings = await prisma.storeListing.findMany({ orderBy: [{ kind: "asc" }, { sortOrder: "asc" }] });
  return (
    <div>
      <AdminFlash {...sp} />
      <p className="mb-6 text-sm text-bone-400">Payment provider: <strong className="text-white">{getConfig().payments.provider}</strong>. Buttons stay disabled until a provider and per-item checkout link/price are configured.</p>
      <ul className="space-y-3">
        {listings.map((l) => (
          <li key={l.id} className="panel p-4">
            <details>
              <summary className="flex cursor-pointer flex-wrap items-center justify-between gap-2">
                <span className="font-hud text-lg font-bold text-white">{l.name} <span className="text-sm font-normal text-bone-400">· {l.kind} · {formatPrice(l.priceCents, l.currency)}</span></span>
                <span className="text-xs text-bone-400">{l.active ? "active" : "hidden"}{l.isExample ? " · example" : ""}{l.tebexUrl ? " · tebex" : ""}{l.stripePriceId ? " · stripe" : ""}</span>
              </summary>
              <form action={saveListing} className="mt-4 space-y-3"><ListingFields l={l} /><SubmitButton className="btn-red btn-sm">Save</SubmitButton></form>
              <form action={deleteListing} className="mt-3"><input type="hidden" name="id" value={l.id} /><button type="submit" className="text-sm text-blood-300 underline hover:text-white">Delete listing</button></form>
            </details>
          </li>
        ))}
      </ul>
      <form action={saveListing} className="panel mt-8 space-y-3 p-5">
        <h2 className="font-hud text-lg font-bold uppercase tracking-wider text-white">New listing</h2>
        <ListingFields />
        <SubmitButton className="btn-red btn-sm">Create listing</SubmitButton>
      </form>
    </div>
  );
}
