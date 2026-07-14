import { createProductAction } from "@/app/admin/produits/actions";
import { ProductForm } from "@/components/admin/product-form";
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

  return (
    <section className="section">
      <div className="container">
        <div className="eyebrow">Administration</div>
        <h1 className="page-title">Nouveau produit</h1>
        <p className="lead">
          Le formulaire est prepare pour Prisma. La sauvegarde reste desactivee en mode demo, puis
          deviendra active quand Supabase et l'acces admin seront branches.
        </p>
        <div className="admin-panel form-panel">
          <ProductForm
            action={canPersist ? createProductAction : undefined}
            canPersist={canPersist}
            categories={categories}
            errorMessage={params.error}
          />
        </div>
      </div>
    </section>
  );
}
