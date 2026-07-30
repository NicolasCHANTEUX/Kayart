export type ProductCondition = "new" | "imperfect" | "service";

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

export type ProductImage = {
  id: string;
  url: string;
  altText?: string;
  isPrimary: boolean;
  position: number;
};

export type ProductBaseModel = {
  id: string;
  slug: string;
  sku: string;
  name: string;
  categoryName: string;
  priceCents: number | null;
  compareAtPriceCents?: number | null;
  currency: "EUR";
  shortDescription: string;
  description: string;
  attributes: ProductAttribute[];
  images: ProductImage[];
  primaryImageUrl?: string;
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
  images: ProductImage[];
  primaryImageUrl?: string;
  baseProductId?: string | null;
  baseProduct?: ProductBaseModel | null;
  defectDescription?: string | null;
  isFeatured: boolean;
  isReservable: boolean;
  isCustomizable: boolean;
  publishedAt: string | null;
};
