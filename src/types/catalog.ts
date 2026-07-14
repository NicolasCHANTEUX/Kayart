export type ProductCondition = "new" | "used" | "service";

export type ProductAvailability =
  | "draft"
  | "available"
  | "reserved"
  | "made-to-order"
  | "unavailable"
  | "archived";

export type Category = {
  id: string;
  slug: string;
  name: string;
  description?: string;
  position: number;
  isActive: boolean;
};

export type ProductAttribute = {
  label: string;
  value: string;
  unit?: string;
};

export type Product = {
  id: string;
  slug: string;
  sku: string;
  name: string;
  categoryId: string;
  categoryName: string;
  condition: ProductCondition;
  availability: ProductAvailability;
  priceCents: number | null;
  compareAtPriceCents?: number | null;
  currency: "EUR";
  stockQuantity: number | null;
  shortDescription: string;
  description: string;
  attributes: ProductAttribute[];
  isFeatured: boolean;
  isReservable: boolean;
  isCustomizable: boolean;
  publishedAt: string | null;
};
