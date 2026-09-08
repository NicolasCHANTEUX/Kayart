type OrderIdentity = {
  orderNumber: string;
  customerNote: string | null;
  stripeCheckoutSessionId: string | null;
  stripePaymentIntentId: string | null;
};

// Legacy simulations have both server-generated markers. Neither a note alone
// nor the historical ADM prefix establishes that an order is a simulation.
export function isFictiveAdminOrder(order: OrderIdentity): boolean {
  return /^TEST-\d{8}-[A-Z0-9]+$/.test(order.orderNumber)
    && (order.customerNote === "Commande factice admin" || order.customerNote?.startsWith("Commande factice admin - ") === true)
    && order.stripeCheckoutSessionId === null && order.stripePaymentIntentId === null;
}

export function requireOrderSimulator() {
  if (process.env.KAYART_ENABLE_ORDER_SIMULATOR !== "true") {
    throw new Error("Le simulateur de commandes est désactivé. Il ne doit être activé que sur une base de test.");
  }
}
