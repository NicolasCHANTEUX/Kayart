import { getCatalogRepository } from "@/server/catalog/catalog.repository";
import type { ProductCreateInput } from "@/server/catalog/catalog.input";

export function isCatalogPersistenceEnabled() {
  return process.env.KAYART_DATA_SOURCE === "prisma";
}

export async function listCategories() {
  return getCatalogRepository().listCategories();
}

export async function listAdminProducts() {
  return getCatalogRepository().listProducts();
}

export async function listPublishedProducts() {
  return getCatalogRepository().listPublishedProducts();
}

export async function listFeaturedProducts() {
  const products = await listPublishedProducts();
  return products.filter((product) => product.isFeatured || product.condition !== "new");
}

export async function findProductBySlug(slug: string) {
  return getCatalogRepository().findProductBySlug(slug);
}

export async function createProduct(input: ProductCreateInput) {
  return getCatalogRepository().createProduct(input);
}

export async function listStaticProductParams() {
  const products = await listPublishedProducts();
  return products.map((product) => ({ slug: product.slug }));
}
