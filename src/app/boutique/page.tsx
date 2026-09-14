import { ProductCard } from "@/components/catalog/product-card";
import Link from "next/link";
import { searchShop } from "@/server/catalog/search";
import { Pagination } from "@/components/catalog/pagination";
import { productConditionLabels } from "@/lib/catalog";
import { ShopFilters } from "@/components/catalog/shop-filters";
import type { ListParams } from "@/lib/list-query";

export const metadata = {
  title: "Boutique",
  description: "Catalogue KayArt : produits neufs, imparfaits, services et pièces sur mesure."
};

export default async function ShopPage({ searchParams }: { searchParams?: Promise<ListParams> }) {
  const result = await searchShop(searchParams ? await searchParams : {});
  const { products, filters } = result;
  const collection = filters.condition === "imperfect" || filters.condition === "used" ? filters.condition : filters.stock === "1" ? "stock" : "all";
  const activeFilters = [
    filters.q && { key: "q", label: `Recherche : ${filters.q}` },
    filters.category && { key: "category", label: result.categories.find(category => category.slug === filters.category)?.name ?? filters.category },
    filters.condition && { key: "condition", label: productConditionLabels[filters.condition as keyof typeof productConditionLabels] },
    filters.stock && { key: "stock", label: "En stock" },
    filters.sort !== "recent" && { key: "sort", label: filters.sort === "price-asc" ? "Prix croissant" : filters.sort === "price-desc" ? "Prix décroissant" : "Tri par nom" }
  ].filter((filter): filter is { key: string; label: string } => Boolean(filter));
  function withoutFilter(key: string) {
    const params = new URLSearchParams(Object.entries(filters).filter(([name, value]) => name !== key && value !== "" && !(name === "sort" && value === "recent")));
    return params.size ? `/boutique?${params}` : "/boutique";
  }

  return (
    <section className="section shop-page">
      <div className="container">
        <div className="section__header">
          <div>
            <div className="eyebrow">Le catalogue de l’atelier</div>
            <h1 className="page-title">Des pièces de caractère.</h1>
          </div>
          <p className="lead catalog-intro">
            Produits neufs, pièces imparfaites, services atelier et projets sur commande.
          </p>
        </div>
        <nav className="shop-paths" aria-label="Accès rapides au catalogue">
          <Link href="/boutique" aria-current={collection === "all" ? "page" : undefined}>Tout explorer</Link>
          <Link href="/boutique?stock=1" aria-current={collection === "stock" ? "page" : undefined}>En stock</Link>
          <Link href="/boutique?condition=imperfect" aria-current={collection === "imperfect" ? "page" : undefined}>Les imparfaits</Link>
          <Link href="/boutique?condition=used" aria-current={collection === "used" ? "page" : undefined}>Seconde vie</Link>
        </nav>
        <ShopFilters key={JSON.stringify(filters)} filters={filters} categories={result.categories} />
        <div className="shop-results">
          <p className="shop-result-count" role="status"><strong>{result.total}</strong> résultat{result.total > 1 ? "s" : ""}</p>
          {activeFilters.length > 0 ? <div className="shop-active-filters" aria-label="Critères actifs">
            {activeFilters.map(filter => <Link key={filter.key} href={withoutFilter(filter.key)} aria-label={`Retirer le critère : ${filter.label}`}>{filter.label}<span aria-hidden="true">×</span></Link>)}
            <Link className="shop-active-filters__reset" href="/boutique">Tout effacer</Link>
          </div> : null}
        </div>
        {!result.total ? <p className="shop-empty">Aucun produit ne correspond à ces critères. Modifiez les filtres ou <Link href="/boutique">affichez tout le catalogue</Link>.</p> : null}
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
