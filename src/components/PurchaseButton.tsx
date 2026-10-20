import type { PaymentState } from "@/lib/payments";

export function PurchaseButton({ state, slug, highlight }: { state: PaymentState; slug: string; highlight: boolean }) {
  const cls = `${highlight ? "btn-red" : "btn-ghost"} w-full`;
  if (!state.enabled) {
    return (
      <div>
        <button type="button" className={`${cls} cursor-not-allowed`} disabled aria-describedby={`pay-${slug}`}>
          Purchase unavailable
        </button>
        <p id={`pay-${slug}`} className="mt-2 text-center text-xs text-bone-400" data-testid="payments-disabled">{state.reason}</p>
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
