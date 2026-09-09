import { ProductCard } from "@/components/catalog/product-card";
import Link from "next/link";
import { searchShop } from "@/server/catalog/search";
import { Pagination } from "@/components/catalog/pagination";
import { productConditionLabels } from "@/lib/catalog";
import type { ListParams } from "@/lib/list-query";

export const metadata = {
  title: "Boutique",
  description: "Catalogue KayArt : produits neufs, imparfaits, services et pièces sur mesure."
};

export default async function ShopPage({ searchParams }: { searchParams?: Promise<ListParams> }) {
  const result = await searchShop(searchParams ? await searchParams : {});
  const { products, filters } = result;

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
        <form className="catalog-filters" action="/boutique" role="search">
          <label>Rechercher<input type="search" name="q" maxLength={120} defaultValue={filters.q} placeholder="Nom, référence ou description" /></label>
          <label>Catégorie<select name="category" defaultValue={filters.category}><option value="">Toutes</option>{result.categories.map(c => <option key={c.id} value={c.slug}>{c.name}</option>)}</select></label>
          <label>Type<select name="condition" defaultValue={filters.condition}><option value="">Tous</option>{Object.entries(productConditionLabels).map(([value,label]) => <option key={value} value={value}>{label}</option>)}</select></label>
          <label>Trier<select name="sort" defaultValue={filters.sort}><option value="recent">Nouveautés</option><option value="price-asc">Prix croissant</option><option value="price-desc">Prix décroissant</option><option value="name">Nom</option></select></label>
          <label className="request-consent"><input type="checkbox" name="stock" value="1" defaultChecked={filters.stock === "1"} />En stock uniquement</label>
          <button className="button button--primary">Appliquer</button><Link href="/boutique">Réinitialiser</Link>
        </form>
        <p role="status">{result.total} résultat{result.total > 1 ? "s" : ""}</p>
        {!result.total ? <p>Aucun produit ne correspond à ces critères. Modifiez les filtres ou <Link href="/boutique">affichez tout le catalogue</Link>.</p> : null}
        <div className="grid">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
        <Pagination path="/boutique" {...result} />
      </div>
    </section>
  );
}
