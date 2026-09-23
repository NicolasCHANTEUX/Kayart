import Link from "next/link";
import { getAdminOverview } from "@/server/catalog/overview";

export const metadata = {
  title: "Administration"
};

export default async function AdminPage() {
  const overview = await getAdminOverview();

  return (
    <section className="section admin-page">
      <div className="container">
        <h1 className="page-title">Administration</h1>
        <p className="lead">Catalogue, commandes et demandes clients.</p>
        <div className="admin-grid admin-overview">
          <Link className="feature-card" href="/admin/livraison"><div><h2>Livraison et lancement</h2><p>Zones, tarifs et informations légales.</p></div><span className="admin-overview__arrow" aria-hidden="true">↗</span></Link>
          <Link className="feature-card" href="/admin/produits">
            <div><h2>Produits</h2><p>Catalogue, prix et stock.</p></div>
            <span className="admin-overview__count" aria-label={`${overview.products} produits`}>{overview.products}</span>
          </Link>
          <Link className="feature-card" href="/admin/commandes">
            <div><h2>Commandes</h2><p>Dont {overview.testOrders} en mode test.</p></div>
            <span className="admin-overview__count" aria-label={`${overview.orders} commandes`}>{overview.orders}</span>
          </Link>
          <Link className="feature-card" href="/admin/demandes">
            <div><h2>Demandes clients</h2><p>Nouvelles ou en cours.</p></div>
            <span className="admin-overview__count" aria-label={`${overview.openRequests} demandes nouvelles ou en cours`}>{overview.openRequests}</span>
          </Link>
          <Link className="feature-card" href="/admin/demandes?type=repair">
            <div><h2>Demandes de réparation</h2><p>Pièces, dommages et photos jointes.</p></div>
            <span className="admin-overview__count" aria-label={`${overview.openRepairRequests} réparations nouvelles ou en cours`}>{overview.openRepairRequests}</span>
          </Link>
        </div>
        <p className="admin-overview__note">Les commandes Stripe de test réservent du stock.</p>
      </div>
    </section>
  );
}
