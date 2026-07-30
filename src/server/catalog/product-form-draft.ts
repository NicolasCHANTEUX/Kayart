import { getDiscountPercent } from "@/lib/format";
import type { Product } from "@/types/catalog";

export type ProductFormDraft = {
  availability?: string;
  basePrice?: string;
  categoryId?: string;
  condition?: string;
  description?: string;
  dimensions?: string;
  discountPercent?: string;
  isCustomizable?: boolean;
  isFeatured?: boolean;
  isReservable?: boolean;
  name?: string;
  shortDescription?: string;
  sku?: string;
  slug?: string;
  stockQuantity?: string;
  weight?: string;
};

export const productFormDraftCookieName = "kayart_product_draft";

const textFields = [
  "availability",
  "basePrice",
  "categoryId",
  "condition",
  "description",
  "dimensions",
  "discountPercent",
  "name",
  "shortDescription",
  "sku",
  "slug",
  "stockQuantity",
  "weight"
] as const;

const booleanFields = ["isCustomizable", "isFeatured", "isReservable"] as const;

export function createProductFormDraft(formData: FormData): ProductFormDraft {
  const draft: ProductFormDraft = {};

  textFields.forEach((field) => {
    const value = formData.get(field);

    if (typeof value === "string" && value.trim()) {
      draft[field] = value;
    }
  });

  booleanFields.forEach((field) => {
    if (formData.get(field) === "on") {
      draft[field] = true;
    }
  });

  return draft;
}

export function encodeProductFormDraft(draft: ProductFormDraft) {
  return encodeURIComponent(JSON.stringify(draft));
}

export function decodeProductFormDraft(value?: string): ProductFormDraft | undefined {
  if (!value) {
    return undefined;
  }

  try {
    const parsed = JSON.parse(decodeURIComponent(value));
    return typeof parsed === "object" && parsed !== null ? parsed : undefined;
  } catch {
    return undefined;
  }
}

export function createProductFormDraftFromProduct(product: Product): ProductFormDraft {
  const weight = product.attributes.find((attribute) => attribute.label === "Poids");
  const dimensions = product.attributes.find((attribute) => attribute.label === "Dimensions");
  const basePriceCents = product.compareAtPriceCents ?? product.priceCents;
  const discountPercent = getDiscountPercent(product);

  return {
    availability: product.availability,
    basePrice: basePriceCents !== null ? String(Math.round(basePriceCents / 100)) : undefined,
    categoryId: product.categoryId,
    condition: product.condition,
    description: product.description,
    dimensions: dimensions?.value,
    discountPercent: discountPercent ? String(discountPercent) : undefined,
    isCustomizable: product.isCustomizable,
    isFeatured: product.isFeatured,
    isReservable: product.isReservable,
    name: product.name,
    shortDescription: product.shortDescription,
    sku: product.sku,
    slug: product.slug,
    stockQuantity: product.stockQuantity !== null ? String(product.stockQuantity) : undefined,
    weight: weight?.value
  };
}
