import type {
  Category as PrismaCategory,
  MediaAsset as PrismaMediaAsset,
  Order as PrismaOrder,
  OrderItem as PrismaOrderItem,
  Product as PrismaProduct,
  ProductAttribute as PrismaProductAttribute,
  ProductImage as PrismaProductImage
} from "@prisma/client";
import type {
  Category,
  Product,
  ProductAvailability,
  ProductBaseModel,
  ProductCondition
} from "@/types/catalog";
import type { AdminOrder } from "@/types/orders";

type PrismaProductBaseRelations = PrismaProduct & {
  category: PrismaCategory | null;
  attributes: PrismaProductAttribute[];
  images: Array<PrismaProductImage & { mediaAsset: PrismaMediaAsset }>;
};

export type PrismaProductWithCatalogRelations = PrismaProductBaseRelations & {
  baseProduct?: PrismaProductBaseRelations | null;
};

export type PrismaOrderWithItems = PrismaOrder & {
  items: PrismaOrderItem[];
};

export function mapPrismaCategory(category: PrismaCategory): Category {
  return {
    id: category.id,
    slug: category.slug,
    name: category.name,
    description: category.description ?? undefined,
    position: category.position,
    isActive: category.isActive
  };
}

export function mapPrismaProduct(product: PrismaProductWithCatalogRelations): Product {
  const images = mapPrismaImages(product.images);
  const primaryImage = images.find((image) => image.isPrimary) ?? images[0];

  return {
    id: product.id,
    slug: product.slug,
    sku: product.sku ?? "",
    name: product.name,
    categoryId: product.categoryId ?? "",
    categoryName: product.category?.name ?? "Sans catégorie",
    condition: mapPrismaCondition(product.condition),
    availability: mapPrismaAvailability(product.availability),
    priceCents: product.priceCents,
    compareAtPriceCents: product.compareAtPriceCents,
    currency: "EUR",
    stockQuantity: product.stockQuantity,
    shortDescription: product.shortDescription ?? "",
    description: product.description ?? "",
    attributes: mapPrismaAttributes(product.attributes),
    images,
    primaryImageUrl: primaryImage?.url,
    baseProductId: product.baseProductId,
    baseProduct: product.baseProduct ? mapPrismaBaseProduct(product.baseProduct) : null,
    defectDescription: product.defectDescription,
    isFeatured: product.isFeatured,
    isReservable: product.isReservable,
    isCustomizable: product.isCustomizable,
    publishedAt: product.publishedAt?.toISOString() ?? null
  };
}

export function mapPrismaAdminOrder(order: PrismaOrderWithItems): AdminOrder {
  return {
    id: order.id,
    orderNumber: order.orderNumber,
    guestEmail: order.guestEmail,
    status: order.status,
    paymentStatus: order.paymentStatus,
    currency: "EUR",
    subtotalCents: order.subtotalCents,
    shippingCents: order.shippingCents,
    totalCents: order.totalCents,
    customerNote: order.customerNote,
    paidAt: order.paidAt?.toISOString() ?? null,
    createdAt: order.createdAt.toISOString(),
    isFictive: isFictiveAdminOrder(order),
    items: order.items.map((item) => ({
      id: item.id,
      productId: item.productId,
      productName: item.productName,
      productSku: item.productSku,
      quantity: item.quantity,
      unitPriceCents: item.unitPriceCents,
      totalCents: item.totalCents
    }))
  };
}

function isFictiveAdminOrder(order: PrismaOrderWithItems) {
  return (
    order.orderNumber.startsWith("TEST-") ||
    order.orderNumber.startsWith("ADM-") ||
    order.customerNote?.startsWith("Commande factice admin") === true ||
    order.customerNote?.startsWith("Vente directe admin") === true
  );
}

function mapPrismaBaseProduct(product: PrismaProductBaseRelations): ProductBaseModel {
  const images = mapPrismaImages(product.images);
  const primaryImage = images.find((image) => image.isPrimary) ?? images[0];

  return {
    id: product.id,
    slug: product.slug,
    sku: product.sku ?? "",
    name: product.name,
    categoryName: product.category?.name ?? "Sans catégorie",
    priceCents: product.priceCents,
    compareAtPriceCents: product.compareAtPriceCents,
    currency: "EUR",
    shortDescription: product.shortDescription ?? "",
    description: product.description ?? "",
    attributes: mapPrismaAttributes(product.attributes),
    images,
    primaryImageUrl: primaryImage?.url
  };
}

function mapPrismaImages(images: Array<PrismaProductImage & { mediaAsset: PrismaMediaAsset }>) {
  return images
    .sort((a, b) => a.position - b.position)
    .map((image) => ({
      id: image.id,
      url: image.mediaAsset.path,
      altText: image.mediaAsset.altText ?? undefined,
      isPrimary: image.isPrimary,
      position: image.position
    }));
}

function mapPrismaAttributes(attributes: PrismaProductAttribute[]) {
  return attributes
    .sort((a, b) => a.position - b.position)
    .map((attribute) => ({
      label: attribute.label,
      value: attribute.value,
      unit: attribute.unit ?? undefined
    }));
}

function mapPrismaCondition(condition: PrismaProduct["condition"]): ProductCondition {
  if (condition === "used") {
    return "imperfect";
  }

  return condition as ProductCondition;
}

function mapPrismaAvailability(availability: PrismaProduct["availability"]): ProductAvailability {
  if (availability === "madeToOrder") {
    return "made-to-order";
  }

  return availability;
}

export function mapAppAvailabilityForPrisma(
  availability: ProductAvailability
): PrismaProduct["availability"] {
  if (availability === "made-to-order") {
    return "madeToOrder";
  }

  return availability;
}

export function mapAppConditionForPrisma(condition: ProductCondition): PrismaProduct["condition"] {
  if (condition === "imperfect") {
    return "imperfect";
  }

  return condition;
}
