import Link from "next/link";
import { notFound } from "next/navigation";
import { issueInvoiceAction } from "@/app/admin/commandes/actions";
import { AdminOrderActions } from "@/components/admin/admin-order-actions";
import { formatMoneyCents } from "@/lib/format";
import {
  adminOrderHistoryActionLabel,
  adminOrderKindLabel,
  adminPaymentMethodLabel,
  formatAdminOrderDate,
  fulfillmentMethodLabel,
  orderStatusLabels,
  paymentStatusLabels
} from "@/lib/order-display";
import { isCatalogPersistenceEnabled } from "@/server/catalog/catalog.service";
import { getAdminOrderDetail } from "@/server/checkout/admin-orders";
import type { AdminOrderDetail, AdminOrderHistoryEntry, OrderStatus } from "@/types/orders";

export const metadata = {
  title: "Admin - Détail de la commande"
};

type AdminOrderDetailPageProps = {
  params: Promise<{ id: string }>;
  searchParams?: Promise<{
    error?: string;
    issued?: string;
    updated?: string;
  }>;
};

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default async function AdminOrderDetailPage({ params, searchParams }: AdminOrderDetailPageProps) {
  const { id } = await params;
  if (!uuidPattern.test(id)) notFound();

  const [order, query]: [AdminOrderDetail | null, { error?: string; issued?: string; updated?: string }] = await Promise.all([
    getAdminOrderDetail(id),
    searchParams ? searchParams : Promise.resolve({})
  ]);
  if (!order) notFound();

  const canPersist = isCatalogPersistenceEnabled() && process.env.KAYART_ENABLE_MANUAL_ORDERS === "true";

  return (
    <section className="section admin-page admin-order-detail">
      <div className="container">
        <div className="section__header admin-order-detail__page-header">
          <div className="admin-order-detail__heading">
            <div className="eyebrow">Administration · Commandes</div>
            <h1 className="page-title">Commande {order.orderNumber}</h1>
            <div className="admin-order-detail__heading-meta">
              <time dateTime={order.createdAt}>{formatAdminOrderDate(order.createdAt, true)}</time>
              <span>{adminOrderKindLabel(order)}</span>
            </div>
            <div className="admin-order-detail__badges" aria-label="État de la commande">
              <span className={`table-badge table-badge--order-${order.status}`}>{orderStatusLabels[order.status]}</span>
              <span className={`table-badge table-badge--payment-${order.paymentStatus}`}>{paymentStatusLabels[order.paymentStatus]}</span>
            </div>
          </div>
          <div className="header-actions">
            <Link className="button button--ghost" href="/admin/commandes">Retour aux commandes</Link>
          </div>
        </div>

        {query.error ? <p className="form-notice form-notice--error" role="alert">{query.error}</p> : null}
        {query.issued === "1" ? <p className="form-notice form-notice--success" role="status">La facture a été émise.</p> : null}
        {query.updated === "fulfillment" ? <p className="form-notice form-notice--success" role="status">Le suivi de la commande a été mis à jour.</p> : null}
        {order.isTest ? <div className="admin-order-detail__warning" role="note"><strong>Commande Stripe TEST</strong><span>Aucun achat réel ni aucune facture comptable ne peut être associé à cette commande.</span></div> : null}

        <div className="admin-order-detail__layout">
          <div className="admin-order-detail__main">
            <OrderItemsPanel order={order} />
            <PaymentPanel order={order} />
            <HistoryPanel order={order} />
          </div>

          <aside className="admin-order-detail__sidebar" aria-label="Informations complémentaires">
            <CustomerPanel order={order} />
            <DeliveryPanel order={order} />
            <InvoicePanel order={order} />
            <article className="admin-panel admin-order-detail__panel">
              <div className="admin-panel__header admin-order-detail__panel-header"><h2>Actions</h2></div>
              <div className="admin-order-detail__panel-body">
                <AdminOrderActions canPersist={canPersist} order={order} />
              </div>
            </article>
          </aside>
        </div>
      </div>
    </section>
  );
}

function OrderItemsPanel({ order }: { order: AdminOrderDetail }) {
  return <article className="admin-panel admin-order-detail__panel">
    <div className="admin-panel__header admin-order-detail__panel-header"><h2>Produits</h2><span>{order.items.length} ligne{order.items.length > 1 ? "s" : ""}</span></div>
    <div className="table-wrap">
      <table className="data-table admin-order-detail__items-table">
        <thead><tr><th>Référence</th><th>Produit</th><th>Qté</th><th>Prix unitaire</th><th>Total</th></tr></thead>
        <tbody>{order.items.map((item) => <tr key={item.id}>
          <td data-label="Référence"><span className="admin-order-detail__sku">{item.productSku || "—"}</span></td>
          <td data-label="Produit"><strong>{item.productName}</strong></td>
          <td data-label="Quantité">{item.quantity}</td>
          <td data-label="Prix unitaire">{formatMoneyCents(item.unitPriceCents)}</td>
          <td data-label="Total"><strong>{formatMoneyCents(item.totalCents)}</strong></td>
        </tr>)}</tbody>
      </table>
    </div>
  </article>;
}

function PaymentPanel({ order }: { order: AdminOrderDetail }) {
  const invoice = order.invoice;
  return <article className="admin-panel admin-order-detail__panel">
    <div className="admin-panel__header admin-order-detail__panel-header"><h2>Montants et paiement</h2></div>
    <div className="admin-order-detail__payment-grid">
      <dl className="admin-order-detail__totals">
        {invoice ? <>
          <DetailRow label="Sous-total HT" value={formatMoneyCents(invoice.subtotalExclTaxCents)} />
          <DetailRow label="Livraison HT" value={formatMoneyCents(invoice.shippingExclTaxCents)} />
          <DetailRow label="Total HT" value={formatMoneyCents(invoice.totalExclTaxCents)} />
          <DetailRow label="TVA" value={formatMoneyCents(invoice.taxCents)} />
          <div className="admin-order-detail__total"><dt>Total TTC</dt><dd>{formatMoneyCents(invoice.totalInclTaxCents)}</dd></div>
        </> : <>
          <DetailRow label="Sous-total commande" value={formatMoneyCents(order.subtotalCents)} />
          <DetailRow label="Livraison" value={formatMoneyCents(order.shippingCents)} />
          <div className="admin-order-detail__total"><dt>Total</dt><dd>{formatMoneyCents(order.totalCents)}</dd></div>
        </>}
      </dl>
      <dl className="admin-order-detail__details">
        <DetailRow label="Mode" value={adminPaymentMethodLabel(order)} />
        <DetailRow label="État" value={paymentStatusLabels[order.paymentStatus]} />
        <DetailRow label="Payé le" value={order.paidAt ? formatAdminOrderDate(order.paidAt) : "Non payé"} />
        <DetailRow label="Payment Intent" value={<TechnicalValue value={order.stripePaymentIntentId} />} />
        <DetailRow label="Session Stripe" value={<TechnicalValue value={order.stripeCheckoutSessionId} />} />
      </dl>
    </div>
    {!invoice ? <p className="admin-order-detail__hint">Le détail HT et TVA sera figé lors de l’émission de la facture, selon la configuration fiscale validée.</p> : null}
    {order.stripeCheckoutSessionId ? <p className="admin-order-detail__hint">Les frais Stripe et le net encaissé ne sont pas enregistrés avec la commande et ne sont donc pas affichés.</p> : null}
  </article>;
}

function CustomerPanel({ order }: { order: AdminOrderDetail }) {
  return <article className="admin-panel admin-order-detail__panel">
    <div className="admin-panel__header admin-order-detail__panel-header"><h2>Client</h2></div>
    <div className="admin-order-detail__panel-body">
      <dl className="admin-order-detail__details">
        <DetailRow label="Nom" value={order.customerName || "Non renseigné"} />
        <DetailRow label="E-mail" value={<a href={`mailto:${encodeURIComponent(order.guestEmail)}`}>{order.guestEmail}</a>} />
      </dl>
      <AddressBlock title="Adresse de facturation" lines={order.billingAddressLines} />
      {order.fulfillmentMethod === "shipping" ? <AddressBlock title="Adresse de livraison" lines={order.shippingAddressLines} /> : null}
    </div>
  </article>;
}

function DeliveryPanel({ order }: { order: AdminOrderDetail }) {
  return <article className="admin-panel admin-order-detail__panel">
    <div className="admin-panel__header admin-order-detail__panel-header"><h2>Livraison</h2></div>
    <div className="admin-order-detail__panel-body">
      <dl className="admin-order-detail__details">
        <DetailRow label="Mode" value={fulfillmentMethodLabel(order.fulfillmentMethod)} />
        <DetailRow label="Zone" value={order.shippingZoneName || (order.fulfillmentMethod === "pickup" ? "Sans objet" : "Non renseignée")} />
        <DetailRow label="Suivi" value={orderStatusLabels[order.status]} />
      </dl>
      {order.customerNote ? <div className="admin-order-detail__note"><h3>Note interne</h3><p>{order.customerNote}</p></div> : null}
    </div>
  </article>;
}

function InvoicePanel({ order }: { order: AdminOrderDetail }) {
  const invoice = order.invoice;
  const archiveLabels = { pending: "Archivage en cours", ready: "Document archivé", failed: "Archivage à reprendre" } as const;
  return <article className="admin-panel admin-order-detail__panel admin-order-detail__invoice">
    <div className="admin-panel__header admin-order-detail__panel-header"><h2>Facturation</h2></div>
    <div className="admin-order-detail__panel-body">
      {invoice ? <>
        <dl className="admin-order-detail__details">
          <DetailRow label="Facture" value={invoice.invoiceNumber} />
          <DetailRow label="Émise le" value={formatAdminOrderDate(invoice.issuedAt)} />
          <DetailRow label="Archive" value={archiveLabels[invoice.archiveStatus]} />
        </dl>
        {invoice.archiveStatus === "ready" ? <Link className="button button--primary admin-order-detail__invoice-action" href={`/api/admin/invoices/${invoice.id}/pdf`}>
          Télécharger {invoice.invoiceNumber}
        </Link> : <form action={issueInvoiceAction}>
          <input name="id" type="hidden" value={order.id} />
          <button className="button button--primary admin-order-detail__invoice-action" type="submit">Reprendre l’archivage PDF</button>
        </form>}
        {invoice.archiveStatus !== "ready" ? <p className="admin-order-detail__hint">La facture est émise et conserve son numéro. Le PDF doit encore être archivé dans le stockage privé.</p> : null}
      </> : <>
        <p className="admin-order-detail__empty">Aucune facture n’a encore été émise.</p>
        {order.invoiceEligibility.eligible ? <form action={issueInvoiceAction}>
          <input name="id" type="hidden" value={order.id} />
          <button className="button button--primary admin-order-detail__invoice-action" type="submit">Émettre la facture</button>
        </form> : <p className="admin-order-detail__eligibility">{order.invoiceEligibility.reason || "Cette commande n’est pas éligible à la facturation."}</p>}
      </>}
    </div>
  </article>;
}

function HistoryPanel({ order }: { order: AdminOrderDetail }) {
  const history = order.history.length ? order.history : fallbackHistory(order);
  return <article className="admin-panel admin-order-detail__panel">
    <div className="admin-panel__header admin-order-detail__panel-header"><h2>{order.history.length ? "Historique" : "Repères"}</h2></div>
    <div className="admin-order-detail__panel-body">
      <ol className="admin-order-detail__timeline">{history.map((entry) => <li key={entry.id}>
        <time dateTime={entry.createdAt}>{formatAdminOrderDate(entry.createdAt)}</time>
        <div><strong>{adminOrderHistoryActionLabel(entry.action)}</strong>{historyMetadata(entry.metadata) ? <span>{historyMetadata(entry.metadata)}</span> : null}</div>
      </li>)}</ol>
      {!order.history.length ? <p className="admin-order-detail__hint">Aucun journal détaillé n’est disponible pour cette commande ; seuls les horodatages enregistrés sont présentés.</p> : null}
    </div>
  </article>;
}

function fallbackHistory(order: AdminOrderDetail): AdminOrderHistoryEntry[] {
  const rows: AdminOrderHistoryEntry[] = [{ id: "created", action: "order.created", createdAt: order.createdAt }];
  if (order.paidAt) rows.push({ id: "paid", action: "order.paid", createdAt: order.paidAt });
  if (order.updatedAt !== order.createdAt && order.updatedAt !== order.paidAt) rows.push({ id: "updated", action: "order.status_changed", createdAt: order.updatedAt, metadata: { status: order.status } });
  return rows.sort((left, right) => right.createdAt.localeCompare(left.createdAt));
}

function historyMetadata(metadata?: Record<string, unknown> | null) {
  if (!metadata) return null;
  const from = typeof metadata.fromStatus === "string" ? metadata.fromStatus : typeof metadata.from === "string" ? metadata.from : null;
  const to = typeof metadata.toStatus === "string" ? metadata.toStatus : typeof metadata.to === "string" ? metadata.to : typeof metadata.status === "string" ? metadata.status : null;
  if (from && to) return `${statusLabel(from)} → ${statusLabel(to)}`;
  if (to) return statusLabel(to);
  return typeof metadata.invoiceNumber === "string" ? metadata.invoiceNumber : null;
}

function statusLabel(value: string) {
  return orderStatusLabels[value as OrderStatus] ?? value;
}

function AddressBlock({ title, lines }: { title: string; lines: string[] }) {
  return <section className="admin-order-detail__address"><h3>{title}</h3>{lines.length ? <address>{lines.map((line, index) => <span key={`${line}-${index}`}>{line}</span>)}</address> : <p>Non renseignée</p>}</section>;
}

function DetailRow({ label, value }: { label: string; value: React.ReactNode }) {
  return <div><dt>{label}</dt><dd>{value}</dd></div>;
}

function TechnicalValue({ value }: { value: string | null }) {
  return value ? <code>{value}</code> : <>Non renseigné</>;
}
