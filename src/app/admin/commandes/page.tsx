import Link from "next/link";
import { AdminOrderCreator } from "@/components/admin/admin-order-creator";
import { formatMoneyCents } from "@/lib/format";
import {
  isCatalogPersistenceEnabled,
  listAdminOrders,
  listAdminProducts
} from "@/server/catalog/catalog.service";
import type { Product } from "@/types/catalog";
import type { AdminOrder, OrderStatus, PaymentStatus } from "@/types/orders";

export const metadata = {
  title: "Admin - Commandes"
};

type AdminOrdersPageProps = {
  searchParams?: Promise<{
    created?: string;
    error?: string;
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
  pending: "Paiement attendu",
  paid: "Payée",
  failed: "Échec",
  cancelled: "Annulé",
  refunded: "Remboursé"
};

export default async function AdminOrdersPage({ searchParams }: AdminOrdersPageProps) {
  const [products, orders] = await Promise.all([listAdminProducts(), listAdminOrders()]);
  const params = searchParams ? await searchParams : {};
  const canPersist = isCatalogPersistenceEnabled();
  const orderableProducts = products.filter(isDirectSaleProduct);

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
            <AdminOrderCreator canPersist={canPersist} products={orderableProducts} />
          </div>
        </div>

        <div className="admin-panel">
          {params.error ? <p className="form-notice form-notice--error">{params.error}</p> : null}
          {params.created === "1" ? (
            <p className="form-notice form-notice--success">Commande créée et stock mis à jour.</p>
          ) : null}

          <div className="admin-panel__header">
            <div>
              <strong>Ventes directes</strong>
              <p>
                Créez une commande lorsque la vente se fait hors site, puis gardez une trace claire
                dans l'historique.
              </p>
            </div>
          </div>

          {orderableProducts.length === 0 ? (
            <p className="admin-panel__note">
              Aucun produit avec stock suivi n'est disponible pour créer une vente directe.
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
                      <span className={`table-badge table-badge--order-${order.status}`}>
                        {orderStatusLabels[order.status]}
                      </span>
                    </td>
                    <td>
                      <span className={`table-badge table-badge--payment-${order.paymentStatus}`}>
                        {paymentStatusLabels[order.paymentStatus]}
                      </span>
                    </td>
                  </tr>
                ))}

                {orders.length === 0 ? (
                  <tr>
                    <td colSpan={5}>Aucune commande enregistrée pour le moment.</td>
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

function isDirectSaleProduct(product: Product) {
  return (
    product.condition !== "service" &&
    product.stockQuantity !== null &&
    product.availability !== "archived" &&
    product.availability !== "draft"
  );
}

function formatOrderDate(value: string) {
  return new Intl.DateTimeFormat("fr-FR", {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(new Date(value));
}
