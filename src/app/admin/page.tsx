import Link from "next/link";
import { listAdminProducts } from "@/server/catalog/catalog.service";

export const metadata = {
  title: "Administration"
};

export default async function AdminPage() {
  const products = await listAdminProducts();

  return (
    <section className="section">
      <div className="container">
        <div className="eyebrow">Acces protege a brancher</div>
        <h1 className="page-title">Admin</h1>
        <p className="lead">
          Cette route ne sera jamais affichee dans la navigation publique. La prochaine etape
          technique consistera a brancher l'auth admin et les protections serveur.
        </p>
        <div className="admin-grid">
          <Link className="feature-card" href="/admin/produits">
            <div className="meta">Catalogue</div>
            <h3>Produits</h3>
            <p>{products.length} elements disponibles dans la source catalogue actuelle.</p>
          </Link>
          <div className="feature-card">
            <div className="meta">Commandes</div>
            <h3>A brancher</h3>
            <p>Le parcours commande viendra apres le catalogue et le panier serveur.</p>
          </div>
          <div className="feature-card">
            <div className="meta">Demandes</div>
            <h3>A brancher</h3>
            <p>Reparation, sur-mesure et contact auront des files de traitement separees.</p>
          </div>
        </div>
      </div>
    </section>
  );
}
