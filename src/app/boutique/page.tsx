import { ProductCard } from "@/components/catalog/product-card";
import { listPublishedProducts } from "@/server/catalog/catalog.service";

export const metadata = {
  title: "Boutique",
  description: "Catalogue KayArt : produits neufs, occasion, services et pieces sur mesure."
};

export default async function ShopPage() {
  const products = await listPublishedProducts();

  return (
    <section className="section">
      <div className="container">
        <div className="section__header">
          <div>
            <div className="eyebrow">Catalogue V1</div>
            <h1 className="page-title">Boutique</h1>
          </div>
          <p className="lead">
            Les donnees sont temporaires pour cadrer l'interface. Elles seront remplacees par la
            base PostgreSQL/Supabase quand le schema sera valide.
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
