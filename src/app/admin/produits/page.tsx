import Link from "next/link";
import { productAvailabilityLabels, productConditionLabels } from "@/lib/catalog";
import { formatPrice, formatStock } from "@/lib/format";
import { listAdminProducts } from "@/server/catalog/catalog.service";

export const metadata = {
  title: "Admin - Produits"
};

export default async function AdminProductsPage() {
  const products = await listAdminProducts();

  return (
    <section className="section">
      <div className="container">
        <div className="section__header">
          <div>
            <div className="eyebrow">Administration</div>
            <h1 className="page-title">Produits</h1>
          </div>
          <Link className="button button--primary" href="/admin/produits/nouveau">
            Nouveau produit
          </Link>
        </div>

        <div className="admin-panel">
          <div className="admin-panel__header">
            <div>
              <strong>Catalogue V1</strong>
              <p>
                Liste catalogue alimentee par la source configuree : donnees temporaires maintenant,
                PostgreSQL/Supabase ensuite.
              </p>
            </div>
          </div>

          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Produit</th>
                  <th>Categorie</th>
                  <th>Type</th>
                  <th>Statut</th>
                  <th>Prix</th>
                  <th>Stock</th>
                </tr>
              </thead>
              <tbody>
                {products.map((product) => (
                  <tr key={product.id}>
                    <td>
                      <strong>{product.name}</strong>
                      <span>{product.sku}</span>
                    </td>
                    <td>{product.categoryName}</td>
                    <td>{productConditionLabels[product.condition]}</td>
                    <td>{productAvailabilityLabels[product.availability]}</td>
                    <td>{formatPrice(product)}</td>
                    <td>{formatStock(product)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </section>
  );
}
