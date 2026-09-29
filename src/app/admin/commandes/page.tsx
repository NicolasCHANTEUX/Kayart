import Link from "next/link";
import { AdminOrderActions } from "@/components/admin/admin-order-actions";
import { AdminOrderCreator } from "@/components/admin/admin-order-creator";
import { Pagination } from "@/components/catalog/pagination";
import { formatMoneyCents } from "@/lib/format";
import {
  adminOrderItemsLabel,
  adminOrderKindLabel,
  formatAdminOrderDate,
  orderStatusLabels,
  paymentStatusLabels
} from "@/lib/order-display";
import {
  isCatalogPersistenceEnabled,
  listAdminProducts
} from "@/server/catalog/catalog.service";
import { searchAdminOrders } from "@/server/catalog/search";

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
            <Link className="button button--ghost" href="/admin">Retour admin</Link>
            <AdminOrderCreator canPersist={canPersist} products={products} />
          </div>
        </div>

        <div className="admin-panel">
          {params.error ? <p className="form-notice form-notice--error">{params.error}</p> : null}
          {params.created === "1" ? <p className="form-notice form-notice--success">Vente manuelle enregistrée.</p> : null}
          {params.updated === "paid" ? <p className="form-notice form-notice--success">Paiement marqué comme payé.</p> : null}
          {params.updated === "deleted" ? <p className="form-notice form-notice--success">Vente annulée.</p> : null}
          {params.updated === "fulfillment" ? <p className="form-notice form-notice--success">Suivi de la commande mis à jour.</p> : null}

          <div className="admin-panel__header">
            <div>
              <strong>Suivi des commandes</strong>
              <p>La liste présente l’essentiel. Ouvrez une commande pour consulter ses coordonnées, ses lignes, son paiement, sa livraison et sa facturation.</p>
            </div>
          </div>

          {canPersist && products.length === 0 ? <p className="admin-panel__note">Aucun produit n’est disponible pour créer une vente manuelle.</p> : null}

          <form action="/admin/commandes" className="catalog-filters" role="search">
            <label>Commande, nom ou email<input name="q" type="search" maxLength={120} defaultValue={result.filters.q} /></label>
            <label>Statut<select name="status" defaultValue={result.filters.status}><option value="">Tous</option>{Object.entries(orderStatusLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
            <button className="button button--primary">Rechercher</button>
            <Link href="/admin/commandes">Réinitialiser</Link>
          </form>
          <p>{result.total} commande(s) trouvée(s)</p>
          <Pagination path="/admin/commandes" {...result} />
          <div className="table-wrap">
            <table className="data-table admin-orders-table">
              <thead><tr><th>Commande</th><th>Client</th><th>Articles</th><th>Total</th><th>Suivi</th><th>Actions</th></tr></thead>
              <tbody>
                {orders.map((order) => <tr key={order.id}>
                  <td data-label="Commande">
                    <div className="order-number-cell">
                      <Link className="order-number-link" href={`/admin/commandes/${order.id}`}>{order.orderNumber}</Link>
                      <span>{formatAdminOrderDate(order.createdAt)}</span>
                      {order.isTest || order.isManual ? <span>{adminOrderKindLabel(order)}</span> : null}
                    </div>
                  </td>
                  <td data-label="Client"><div className="order-client-cell"><strong>{order.customerName || "Client non renseigné"}</strong><span>{order.guestEmail}</span></div></td>
                  <td data-label="Articles"><span className="order-items-summary">{adminOrderItemsLabel(order)}</span></td>
                  <td data-label="Total"><strong>{formatMoneyCents(order.totalCents)}</strong></td>
                  <td data-label="Suivi"><div className="order-status-stack"><span className={`table-badge table-badge--order-${order.status}`}>{orderStatusLabels[order.status]}</span><span className={`table-badge table-badge--payment-${order.paymentStatus}`}>{paymentStatusLabels[order.paymentStatus]}</span></div></td>
                  <td data-label="Actions"><AdminOrderActions canPersist={canPersist} order={order} showOpenLink /></td>
                </tr>)}
                {orders.length === 0 ? <tr><td colSpan={6}>Aucune commande enregistrée pour le moment.</td></tr> : null}
              </tbody>
            </table>
          </div>

          {!canPersist ? <p className="admin-panel__note">L’enregistrement de ventes manuelles est désactivé. Le suivi des commandes Stripe est indépendant de cette fonctionnalité.</p> : null}
        </div>
      </div>
    </section>
  );
}
