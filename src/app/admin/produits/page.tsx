import Link from "next/link";
import { CategoryManager } from "@/components/admin/category-manager";
import { ProductTable } from "@/components/admin/product-table";
import { productConditionLabels } from "@/lib/catalog";
import {
  isCatalogPersistenceEnabled,
  listCategories
} from "@/server/catalog/catalog.service";
import { searchAdminProducts } from "@/server/catalog/search";
import { Pagination } from "@/components/catalog/pagination";
import type { ListParams } from "@/lib/list-query";

export const metadata = {
  title: "Admin - Produits"
};

type AdminProductsPageProps = { searchParams?: Promise<ListParams> };

export default async function AdminProductsPage({ searchParams }: AdminProductsPageProps) {
  const params = searchParams ? await searchParams : {};
  const [result, categories] = await Promise.all([searchAdminProducts(params), listCategories()]);
  const { products, total, page, pages, filters } = result;
  const canPersist = isCatalogPersistenceEnabled();

  return (
    <section className="section admin-page">
      <div className="container">
        <div className="section__header">
          <div>
            <div className="eyebrow">Administration</div>
            <h1 className="page-title">Produits</h1>
          </div>
          <div className="header-actions">
            <CategoryManager canPersist={canPersist} categories={categories} />
            <Link className="button button--ghost" href="/admin/produits/imparfait/nouveau">
              Nouveau produit imparfait
            </Link>
            <Link className="button button--primary" href="/admin/produits/nouveau">
              Nouveau produit
            </Link>
          </div>
        </div>

        <div className="admin-panel">
          {params.error ? <p className="form-notice form-notice--error">{params.error}</p> : null}
          {params.updated === "stock" ? (
            <p className="form-notice form-notice--success">Stock mis à jour.</p>
          ) : null}
          {params.updated === "hidden" ? (
            <p className="form-notice form-notice--success">Produit masqué côté boutique.</p>
          ) : null}
          {params.updated === "visible" ? (
            <p className="form-notice form-notice--success">Produit rendu visible côté boutique.</p>
          ) : null}
          {params.updated === "product" ? (
            <p className="form-notice form-notice--success">Produit modifié.</p>
          ) : null}
          {params.updated === "deleted" ? (
            <p className="form-notice form-notice--success">Produit archivé. Historique et réservations conservés.</p>
          ) : null}
          {params.updated === "removed" ? (
            <p className="form-notice form-notice--success">Produit supprimé définitivement. Les commandes conservent leurs informations.</p>
          ) : null}
          {params.updated === "removed-image-warning" ? (
            <p className="form-notice form-notice--error">Produit supprimé, mais certaines images n’ont pas pu être effacées du stockage.</p>
          ) : null}
          {params.updated === "imperfect" ? (
            <p className="form-notice form-notice--success">Produit imparfait créé.</p>
          ) : null}

          {params.updated === "category-created" ? (
            <p className="form-notice form-notice--success">Catégorie créée.</p>
          ) : null}
          {params.updated === "category-updated" ? (
            <p className="form-notice form-notice--success">Catégorie modifiée.</p>
          ) : null}
          {params.updated === "category-deleted" ? (
            <p className="form-notice form-notice--success">Catégorie supprimée.</p>
          ) : null}

          <div className="admin-panel__header">
            <div>
              <strong>Catalogue produits</strong>
              <p>
                Recherchez, filtrez et pilotez les actions principales sans ouvrir la fiche produit.
              </p>
            </div>
          </div>

          <form className="admin-filters">
            <label>
              Recherche
              <input defaultValue={filters.search} name="search" placeholder="Nom ou SKU" type="search" />
            </label>
            <label>
              Catégorie
              <select defaultValue={filters.category} name="category">
                <option value="">Toutes</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Type
              <select defaultValue={filters.condition} name="condition">
                <option value="">Tous</option>
                {Object.entries(productConditionLabels).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Stock
              <select defaultValue={filters.stock} name="stock">
                <option value="">Tous</option>
                <option value="out">Rupture</option>
                <option value="low">Faible</option>
                <option value="available">Disponible</option>
                <option value="made-to-order">Sur commande</option>
                <option value="service">Service</option>
              </select>
            </label>
            <div className="filter-actions">
              <button className="button button--primary" type="submit">
                Filtrer
              </button>
              <Link className="button button--ghost" href="/admin/produits">
                Réinitialiser
              </Link>
            </div>
          </form>

          <p>{total} produit(s) correspondant aux filtres.</p>
          <ProductTable canPersist={canPersist} products={products} />
          <Pagination path="/admin/produits" filters={filters} page={page} pages={pages} />

          {!canPersist ? (
            <p className="admin-panel__note">
              Les mises à jour de stock seront actives après configuration de `DATABASE_URL` et
              passage en mode Prisma.
            </p>
          ) : null}
        </div>
      </div>
    </section>
  );
}
