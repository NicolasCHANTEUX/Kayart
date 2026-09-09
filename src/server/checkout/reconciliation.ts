import { getPrismaClient } from "@/server/db/prisma";
import { getTestStripe } from "@/server/checkout/stripe";
import { settleVerifiedSession } from "@/server/checkout/settlement";
import { checkoutTransaction } from "@/server/checkout/transactions";
export async function reconcileCheckout(checkoutKey: string, cancel = false) {
  const findOrder = (db: Pick<ReturnType<typeof getPrismaClient>, "order">) => db.order.findUnique({ where: { checkoutKey }, select: { stripeCheckoutSessionId: true, isTest: true, paymentStatus: true } });
  const order = cancel ? await checkoutTransaction(async tx => {
    const found = await findOrder(tx);
    if (!found) {
      const id = `cancel-before-create:${checkoutKey}`;
      if (!await tx.stripeEvent.findUnique({ where: { id } })) await tx.stripeEvent.create({ data: { id } });
    }
    return found;
  }) : await findOrder(getPrismaClient());
  if (!order) return { status: "absent" };
  if (!order.isTest) throw new Error("Unknown checkout.");
  if (order.paymentStatus !== "pending") return { status: order.paymentStatus };
  if (!order.stripeCheckoutSessionId) return { status: "pending", needsReview: true };
  const stripe = getTestStripe();
  let session = await stripe.checkout.sessions.retrieve(order.stripeCheckoutSessionId);
  if (session.livemode) throw new Error("Unexpected live session.");
  if (cancel && session.status === "open") session = await stripe.checkout.sessions.expire(session.id);
  if (session.payment_status === "paid") {
    await settleVerifiedSession(session, `reconcile:${session.id}:paid`, "paid");
    return { status: "paid" };
  }
  if (session.status === "expired") {
    await settleVerifiedSession(session, `reconcile:${session.id}:expired`, "expired");
    return { status: "cancelled" };
  }
  return { status: "pending" };
}
