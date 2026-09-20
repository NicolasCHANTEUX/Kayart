type OrderIdentity = {
  orderNumber: string;
  customerNote: string | null;
  stripeCheckoutSessionId: string | null;
  stripePaymentIntentId: string | null;
};

// Manual sales have both server-generated markers. Neither the note alone
// nor the order number prefix establishes that an order was created manually.
export function isManualAdminOrder(order: OrderIdentity): boolean {
  return /^MAN-\d{8}-[A-Z0-9]+$/.test(order.orderNumber)
    && (order.customerNote === "Vente manuelle admin" || order.customerNote?.startsWith("Vente manuelle admin - ") === true)
    && order.stripeCheckoutSessionId === null && order.stripePaymentIntentId === null;
}

export function requireManualOrders() {
  if (process.env.KAYART_ENABLE_MANUAL_ORDERS !== "true") {
    throw new Error("L’enregistrement de ventes manuelles est désactivé.");
  }
}
