import Link from "next/link";
import { AdminOrderActions } from "@/components/admin/admin-order-actions";
import { AdminOrderCreator } from "@/components/admin/admin-order-creator";
import { formatMoneyCents } from "@/lib/format";
import {
  isCatalogPersistenceEnabled,
  listAdminProducts
} from "@/server/catalog/catalog.service";
import type { AdminOrder, OrderStatus, PaymentStatus } from "@/types/orders";
import { searchAdminOrders } from "@/server/catalog/search";
import { Pagination } from "@/components/catalog/pagination";

export const metadata = {
  title: "Admin - Commandes"
};

type AdminOrdersPageProps = {
  searchParams?: Promise<{
    created?: string;
    error?: string;
    updated?: string;
    q?: string;
    status?: string;
    page?: string;
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
  const params = searchParams ? await searchParams : {};
  const canPersist = isCatalogPersistenceEnabled() && process.env.KAYART_ENABLE_MANUAL_ORDERS === "true";
  const [products, result] = await Promise.all([canPersist ? listAdminProducts() : Promise.resolve([]), searchAdminOrders(params)]);
  const { orders } = result;

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
            <p className="form-notice form-notice--success">Vente manuelle enregistrée.</p>
          ) : null}
          {params.updated === "paid" ? (
            <p className="form-notice form-notice--success">Paiement marqué comme payé.</p>
          ) : null}
          {params.updated === "deleted" ? (
            <p className="form-notice form-notice--success">Vente annulée.</p>
          ) : null}

          <div className="admin-panel__header">
            <div>
              <strong>Suivi des commandes</strong>
              <p>Les commandes Stripe de test réservent le stock. Leur paiement est confirmé automatiquement par Stripe. Les ventes manuelles sont indépendantes du stock et de la disponibilité du site ; elles doivent être marquées payées une fois le règlement reçu.</p>
            </div>
          </div>

          {canPersist && products.length === 0 ? (
            <p className="admin-panel__note">
              Aucun produit n'est disponible pour créer une vente manuelle.
            </p>
          ) : null}

          <form action="/admin/commandes" className="catalog-filters" role="search"><label>Commande, nom ou email<input name="q" type="search" maxLength={120} defaultValue={result.filters.q} /></label><label>Statut<select name="status" defaultValue={result.filters.status}><option value="">Tous</option>{Object.entries(orderStatusLabels).map(([value,label]) => <option key={value} value={value}>{label}</option>)}</select></label><button className="button button--primary">Rechercher</button><Link href="/admin/commandes">Réinitialiser</Link></form>
          <p>{result.total} commande(s) trouvée(s)</p>
          <Pagination path="/admin/commandes" {...result} />
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
                    <td data-label="Commande">
                      <div className="order-number-cell">
                        <strong>{order.orderNumber}</strong>
                        <span>{formatOrderDate(order.createdAt)}</span>
                        {order.isTest ? <span>Stripe TEST — aucun achat réel</span> : null}
                        <span>{order.customerName} {order.guestEmail}</span>
                        <span>{order.fulfillmentMethod === "pickup" ? "Retrait atelier sur rendez-vous" : order.fulfillmentMethod === "shipping" ? "Livraison" : ""}</span>
                        {order.shippingAddressLines?.map((line, index) => <span key={index}>{line}</span>)}
                      </div>
                    </td>
                    <td data-label="Produits">
                      <OrderItemsList order={order} />
                    </td>
                    <td data-label="Total">
                      <strong>{formatMoneyCents(order.totalCents)}</strong>
                    </td>
                    <td data-label="Statut">
                      <span className={`table-badge table-badge--order-${order.isManual ? "manual" : order.status}`}>
                        {order.isManual ? "Vente manuelle" : orderStatusLabels[order.status]}
                      </span>
                    </td>
                    <td data-label="Paiement">
                      <span className={`table-badge table-badge--payment-${order.paymentStatus}`}>
                        {paymentStatusLabels[order.paymentStatus]}
                      </span>
                    </td>
                    <td data-label="Actions">
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
              L'enregistrement de ventes manuelles est désactivé. Le suivi des commandes Stripe est indépendant de cette fonctionnalité.
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
