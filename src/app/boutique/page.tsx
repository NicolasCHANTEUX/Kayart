import { ProductCard } from "@/components/catalog/product-card";
import { listPublishedProducts } from "@/server/catalog/catalog.service";

export const metadata = {
  title: "Boutique",
  description: "Catalogue KayArt : produits neufs, imparfaits, services et pièces sur mesure."
};

export default async function ShopPage() {
  const products = await listPublishedProducts();

  return (
    <section className="section">
      <div className="container">
        <div className="section__header">
          <div>
            <div className="eyebrow">Catalogue</div>
            <h1 className="page-title">Boutique</h1>
          </div>
          <p className="lead">
            Produits neufs, pièces imparfaites, services atelier et projets sur commande.
          </p>
        </div>
        <div className="grid">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </div>
    </section>
  );
}
