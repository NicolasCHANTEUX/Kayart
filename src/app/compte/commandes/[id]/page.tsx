import Link from "next/link";
import { notFound } from "next/navigation";
import { formatMoneyCents } from "@/lib/format";
import { orderStatusLabels, paymentStatusLabels, fulfillmentMethodLabel } from "@/lib/order-display";
import { getAccountOrder } from "@/server/account/account-service";

export const metadata = { title: "Détail de commande" };

export default async function AccountOrderPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const order = await getAccountOrder(id);
  if (!order) notFound();
  const address = formatAddress(order.shippingAddress);
  return <div className="account-page">
    <Link className="account-back" href="/compte/commandes">← Toutes mes commandes</Link>
    <header className="account-page__intro"><div className="account-kicker">Mon compte / Commandes</div><h1>Commande <span>{order.orderNumber}</span></h1><p>Passée le {new Intl.DateTimeFormat("fr-FR", { dateStyle: "long", timeZone: "Europe/Paris" }).format(order.createdAt)}</p></header>
    {order.isTest ? <div className="account-test-notice">Commande de test · aucun achat réel n’a été effectué.</div> : null}
    <div className="account-detail-grid">
      <section className="account-panel account-detail-items" aria-labelledby="account-items-title"><div className="account-panel__heading"><div><div className="account-kicker">Détail</div><h2 id="account-items-title">Vos articles</h2></div></div><div className="account-items">{order.items.map(item => <div className="account-item" key={item.id}><div><strong>{item.productName}</strong><small>{item.productSku ? `Réf. ${item.productSku} · ` : ""}Quantité {item.quantity}</small></div><strong>{formatMoneyCents(item.totalCents)}</strong></div>)}</div><dl className="account-totals"><div><dt>Sous-total</dt><dd>{formatMoneyCents(order.subtotalCents)}</dd></div><div><dt>Livraison</dt><dd>{order.shippingCents ? formatMoneyCents(order.shippingCents) : "Gratuite"}</dd></div><div className="account-totals__grand"><dt>Total</dt><dd>{formatMoneyCents(order.totalCents)}</dd></div></dl></section>
      <aside className="account-detail-side"><section className="account-panel"><div className="account-kicker">Suivi</div><h2>État de la commande</h2><p className="account-status">{orderStatusLabels[order.status]}</p><dl className="account-facts"><div><dt>Paiement</dt><dd>{paymentStatusLabels[order.paymentStatus]}</dd></div><div><dt>Réception</dt><dd>{fulfillmentMethodLabel(order.fulfillmentMethod)}</dd></div></dl></section><section className="account-panel"><div className="account-kicker">Coordonnées</div><h2>Réception</h2><p>{order.customerName || "Nom non renseigné"}</p>{address.length ? <address>{address.map((line, index) => <span key={index}>{line}<br /></span>)}</address> : <p>{order.fulfillmentMethod === "pickup" ? "Retrait à l’atelier sur rendez-vous." : "Adresse non renseignée."}</p>}</section></aside>
    </div>
  </div>;
}

function formatAddress(value: unknown): string[] {
  if (!value || typeof value !== "object" || Array.isArray(value)) return [];
  const address = value as Record<string, unknown>;
  return ["line1", "line2", "postalCode", "city", "country"].map(key => address[key]).filter((part): part is string => typeof part === "string" && !!part.trim());
}
