import Link from "next/link";
import { formatMoneyCents } from "@/lib/format";
import { orderStatusLabels } from "@/lib/order-display";
import { getAccountHome } from "@/server/account/account-service";

export const metadata = { title: "Mon compte" };

export default async function AccountPage() {
  const { email, name, orders } = await getAccountHome();
  return <div className="account-page">
    <header className="account-hero">
      <div className="account-hero__copy"><div className="eyebrow">Espace personnel</div><h1>Bonjour{name ? ` ${name}` : ""}<span className="account-hero__period">.</span></h1><p>Retrouvez vos commandes et gardez vos coordonnées à jour, au même endroit.</p></div>
      <div className="account-hero__monogram" aria-hidden="true">K<span>A</span></div>
    </header>
    <div className="account-dashboard">
      <section className="account-panel account-panel--orders" aria-labelledby="account-recent-title">
        <div className="account-panel__heading"><div><div className="account-kicker">Votre suivi</div><h2 id="account-recent-title">Commandes récentes</h2></div><Link href="/compte/commandes">Tout voir <span aria-hidden="true">↗</span></Link></div>
        {orders.length ? <div className="account-order-list">{orders.map(order => <Link className="account-order-row" href={`/compte/commandes/${order.id}`} key={order.id}>
          <span className="account-order-row__mark" aria-hidden="true">↗</span><span><strong>{order.orderNumber}</strong><small>{new Intl.DateTimeFormat("fr-FR", { dateStyle: "long", timeZone: "Europe/Paris" }).format(order.createdAt)} · {order.items.map(item => item.productName).join(", ")}</small></span><span className="account-order-row__end"><strong>{formatMoneyCents(order.totalCents)}</strong><small>{orderStatusLabels[order.status]}</small></span>
        </Link>)}</div> : <div className="account-empty"><span aria-hidden="true">01</span><p>Vos prochaines commandes passées avec ce compte apparaîtront ici.</p><Link className="button button--primary" href="/boutique">Découvrir la boutique</Link></div>}
      </section>
      <aside className="account-panel account-panel--profile" aria-labelledby="account-profile-title">
        <div className="account-kicker">Votre compte</div><h2 id="account-profile-title">Informations personnelles</h2><p>Vos coordonnées nous aident à préparer et à suivre vos commandes.</p><dl><dt>Adresse email</dt><dd>{email}</dd></dl><Link className="account-text-link" href="/compte/profil">Gérer mes informations <span aria-hidden="true">↗</span></Link>
      </aside>
    </div>
    <p className="account-footnote">Les commandes effectuées en invité ne sont pas ajoutées automatiquement à votre compte. Les paiements actuellement disponibles sont des tests.</p>
  </div>;
}
