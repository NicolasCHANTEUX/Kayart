import type Stripe from "stripe";
import type { Prisma } from "@prisma/client";
import { checkoutTransaction } from "@/server/checkout/transactions";
import { getPrismaClient } from "@/server/db/prisma";

async function releaseHolds(tx: Prisma.TransactionClient, orderId: string) {
  const holds = await tx.checkoutHold.findMany({ where: { orderId, status: "active" } });
  for (const hold of holds) {
    const changed = await tx.checkoutHold.updateMany({ where: { id: hold.id, status: "active" }, data: { status: "released" } });
    if (changed.count) await tx.product.update({ where: { id: hold.productId }, data: { stockQuantity: { increment: hold.quantity }, updatedAt: new Date() } });
  }
}
export async function releaseRejectedCheckout(orderId: string) {
  await checkoutTransaction(async tx => {
    const order = await tx.order.findUnique({ where: { id: orderId } });
    if (!order || order.paymentStatus !== "pending" || order.stripeCheckoutSessionId) return;
    await releaseHolds(tx, orderId);
    await tx.order.update({ where: { id: orderId }, data: { status: "cancelled", paymentStatus: "cancelled", updatedAt: new Date() } });
  });
}
export async function settleVerifiedSession(session: Stripe.Checkout.Session, eventId: string, outcome: "paid" | "expired" | "failed") {
  if (session.livemode || session.mode !== "payment" || !session.metadata?.orderId || !session.metadata.fingerprint) throw new Error("Unexpected Stripe session.");
  if (outcome === "paid" && session.payment_status !== "paid") return;
  if (outcome === "expired" && session.status !== "expired") throw new Error("Stripe expiration is not confirmed.");
  try {
    await checkoutTransaction(async tx => {
      if (await tx.stripeEvent.findUnique({ where: { id: eventId } })) return;
      const order = await tx.order.findUnique({ where: { id: session.metadata!.orderId }, include: { checkoutHolds: true } });
      if (!order || !order.isTest || order.checkoutFingerprint !== session.metadata!.fingerprint || (order.stripeCheckoutSessionId && order.stripeCheckoutSessionId !== session.id) || session.currency !== "eur" || session.amount_total !== order.totalCents) throw new Error("Stripe order or amount mismatch.");
      await tx.stripeEvent.create({ data: { id: eventId } });
      if (order.paymentStatus === "paid") return;
      if (outcome === "paid") {
        if (!order.checkoutHolds.length || order.checkoutHolds.some(hold => hold.status !== "active")) throw new Error("Paid session needs manual stock reconciliation.");
        await tx.checkoutHold.updateMany({ where: { orderId: order.id, status: "active" }, data: { status: "committed" } });
        await tx.order.update({ where: { id: order.id }, data: { status: "paid", paymentStatus: "paid", paidAt: new Date(), stripeCheckoutSessionId: session.id, stripePaymentIntentId: typeof session.payment_intent === "string" ? session.payment_intent : session.payment_intent?.id ?? null, updatedAt: new Date() } });
      } else {
        await releaseHolds(tx, order.id);
        await tx.order.update({ where: { id: order.id }, data: { status: "cancelled", paymentStatus: outcome === "failed" ? "failed" : "cancelled", stripeCheckoutSessionId: session.id, updatedAt: new Date() } });
      }
    });
  } catch (error) {
    if (typeof error === "object" && error && "code" in error && error.code === "P2002" && await getPrismaClient().stripeEvent.findUnique({ where: { id: eventId } })) return;
    throw error;
  }
}
