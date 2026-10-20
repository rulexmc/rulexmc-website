import { createHmac } from "node:crypto";
import { getConfig, secrets, type PaymentProviderName } from "@/lib/config";
import { safeEqual } from "@/lib/auth/token";

/**
 * Payment provider abstraction. The UI asks `getPaymentState(listing)` whether
 * a purchase button may be enabled; it never sees secrets.
 *  - tebex:  each listing carries a Tebex package checkout URL (Tebex handles delivery to the server)
 *  - stripe: POST /api/checkout creates a Stripe Checkout Session server-side
 *  - none:   buttons are disabled with "Payments not configured"
 */

export interface ListingPaymentFields {
  slug: string;
  tebexUrl: string | null;
  stripePriceId: string | null;
}

export type PaymentState =
  | { enabled: true; provider: "tebex"; href: string }
  | { enabled: true; provider: "stripe"; action: string }
  | { enabled: false; provider: PaymentProviderName; reason: string };

export function getPaymentState(
  listing: ListingPaymentFields,
  provider: PaymentProviderName = getConfig().payments.provider,
  stripeConfigured: boolean = !!secrets.stripeSecretKey(),
): PaymentState {
  if (provider === "tebex") {
    if (listing.tebexUrl) return { enabled: true, provider, href: listing.tebexUrl };
    return { enabled: false, provider, reason: "Checkout link not set for this item" };
  }
  if (provider === "stripe") {
    if (!stripeConfigured) return { enabled: false, provider, reason: "Payments not configured" };
    if (!listing.stripePriceId) return { enabled: false, provider, reason: "Price not set for this item" };
    return { enabled: true, provider, action: "/api/checkout" };
  }
  return { enabled: false, provider: "none", reason: "Payments not configured" };
}

export async function createStripeCheckout(opts: {
  priceId: string;
  listingSlug: string;
  userId: string;
  mcUsername: string;
  email: string;
  siteUrl: string;
}): Promise<{ id: string; url: string }> {
  const key = secrets.stripeSecretKey();
  if (!key) throw new Error("Stripe not configured");
  const body = new URLSearchParams({
    mode: "payment",
    "line_items[0][price]": opts.priceId,
    "line_items[0][quantity]": "1",
    customer_email: opts.email,
    client_reference_id: opts.userId,
    "metadata[listing]": opts.listingSlug,
    "metadata[mc_username]": opts.mcUsername,
    "metadata[user_id]": opts.userId,
    success_url: `${opts.siteUrl.replace(/\/$/, "")}/store?checkout=success`,
    cancel_url: `${opts.siteUrl.replace(/\/$/, "")}/store?checkout=cancelled`,
  });
  const res = await fetch("https://api.stripe.com/v1/checkout/sessions", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/x-www-form-urlencoded" },
    body,
    signal: AbortSignal.timeout(10_000),
  });
  const json = (await res.json()) as { id?: string; url?: string; error?: { message?: string } };
  if (!res.ok || !json.id || !json.url) throw new Error(json.error?.message ?? `Stripe error ${res.status}`);
  return { id: json.id, url: json.url };
}

/** Verify a Stripe-Signature header (v1 scheme, 5 minute tolerance). */
export function verifyStripeSignature(
  payload: string,
  header: string | null,
  secret: string,
  nowSeconds = Math.floor(Date.now() / 1000),
  toleranceSeconds = 300,
): boolean {
  if (!header) return false;
  const parts = Object.fromEntries(
    header.split(",").map((kv) => {
      const i = kv.indexOf("=");
      return [kv.slice(0, i).trim(), kv.slice(i + 1).trim()];
    }),
  ) as Record<string, string>;
  const t = Number(parts.t);
  const sigs = header
    .split(",")
    .filter((kv) => kv.trim().startsWith("v1="))
    .map((kv) => kv.trim().slice(3));
  if (!Number.isFinite(t) || sigs.length === 0) return false;
  if (Math.abs(nowSeconds - t) > toleranceSeconds) return false;
  const expected = createHmac("sha256", secret).update(`${t}.${payload}`).digest("hex");
  return sigs.some((s) => safeEqual(s, expected));
}

export function formatPrice(cents: number, currency: string): string {
  try {
    return new Intl.NumberFormat("en-US", { style: "currency", currency }).format(cents / 100);
  } catch {
    return `${(cents / 100).toFixed(2)} ${currency}`;
  }
}
