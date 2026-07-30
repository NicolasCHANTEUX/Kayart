import { cookies } from "next/headers";
import { createProductAction } from "@/app/admin/produits/actions";
import { ProductForm } from "@/components/admin/product-form";
import {
  decodeProductFormDraft,
  productFormDraftCookieName
} from "@/server/catalog/product-form-draft";
import { isCatalogPersistenceEnabled, listCategories } from "@/server/catalog/catalog.service";

export const metadata = {
  title: "Admin - Nouveau produit"
};

type NewAdminProductPageProps = {
  searchParams?: Promise<{
    error?: string;
  }>;
};

export default async function NewAdminProductPage({ searchParams }: NewAdminProductPageProps) {
  const categories = await listCategories();
  const params = searchParams ? await searchParams : {};
  const canPersist = isCatalogPersistenceEnabled();
  const cookieStore = await cookies();
  const draft = params.error
    ? decodeProductFormDraft(cookieStore.get(productFormDraftCookieName)?.value)
    : undefined;

  return (
    <section className="section admin-page">
      <div className="container">
        <div className="eyebrow">Administration</div>
        <h1 className="page-title">Nouveau produit</h1>
        <div className="admin-panel form-panel">
          <ProductForm
            action={canPersist ? createProductAction : undefined}
            canPersist={canPersist}
            categories={categories}
            conditionOptions={["new", "service"]}
            defaultValues={draft}
            errorMessage={params.error}
          />
        </div>
      </div>
    </section>
  );
}
