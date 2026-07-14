"use server";

import { redirect } from "next/navigation";
import { parseProductFormData, ProductFormError } from "@/server/catalog/catalog.input";
import { createProduct } from "@/server/catalog/catalog.service";

export async function createProductAction(formData: FormData) {
  try {
    const input = parseProductFormData(formData);
    await createProduct(input);
  } catch (error) {
    if (error instanceof ProductFormError) {
      redirect(`/admin/produits/nouveau?error=${encodeURIComponent(error.message)}`);
    }

    redirect(
      `/admin/produits/nouveau?error=${encodeURIComponent(
        "Impossible d'enregistrer le produit pour le moment."
      )}`
    );
  }

  redirect("/admin/produits");
}
