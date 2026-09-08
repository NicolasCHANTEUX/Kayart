import { getCatalogRepository } from "@/server/catalog/catalog.repository";
import { requireAdminSession } from "@/server/auth/session";
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
  await requireAdminSession();
  return getCatalogRepository().listCategories();
}

export async function createCategory(input: CategoryCreateInput) {
  await requireAdminSession();
  return getCatalogRepository().createCategory(input);
}

export async function updateCategory(input: CategoryUpdateInput) {
  await requireAdminSession();
  return getCatalogRepository().updateCategory(input);
}

export async function deleteCategory(input: CategoryDeleteInput) {
  await requireAdminSession();
  return getCatalogRepository().deleteCategory(input);
}

export async function listAdminProducts() {
  await requireAdminSession();
  return getCatalogRepository().listProducts();
}

export async function listAdminOrders() {
  await requireAdminSession();
  return getCatalogRepository().listAdminOrders();
}

export async function findAdminProductById(id: string) {
  await requireAdminSession();
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
  await requireAdminSession();
  return getCatalogRepository().createProduct(input);
}

export async function updateProduct(input: ProductUpdateInput) {
  await requireAdminSession();
  return getCatalogRepository().updateProduct(input);
}

export async function updateProductStock(input: ProductStockUpdateInput) {
  await requireAdminSession();
  return getCatalogRepository().updateProductStock(input);
}

export async function updateProductVisibility(input: ProductVisibilityUpdateInput) {
  await requireAdminSession();
  return getCatalogRepository().updateProductVisibility(input);
}

export async function deleteProduct(input: ProductDeleteInput) {
  await requireAdminSession();
  return getCatalogRepository().deleteProduct(input);
}

export async function createAdminOrder(input: AdminOrderCreateInput) {
  await requireAdminSession();
  return getCatalogRepository().createAdminOrder(input);
}

export async function markAdminOrderPaid(input: AdminOrderActionInput) {
  await requireAdminSession();
  return getCatalogRepository().markAdminOrderPaid(input);
}

export async function deleteAdminOrder(input: AdminOrderActionInput) {
  await requireAdminSession();
  return getCatalogRepository().deleteAdminOrder(input);
}

export async function listStaticProductParams() {
  const products = await listPublishedProducts();
  return products.map((product) => ({ slug: product.slug }));
}
