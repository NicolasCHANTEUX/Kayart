import { getCatalogRepository } from "@/server/catalog/catalog.repository";
import type {
  AdminOrderActionInput,
  AdminOrderCreateInput,
  CategoryCreateInput,
  CategoryDeleteInput,
  CategoryUpdateInput,
  ProductCreateInput,
  ProductDeleteInput,
  ProductStockUpdateInput,
  ProductUpdateInput,
  ProductVisibilityUpdateInput
} from "@/server/catalog/catalog.input";

export function isCatalogPersistenceEnabled() {
  return process.env.KAYART_DATA_SOURCE === "prisma";
}

export async function listCategories() {
  return getCatalogRepository().listCategories();
}

export async function createCategory(input: CategoryCreateInput) {
  return getCatalogRepository().createCategory(input);
}

export async function updateCategory(input: CategoryUpdateInput) {
  return getCatalogRepository().updateCategory(input);
}

export async function deleteCategory(input: CategoryDeleteInput) {
  return getCatalogRepository().deleteCategory(input);
}

export async function listAdminProducts() {
  return getCatalogRepository().listProducts();
}

export async function listAdminOrders() {
  return getCatalogRepository().listAdminOrders();
}

export async function findAdminProductById(id: string) {
  return getCatalogRepository().findProductById(id);
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

export async function updateProduct(input: ProductUpdateInput) {
  return getCatalogRepository().updateProduct(input);
}

export async function updateProductStock(input: ProductStockUpdateInput) {
  return getCatalogRepository().updateProductStock(input);
}

export async function updateProductVisibility(input: ProductVisibilityUpdateInput) {
  return getCatalogRepository().updateProductVisibility(input);
}

export async function deleteProduct(input: ProductDeleteInput) {
  return getCatalogRepository().deleteProduct(input);
}

export async function createAdminOrder(input: AdminOrderCreateInput) {
  return getCatalogRepository().createAdminOrder(input);
}

export async function markAdminOrderPaid(input: AdminOrderActionInput) {
  return getCatalogRepository().markAdminOrderPaid(input);
}

export async function deleteAdminOrder(input: AdminOrderActionInput) {
  return getCatalogRepository().deleteAdminOrder(input);
}

export async function listStaticProductParams() {
  const products = await listPublishedProducts();
  return products.map((product) => ({ slug: product.slug }));
}
