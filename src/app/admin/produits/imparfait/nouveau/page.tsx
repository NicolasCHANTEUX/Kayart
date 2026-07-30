import { createImperfectProductAction } from "@/app/admin/produits/actions";
import { ImperfectProductForm } from "@/components/admin/imperfect-product-form";
import {
  isCatalogPersistenceEnabled,
  listAdminProducts
} from "@/server/catalog/catalog.service";

export const metadata = {
  title: "Admin - Nouveau produit imparfait"
};

type NewImperfectProductPageProps = {
  searchParams?: Promise<{
    error?: string;
  }>;
};

export default async function NewImperfectProductPage({
  searchParams
}: NewImperfectProductPageProps) {
  const products = await listAdminProducts();
  const params = searchParams ? await searchParams : {};
  const canPersist = isCatalogPersistenceEnabled();
  const baseProducts = products.filter(
    (product) => product.condition === "new" && product.availability !== "archived"
  );

  return (
    <section className="section admin-page">
      <div className="container">
        <div className="eyebrow">Administration</div>
        <h1 className="page-title">Nouveau produit imparfait</h1>
        <div className="admin-panel form-panel">
          <ImperfectProductForm
            action={canPersist ? createImperfectProductAction : undefined}
            baseProducts={baseProducts}
            canPersist={canPersist}
            errorMessage={params.error}
          />
        </div>
      </div>
    </section>
  );
}
