import { createHmac } from "node:crypto";
import { describe, expect, it } from "vitest";
import { formatPrice, getPaymentState, verifyStripeSignature } from "@/lib/payments";

const listing = { slug: "vip", tebexUrl: null as string | null, stripePriceId: null as string | null };

describe("getPaymentState", () => {
  it("is disabled when no provider is configured", () => {
    expect(getPaymentState(listing, "none", false)).toEqual({ enabled: false, provider: "none", reason: "Payments not configured" });
  });
  it("requires a Tebex link per listing", () => {
    expect(getPaymentState(listing, "tebex", false).enabled).toBe(false);
    expect(getPaymentState({ ...listing, tebexUrl: "https://x.tebex.io/p/1" }, "tebex", false)).toMatchObject({ enabled: true, href: "https://x.tebex.io/p/1" });
  });
  it("requires both a Stripe key and a price id", () => {
    const withPrice = { ...listing, stripePriceId: "price_123" };
    expect(getPaymentState(withPrice, "stripe", false)).toMatchObject({ enabled: false, reason: "Payments not configured" });
    expect(getPaymentState(listing, "stripe", true).enabled).toBe(false);
    expect(getPaymentState(withPrice, "stripe", true)).toMatchObject({ enabled: true, action: "/api/checkout" });
  });
});

describe("verifyStripeSignature", () => {
  const secret = "whsec_test";
  const payload = '{"id":"evt_1"}';
  const t = 1_700_000_000;
  const sig = createHmac("sha256", secret).update(`${t}.${payload}`).digest("hex");
  it("accepts a valid signature", () => {
    expect(verifyStripeSignature(payload, `t=${t},v1=${sig}`, secret, t + 10)).toBe(true);
  });
  it("rejects tampered payloads, wrong secrets and stale timestamps", () => {
    expect(verifyStripeSignature(payload + " ", `t=${t},v1=${sig}`, secret, t)).toBe(false);
    expect(verifyStripeSignature(payload, `t=${t},v1=${sig}`, "whsec_other", t)).toBe(false);
    expect(verifyStripeSignature(payload, `t=${t},v1=${sig}`, secret, t + 3600)).toBe(false);
    expect(verifyStripeSignature(payload, null, secret, t)).toBe(false);
  });
});

describe("formatPrice", () => {
  it("formats currency", () => {
    expect(formatPrice(499, "USD")).toBe("$4.99");
  });
});
