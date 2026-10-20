import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/session";
import { getConfig } from "@/lib/config";
import { createStripeCheckout, getPaymentState } from "@/lib/payments";
import { LIMITS, rateLimit } from "@/lib/rate-limit";
import { ipFromHeaders } from "@/lib/request";
import { audit } from "@/lib/audit";

export const dynamic = "force-dynamic";

function back(req: NextRequest, status: string) {
  return NextResponse.redirect(new URL(`/store?checkout=${status}`, req.url), 303);
}

/** Creates a Stripe Checkout Session server-side. Only active when PAYMENT_PROVIDER=stripe. */
export async function POST(req: NextRequest) {
  const origin = req.headers.get("origin");
  if (origin && origin !== new URL(req.url).origin && origin !== new URL(getConfig().siteUrl).origin) {
    return NextResponse.json({ error: "Bad origin" }, { status: 403 });
  }
  const rl = await rateLimit(`checkout:${ipFromHeaders(req.headers)}`, LIMITS.checkout.limit, LIMITS.checkout.windowMs);
  if (!rl.ok) return back(req, "limited");

  const user = await getCurrentUser();
  if (!user) return NextResponse.redirect(new URL("/login?next=/store", req.url), 303);
  if (!user.mcUsername) return back(req, "link");

  const form = await req.formData().catch(() => null);
  const slug = String(form?.get("listing") ?? "");
  const listing = /^[a-z0-9-]{2,40}$/.test(slug)
    ? await prisma.storeListing.findFirst({ where: { slug, active: true } })
    : null;
  if (!listing) return back(req, "unavailable");

  const state = getPaymentState(listing);
  if (!state.enabled || state.provider !== "stripe" || !listing.stripePriceId) return back(req, "unavailable");

  try {
    const session = await createStripeCheckout({
      priceId: listing.stripePriceId,
      listingSlug: listing.slug,
      userId: user.id,
      mcUsername: user.mcUsername,
      email: user.email,
      siteUrl: getConfig().siteUrl,
    });
    await prisma.purchase.create({
      data: {
        userId: user.id, listingId: listing.id, provider: "stripe", providerRef: session.id,
        status: "PENDING", amountCents: listing.priceCents, currency: listing.currency, mcUsername: user.mcUsername,
      },
    });
    await audit(user.id, "store.checkout_started", listing.slug, { session: session.id });
    return NextResponse.redirect(session.url, 303);
  } catch (err) {
    console.error("stripe checkout failed", err);
    return back(req, "error");
  }
}
