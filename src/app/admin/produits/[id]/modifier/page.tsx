import { notFound } from "next/navigation";
import { updateProductAction } from "@/app/admin/produits/actions";
import { ProductForm } from "@/components/admin/product-form";
import { createProductFormDraftFromProduct } from "@/server/catalog/product-form-draft";
import {
  findAdminProductById,
  isCatalogPersistenceEnabled,
  listCategories
} from "@/server/catalog/catalog.service";

export const metadata = {
  title: "Admin - Modifier produit"
};

type EditAdminProductPageProps = {
  params: Promise<{
    id: string;
  }>;
  searchParams?: Promise<{
    error?: string;
  }>;
};

export default async function EditAdminProductPage({
  params,
  searchParams
}: EditAdminProductPageProps) {
  const { id } = await params;
  const [product, categories] = await Promise.all([findAdminProductById(id), listCategories()]);
  const paramsValue = searchParams ? await searchParams : {};
  const canPersist = isCatalogPersistenceEnabled();

  if (!product) {
    notFound();
  }

  return (
    <section className="section admin-page">
      <div className="container">
        <div className="eyebrow">Administration</div>
        <h1 className="page-title">Modifier produit</h1>
        <div className="admin-panel form-panel">
          <ProductForm
            action={canPersist ? updateProductAction : undefined}
            canPersist={canPersist}
            categories={categories}
            conditionOptions={product.condition === "imperfect" ? ["imperfect"] : ["new", "service"]}
            defaultValues={createProductFormDraftFromProduct(product)}
            errorMessage={paramsValue.error}
            existingImages={product.images}
            productId={product.id}
            submitLabel="Enregistrer les modifications"
          />
        </div>
      </div>
    </section>
  );
}
