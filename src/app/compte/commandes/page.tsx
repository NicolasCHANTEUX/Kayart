import Link from "next/link";
import { formatMoneyCents } from "@/lib/format";
import { orderStatusLabels, paymentStatusLabels } from "@/lib/order-display";
import { listAccountOrders } from "@/server/account/account-service";

export const metadata = { title: "Mes commandes" };

export default async function AccountOrdersPage({ searchParams }: { searchParams?: Promise<{ page?: string }> }) {
  const params = searchParams ? await searchParams : {};
  const page = Number(params.page ?? "1");
  const { orders, count, page: currentPage, pageCount } = await listAccountOrders(page);
  return <div className="account-page">
    <div className="account-page__intro"><div className="account-kicker">Mon compte / Commandes</div><h1>Mes commandes</h1><p>Le suivi de vos achats réalisés en étant connecté à ce compte.</p></div>
    <section className="account-panel account-orders" aria-label="Liste de mes commandes">
      <div className="account-panel__heading"><div><div className="account-kicker">Historique</div><h2>{count} commande{count > 1 ? "s" : ""}</h2></div></div>
      {orders.length ? <div className="account-order-list">{orders.map(order => <Link className="account-order-row" href={`/compte/commandes/${order.id}`} key={order.id}>
        <span className="account-order-row__mark" aria-hidden="true">↗</span>
        <span><strong>{order.orderNumber}</strong><small>{new Intl.DateTimeFormat("fr-FR", { dateStyle: "long", timeZone: "Europe/Paris" }).format(order.createdAt)}</small><small>{order.items.map(item => `${item.productName} × ${item.quantity}`).join(" · ")}</small></span>
        <span className="account-order-row__end"><strong>{formatMoneyCents(order.totalCents)}</strong><small>{orderStatusLabels[order.status]} · {paymentStatusLabels[order.paymentStatus]}</small>{order.isTest ? <em>Commande test</em> : null}</span>
      </Link>)}</div> : <div className="account-empty"><span aria-hidden="true">00</span><p>Aucune commande liée à ce compte pour le moment.</p><Link className="button button--primary" href="/boutique">Explorer la boutique</Link></div>}
      {pageCount > 1 ? <nav className="account-pagination" aria-label="Pages des commandes">{currentPage > 1 ? <Link href={`/compte/commandes?page=${currentPage - 1}`}>← Précédent</Link> : <span /> }<span>Page {currentPage} sur {pageCount}</span>{currentPage < pageCount ? <Link href={`/compte/commandes?page=${currentPage + 1}`}>Suivant →</Link> : <span />}</nav> : null}
    </section>
    <p className="account-footnote">Les commandes passées en invité ne figurent pas dans cet espace. Les paiements disponibles actuellement sont des tests.</p>
  </div>;
}
