import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { secrets } from "@/lib/config";
import { verifyStripeSignature } from "@/lib/payments";
import { audit, logActivity } from "@/lib/audit";

export const dynamic = "force-dynamic";

/**
 * Stripe webhook: marks purchases PAID / FAILED. In-game delivery is NOT done
 * here — the game server should poll undelivered PAID purchases (see README → Integrations).
 */
export async function POST(req: NextRequest) {
  const secret = secrets.stripeWebhookSecret();
  if (!secret) return NextResponse.json({ error: "Stripe webhook not configured" }, { status: 503 });
  const payload = await req.text();
  if (!verifyStripeSignature(payload, req.headers.get("stripe-signature"), secret)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }
  const event = JSON.parse(payload) as { type: string; data: { object: { id: string; payment_status?: string } } };
  const obj = event.data.object;
  if (event.type === "checkout.session.completed" || event.type === "checkout.session.async_payment_succeeded") {
    if (obj.payment_status === "paid" || event.type === "checkout.session.async_payment_succeeded") {
      const p = await prisma.purchase.updateMany({ where: { providerRef: obj.id }, data: { status: "PAID" } });
      if (p.count) {
        const row = await prisma.purchase.findUnique({ where: { providerRef: obj.id } });
        if (row?.userId) await logActivity(row.userId, "purchase", "Store purchase completed");
        await audit(null, "store.purchase_paid", obj.id);
      }
    }
  } else if (event.type === "checkout.session.expired" || event.type === "checkout.session.async_payment_failed") {
    await prisma.purchase.updateMany({ where: { providerRef: obj.id, status: "PENDING" }, data: { status: "FAILED" } });
  }
  return NextResponse.json({ received: true });
}
