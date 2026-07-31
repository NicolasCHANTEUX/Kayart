import Link from "next/link";
import { AdminOrderActions } from "@/components/admin/admin-order-actions";
import { AdminOrderCreator } from "@/components/admin/admin-order-creator";
import { formatMoneyCents } from "@/lib/format";
import {
  isCatalogPersistenceEnabled,
  listAdminOrders,
  listAdminProducts
} from "@/server/catalog/catalog.service";
import type { AdminOrder, OrderStatus, PaymentStatus } from "@/types/orders";

export const metadata = {
  title: "Admin - Commandes"
};

type AdminOrdersPageProps = {
  searchParams?: Promise<{
    created?: string;
    error?: string;
    updated?: string;
  }>;
};

const orderStatusLabels: Record<OrderStatus, string> = {
  pending: "En attente",
  paid: "Payée",
  preparing: "Préparation",
  ready: "Prête",
  shipped: "Expédiée",
  completed: "Terminée",
  cancelled: "Annulée",
  refunded: "Remboursée"
};

const paymentStatusLabels: Record<PaymentStatus, string> = {
  pending: "Impayée",
  paid: "Payée",
  failed: "Échec",
  cancelled: "Annulé",
  refunded: "Remboursé"
};

export default async function AdminOrdersPage({ searchParams }: AdminOrdersPageProps) {
  const [products, orders] = await Promise.all([listAdminProducts(), listAdminOrders()]);
  const params = searchParams ? await searchParams : {};
  const canPersist = isCatalogPersistenceEnabled();

  return (
    <section className="section admin-page">
      <div className="container">
        <div className="section__header">
          <div>
            <div className="eyebrow">Administration</div>
            <h1 className="page-title">Commandes</h1>
          </div>
          <div className="header-actions">
            <Link className="button button--ghost" href="/admin">
              Retour admin
            </Link>
            <AdminOrderCreator canPersist={canPersist} products={products} />
          </div>
        </div>

        <div className="admin-panel">
          {params.error ? <p className="form-notice form-notice--error">{params.error}</p> : null}
          {params.created === "1" ? (
            <p className="form-notice form-notice--success">Commande factice créée. Aucun stock modifié.</p>
          ) : null}
          {params.updated === "paid" ? (
            <p className="form-notice form-notice--success">Paiement marqué comme payé.</p>
          ) : null}
          {params.updated === "deleted" ? (
            <p className="form-notice form-notice--success">Commande supprimée.</p>
          ) : null}

          <div className="admin-panel__header">
            <div>
              <strong>Commandes factices</strong>
              <p>Créez une commande de test pour préparer ou simuler un panier sans modifier le stock.</p>
            </div>
          </div>

          {products.length === 0 ? (
            <p className="admin-panel__note">
              Aucun produit n'est disponible pour créer une commande factice.
            </p>
          ) : null}

          <div className="table-wrap">
            <table className="data-table admin-orders-table">
              <thead>
                <tr>
                  <th>Commande</th>
                  <th>Produits</th>
                  <th>Total</th>
                  <th>Statut</th>
                  <th>Paiement</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => (
                  <tr key={order.id}>
                    <td>
                      <div className="order-number-cell">
                        <strong>{order.orderNumber}</strong>
                        <span>{formatOrderDate(order.createdAt)}</span>
                      </div>
                    </td>
                    <td>
                      <OrderItemsList order={order} />
                    </td>
                    <td>
                      <strong>{formatMoneyCents(order.totalCents)}</strong>
                    </td>
                    <td>
                      <span className={`table-badge table-badge--order-${order.isFictive ? "fictive" : order.status}`}>
                        {order.isFictive ? "Factice" : orderStatusLabels[order.status]}
                      </span>
                    </td>
                    <td>
                      <span className={`table-badge table-badge--payment-${order.paymentStatus}`}>
                        {paymentStatusLabels[order.paymentStatus]}
                      </span>
                    </td>
                    <td>
                      <AdminOrderActions canPersist={canPersist} order={order} />
                    </td>
                  </tr>
                ))}

                {orders.length === 0 ? (
                  <tr>
                    <td colSpan={6}>Aucune commande enregistrée pour le moment.</td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>

          {!canPersist ? (
            <p className="admin-panel__note">
              La création de commande sera active après passage en mode Prisma.
            </p>
          ) : null}
        </div>
      </div>
    </section>
  );
}

function OrderItemsList({ order }: { order: AdminOrder }) {
  return (
    <ul className="order-items-list">
      {order.items.map((item) => (
        <li key={item.id}>
          <strong>{item.productName}</strong>
          <span>
            {item.quantity} × {formatMoneyCents(item.unitPriceCents)}
          </span>
        </li>
      ))}
    </ul>
  );
}

function formatOrderDate(value: string) {
  return new Intl.DateTimeFormat("fr-FR", {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(new Date(value));
}
