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
        <div className="eyebrow">Administration</div>
        <h1 className="page-title">Admin</h1>
        <p className="lead">
          Pilotez le catalogue et les demandes client depuis cet espace
          réservé aux comptes administrateurs.
        </p>
        <div className="admin-grid">
          <Link className="feature-card" href="/admin/livraison"><div className="meta">Configuration</div><h3>Livraison et lancement</h3><p>Zones, tarifs, retrait atelier et informations légales à valider.</p></Link>
          <Link className="feature-card" href="/admin/produits">
            <div className="meta">Catalogue</div>
            <h3>Produits</h3>
            <p>{overview.products} éléments disponibles dans la source catalogue actuelle.</p>
          </Link>
          <Link className="feature-card" href="/admin/commandes">
            <div className="meta">Commandes</div>
            <h3>Commandes</h3>
            <p>{overview.orders} commandes au total, dont {overview.testOrders} en mode test. Le checkout de test réserve le stock.</p>
          </Link>
          <Link className="feature-card" href="/admin/demandes">
            <div className="meta">Demandes</div>
            <h3>Demandes clients</h3>
            <p>{overview.openRequests} demandes nouvelles ou en cours : messages, réparations et projets sur mesure.</p>
          </Link>
        </div>
      </div>
    </section>
  );
}
