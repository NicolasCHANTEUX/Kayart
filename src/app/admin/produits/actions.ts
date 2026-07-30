"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import {
  CategoryFormError,
  parseCategoryCreateFormData,
  parseCategoryDeleteFormData,
  parseCategoryUpdateFormData,
  parseImperfectProductFormData,
  parseProductDeleteFormData,
  parseProductFormData,
  parseProductImageFormData,
  parseProductStockFormData,
  parseProductUpdateFormData,
  parseProductVisibilityFormData,
  ProductFormError
} from "@/server/catalog/catalog.input";
import {
  createProductFormDraft,
  encodeProductFormDraft,
  productFormDraftCookieName
} from "@/server/catalog/product-form-draft";
import { storeProductImages } from "@/server/catalog/product-image-storage";
import {
  createCategory,
  createProduct,
  deleteCategory,
  deleteProduct,
  findAdminProductById,
  updateCategory,
  updateProduct,
  updateProductStock,
  updateProductVisibility
} from "@/server/catalog/catalog.service";
import { requireAdminSession } from "@/server/auth/session";
import { skuFromName, slugify } from "@/lib/slug";

export async function createCategoryAction(formData: FormData) {
  await requireAdminSession();

  try {
    const input = parseCategoryCreateFormData(formData);
    await createCategory(input);
  } catch (error) {
    if (error instanceof CategoryFormError) {
      redirect(`/admin/produits?error=${encodeURIComponent(error.message)}`);
    }

    redirect(
      `/admin/produits?error=${encodeURIComponent(
        "Impossible de créer la catégorie pour le moment. Vérifiez que le slug n'existe pas déjà."
      )}`
    );
  }

  redirect("/admin/produits?updated=category-created");
}

export async function updateCategoryAction(formData: FormData) {
  await requireAdminSession();

  try {
    const input = parseCategoryUpdateFormData(formData);
    await updateCategory(input);
  } catch (error) {
    if (error instanceof CategoryFormError) {
      redirect(`/admin/produits?error=${encodeURIComponent(error.message)}`);
    }

    redirect(
      `/admin/produits?error=${encodeURIComponent(
        "Impossible de modifier la catégorie pour le moment. Vérifiez que le slug n'existe pas déjà."
      )}`
    );
  }

  redirect("/admin/produits?updated=category-updated");
}

export async function deleteCategoryAction(formData: FormData) {
  await requireAdminSession();

  try {
    const input = parseCategoryDeleteFormData(formData);
    await deleteCategory(input);
  } catch (error) {
    if (error instanceof CategoryFormError) {
      redirect(`/admin/produits?error=${encodeURIComponent(error.message)}`);
    }

    redirect(
      `/admin/produits?error=${encodeURIComponent(
        "Impossible de supprimer la catégorie pour le moment."
      )}`
    );
  }

  redirect("/admin/produits?updated=category-deleted");
}

export async function createProductAction(formData: FormData) {
  await requireAdminSession();

  try {
    const input = parseProductFormData(formData);
    const imageUploads = parseProductImageFormData(formData);
    const images = await storeProductImages(input.name, imageUploads);

    await createProduct({
      ...input,
      images
    });
  } catch (error) {
    await saveProductDraft(formData);

    if (error instanceof ProductFormError) {
      redirect(`/admin/produits/nouveau?error=${encodeURIComponent(error.message)}`);
    }

    redirect(
      `/admin/produits/nouveau?error=${encodeURIComponent(
        "Impossible d'enregistrer le produit pour le moment."
      )}`
    );
  }

  await clearProductDraft();
  redirect("/admin/produits");
}

export async function createImperfectProductAction(formData: FormData) {
  await requireAdminSession();

  try {
    const imperfectInput = parseImperfectProductFormData(formData);
    const baseProduct = await findAdminProductById(imperfectInput.baseProductId);

    if (!baseProduct) {
      throw new ProductFormError({
        baseProductId: "Le modèle d'origine est introuvable."
      });
    }

    if (baseProduct.condition !== "new") {
      throw new ProductFormError({
        baseProductId: "Un produit imparfait doit partir d'un modèle neuf."
      });
    }

    if (!baseProduct.categoryId) {
      throw new ProductFormError({
        baseProductId: "Le modèle choisi doit être rattaché à une catégorie."
      });
    }

    const imageUploads = parseProductImageFormData(formData);

    if (imageUploads.length === 0) {
      throw new ProductFormError({
        images: "Ajoutez au moins une photo du défaut constaté."
      });
    }

    const uniqueSuffix = Date.now().toString(36).toUpperCase();
    const productName = `${baseProduct.name} - Imparfait`;
    const productSlug = slugify(`${baseProduct.slug}-imparfait-${uniqueSuffix.toLowerCase()}`);
    const skuBase = baseProduct.sku || skuFromName(baseProduct.name);
    const productSku = `${skuBase}-IMP-${uniqueSuffix}`;
    const finalPriceCents = Math.round(
      (imperfectInput.basePriceCents * (100 - imperfectInput.discountPercent)) / 100
    );
    const images = await storeProductImages(productName, imageUploads);

    await createProduct({
      name: productName,
      slug: productSlug,
      sku: productSku,
      baseProductId: baseProduct.id,
      categoryId: baseProduct.categoryId,
      condition: "imperfect",
      availability: imperfectInput.availability,
      priceCents: finalPriceCents,
      compareAtPriceCents: imperfectInput.basePriceCents,
      stockQuantity: 1,
      shortDescription: `Pièce unique neuve avec défaut visuel issue du modèle ${baseProduct.name}.`,
      description:
        `Produit neuf artisanal présentant un défaut visuel sans impact fonctionnel. ` +
        imperfectInput.defectDescription,
      defectDescription: imperfectInput.defectDescription,
      attributes: [
        ...baseProduct.attributes,
        { label: "État", value: "Neuf imparfait" },
        { label: "Défaut", value: "Visuel uniquement" }
      ],
      images,
      isFeatured: false,
      isReservable: true,
      isCustomizable: false
    });
  } catch (error) {
    if (error instanceof ProductFormError) {
      redirect(`/admin/produits/imparfait/nouveau?error=${encodeURIComponent(error.message)}`);
    }

    redirect(
      `/admin/produits/imparfait/nouveau?error=${encodeURIComponent(
        "Impossible d'enregistrer le produit imparfait pour le moment."
      )}`
    );
  }

  redirect("/admin/produits?updated=imperfect");
}

export async function updateProductStockAction(formData: FormData) {
  await requireAdminSession();

  try {
    const input = parseProductStockFormData(formData);
    await updateProductStock(input);
  } catch (error) {
    if (error instanceof ProductFormError) {
      redirect(`/admin/produits?error=${encodeURIComponent(error.message)}`);
    }

    redirect(
      `/admin/produits?error=${encodeURIComponent(
        "Impossible de mettre à jour le stock pour le moment."
      )}`
    );
  }

  redirect("/admin/produits?updated=stock");
}

export async function updateProductAction(formData: FormData) {
  await requireAdminSession();

  const productId = formData.get("id");
  const redirectPath =
    typeof productId === "string" && productId
      ? `/admin/produits/${productId}/modifier`
      : "/admin/produits";

  try {
    const input = parseProductUpdateFormData(formData);
    const imageUploads = parseProductImageFormData(formData);
    const images = await storeProductImages(input.name, imageUploads);

    await updateProduct({
      ...input,
      images
    });
  } catch (error) {
    if (error instanceof ProductFormError) {
      redirect(`${redirectPath}?error=${encodeURIComponent(error.message)}`);
    }

    redirect(
      `${redirectPath}?error=${encodeURIComponent(
        "Impossible de modifier le produit pour le moment."
      )}`
    );
  }

  redirect("/admin/produits?updated=product");
}

export async function deleteProductAction(formData: FormData) {
  await requireAdminSession();

  try {
    const input = parseProductDeleteFormData(formData);
    await deleteProduct(input);
  } catch (error) {
    if (error instanceof ProductFormError) {
      redirect(`/admin/produits?error=${encodeURIComponent(error.message)}`);
    }

    redirect(
      `/admin/produits?error=${encodeURIComponent(
        "Impossible de supprimer le produit pour le moment."
      )}`
    );
  }

  redirect("/admin/produits?updated=deleted");
}

export async function hideProductAction(formData: FormData) {
  await requireAdminSession();

  try {
    const input = parseProductVisibilityFormData(formData, "unavailable");
    await updateProductVisibility(input);
  } catch (error) {
    if (error instanceof ProductFormError) {
      redirect(`/admin/produits?error=${encodeURIComponent(error.message)}`);
    }

    redirect(
      `/admin/produits?error=${encodeURIComponent(
        "Impossible de masquer le produit pour le moment."
      )}`
    );
  }

  redirect("/admin/produits?updated=hidden");
}

export async function showProductAction(formData: FormData) {
  await requireAdminSession();

  try {
    const input = parseProductVisibilityFormData(formData, "available");
    await updateProductVisibility(input);
  } catch (error) {
    if (error instanceof ProductFormError) {
      redirect(`/admin/produits?error=${encodeURIComponent(error.message)}`);
    }

    redirect(
      `/admin/produits?error=${encodeURIComponent(
        "Impossible de rendre le produit visible pour le moment."
      )}`
    );
  }

  redirect("/admin/produits?updated=visible");
}

async function saveProductDraft(formData: FormData) {
  const cookieStore = await cookies();

  cookieStore.set(productFormDraftCookieName, encodeProductFormDraft(createProductFormDraft(formData)), {
    httpOnly: true,
    maxAge: 60 * 30,
    path: "/admin/produits/nouveau",
    sameSite: "lax"
  });
}

async function clearProductDraft() {
  const cookieStore = await cookies();

  cookieStore.set(productFormDraftCookieName, "", {
    maxAge: 0,
    path: "/admin/produits/nouveau"
  });
}
