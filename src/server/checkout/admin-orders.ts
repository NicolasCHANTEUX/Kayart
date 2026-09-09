import { requireAdminSession } from "@/server/auth/session";
import { checkoutTransaction } from "@/server/checkout/transactions";

export async function advanceTestOrder(id: string, expectedStatus: string) {
  await requireAdminSession();
  if (!/^[0-9a-f-]{36}$/i.test(id)) throw new Error("Commande invalide.");
  return checkoutTransaction(async tx => {
    const order = await tx.order.findUnique({ where: { id } });
    if (!order?.isTest || order.paymentStatus !== "paid" || !order.stripeCheckoutSessionId || order.status !== expectedStatus) throw new Error("Cette commande ne peut pas avancer.");
    const next = order.status === "paid" ? "preparing"
      : order.status === "preparing" ? (order.fulfillmentMethod === "pickup" ? "ready" : order.fulfillmentMethod === "shipping" ? "shipped" : null)
      : ["ready", "shipped"].includes(order.status) ? "completed" : null;
    if (!next) throw new Error("Transition indisponible.");
    return tx.order.update({ where: { id }, data: { status: next, updatedAt: new Date() } });
  });
}
