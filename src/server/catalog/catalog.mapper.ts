import type {
  Category as PrismaCategory,
  Product as PrismaProduct,
  ProductAttribute as PrismaProductAttribute
} from "@prisma/client";
import type {
  Category,
  Product,
  ProductAvailability,
  ProductCondition
} from "@/types/catalog";

export type PrismaProductWithCatalogRelations = PrismaProduct & {
  category: PrismaCategory | null;
  attributes: PrismaProductAttribute[];
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
  return {
    id: product.id,
    slug: product.slug,
    sku: product.sku ?? "",
    name: product.name,
    categoryId: product.categoryId ?? "",
    categoryName: product.category?.name ?? "Sans categorie",
    condition: mapPrismaCondition(product.condition),
    availability: mapPrismaAvailability(product.availability),
    priceCents: product.priceCents,
    compareAtPriceCents: product.compareAtPriceCents,
    currency: "EUR",
    stockQuantity: product.stockQuantity,
    shortDescription: product.shortDescription ?? "",
    description: product.description ?? "",
    attributes: product.attributes
      .sort((a, b) => a.position - b.position)
      .map((attribute) => ({
        label: attribute.label,
        value: attribute.value,
        unit: attribute.unit ?? undefined
      })),
    isFeatured: product.isFeatured,
    isReservable: product.isReservable,
    isCustomizable: product.isCustomizable,
    publishedAt: product.publishedAt?.toISOString() ?? null
  };
}

function mapPrismaCondition(condition: PrismaProduct["condition"]): ProductCondition {
  return condition;
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
