import Link from "next/link";
import { listAdminOrders, listAdminProducts } from "@/server/catalog/catalog.service";

export const metadata = {
  title: "Administration"
};

export default async function AdminPage() {
  const [products, orders] = await Promise.all([listAdminProducts(), listAdminOrders()]);

  return (
    <section className="section admin-page">
      <div className="container">
        <div className="eyebrow">Administration</div>
        <h1 className="page-title">Admin</h1>
        <p className="lead">
          Pilotez les contenus, le catalogue et les futures demandes client depuis cet espace
          réservé aux comptes administrateurs.
        </p>
        <div className="admin-grid">
          <Link className="feature-card" href="/admin/produits">
            <div className="meta">Catalogue</div>
            <h3>Produits</h3>
            <p>{products.length} éléments disponibles dans la source catalogue actuelle.</p>
          </Link>
          <Link className="feature-card" href="/admin/commandes">
            <div className="meta">Commandes</div>
            <h3>Ventes directes</h3>
            <p>{orders.length} commandes enregistrées. Créez une vente atelier pour ajuster le stock.</p>
          </Link>
          <div className="feature-card">
            <div className="meta">Demandes</div>
            <h3>À brancher</h3>
            <p>Réparation, sur-mesure et contact auront des files de traitement séparées.</p>
          </div>
        </div>
      </div>
    </section>
  );
}
