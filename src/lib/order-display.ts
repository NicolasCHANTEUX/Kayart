import type { AdminOrder, OrderStatus, PaymentStatus } from "@/types/orders";

export const orderStatusLabels: Record<OrderStatus, string> = {
  pending: "En attente",
  paid: "Payée",
  preparing: "Préparation",
  ready: "Prête",
  shipped: "Expédiée",
  completed: "Terminée",
  cancelled: "Annulée",
  refunded: "Remboursée"
};

export const paymentStatusLabels: Record<PaymentStatus, string> = {
  pending: "Impayée",
  paid: "Payée",
  failed: "Échec",
  cancelled: "Annulé",
  refunded: "Remboursé"
};

export function formatAdminOrderDate(value: string, long = false) {
  return new Intl.DateTimeFormat("fr-FR", {
    dateStyle: long ? "long" : "medium",
    timeStyle: "short",
    timeZone: "Europe/Paris"
  }).format(new Date(value));
}

export function fulfillmentMethodLabel(method?: string | null) {
  if (method === "pickup") return "Retrait à l’atelier sur rendez-vous";
  if (method === "shipping") return "Livraison";
  return "Non renseigné";
}

export function adminOrderItemsLabel(order: Pick<AdminOrder, "items">) {
  const quantity = order.items.reduce((total, item) => total + item.quantity, 0);
  return `${quantity} article${quantity > 1 ? "s" : ""}`;
}

export function adminOrderKindLabel(order: Pick<AdminOrder, "isManual" | "isTest">) {
  if (order.isTest) return "Stripe TEST";
  if (order.isManual) return "Vente manuelle";
  return "Commande en ligne";
}

export function adminPaymentMethodLabel(order: Pick<AdminOrder, "isManual" | "isTest"> & { stripeCheckoutSessionId?: string | null }) {
  if (order.stripeCheckoutSessionId || order.isTest) return order.isTest ? "Stripe (mode test)" : "Stripe";
  if (order.isManual) return "Paiement hors ligne — moyen non renseigné";
  return "Non renseigné";
}

const historyActionLabels: Record<string, string> = {
  "order.created": "Commande créée",
  "order.paid": "Paiement confirmé",
  "order.payment_paid": "Paiement confirmé",
  "order.status_changed": "Statut de la commande modifié",
  "invoice.issued": "Facture émise",
  "invoice.archived": "Facture archivée",
  "invoice.archive_failed": "Archivage de la facture en échec"
};

export function adminOrderHistoryActionLabel(action: string) {
  const known = historyActionLabels[action];
  if (known) return known;
  const readable = action.replace(/[._-]+/g, " ").trim();
  return readable ? readable.charAt(0).toLocaleUpperCase("fr-FR") + readable.slice(1) : "Mise à jour";
}
