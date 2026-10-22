import type { PaymentState } from "@/lib/payments";

/** `idKey` must be unique on the page when the same listing is rendered twice (e.g. the featured spotlight). */
export function PurchaseButton({ state, slug, highlight, idKey = slug }: { state: PaymentState; slug: string; highlight: boolean; idKey?: string }) {
  const cls = `${highlight ? "btn-red" : "btn-ghost"} w-full`;
  if (!state.enabled) {
    return (
      <div>
        <button type="button" className={`${cls} cursor-not-allowed`} disabled aria-describedby={`pay-${idKey}`}>
          Purchase unavailable
        </button>
        <p id={`pay-${idKey}`} className="mt-2 text-center text-xs text-bone-400" data-testid="payments-disabled">{state.reason}</p>
      </div>
    );
  }
  if (state.provider === "tebex") {
    return (
      <a className={cls} href={state.href} target="_blank" rel="noopener noreferrer">
        Buy on Tebex ↗
      </a>
    );
  }
  return (
    <form method="post" action={state.action}>
      <input type="hidden" name="listing" value={slug} />
      <button type="submit" className={cls}>Buy now</button>
    </form>
  );
}
