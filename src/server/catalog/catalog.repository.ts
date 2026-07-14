import { categories, products } from "@/data/products";
import type { ProductCreateInput } from "@/server/catalog/catalog.input";
import {
  mapAppAvailabilityForPrisma,
  mapPrismaCategory,
  mapPrismaProduct
} from "@/server/catalog/catalog.mapper";
import { getPrismaClient } from "@/server/db/prisma";
import type { Category, Product } from "@/types/catalog";

export type CatalogRepository = {
  listCategories(): Promise<Category[]>;
  listProducts(): Promise<Product[]>;
  listPublishedProducts(): Promise<Product[]>;
  findProductBySlug(slug: string): Promise<Product | null>;
  createProduct(input: ProductCreateInput): Promise<Product>;
};

export const mockCatalogRepository: CatalogRepository = {
  async listCategories() {
    return categories;
  },

  async listProducts() {
    return products;
  },

  async listPublishedProducts() {
    return products.filter((product) => product.publishedAt && product.availability !== "archived");
  },

  async findProductBySlug(slug: string) {
    return products.find((product) => product.slug === slug && product.availability !== "archived") ?? null;
  },

  async createProduct() {
    throw new Error("La sauvegarde produit necessite KAYART_DATA_SOURCE=prisma.");
  }
};

export const prismaCatalogRepository: CatalogRepository = {
  async listCategories() {
    const prisma = getPrismaClient();
    const rows = await prisma.category.findMany({
      orderBy: [{ position: "asc" }, { name: "asc" }]
    });

    return rows.map(mapPrismaCategory);
  },

  async listProducts() {
    const prisma = getPrismaClient();
    const rows = await prisma.product.findMany({
      include: {
        attributes: true,
        category: true
      },
      orderBy: [{ createdAt: "desc" }]
    });

    return rows.map(mapPrismaProduct);
  },

  async listPublishedProducts() {
    const prisma = getPrismaClient();
    const rows = await prisma.product.findMany({
      include: {
        attributes: true,
        category: true
      },
      orderBy: [{ createdAt: "desc" }],
      where: {
        availability: {
          not: "archived"
        },
        publishedAt: {
          not: null
        }
      }
    });

    return rows.map(mapPrismaProduct);
  },

  async findProductBySlug(slug: string) {
    const prisma = getPrismaClient();
    const row = await prisma.product.findFirst({
      include: {
        attributes: true,
        category: true
      },
      where: {
        availability: {
          not: "archived"
        },
        slug
      }
    });

    return row ? mapPrismaProduct(row) : null;
  },

  async createProduct(input) {
    const prisma = getPrismaClient();
    const row = await prisma.product.create({
      data: {
        availability: mapAppAvailabilityForPrisma(input.availability),
        categoryId: input.categoryId,
        condition: input.condition,
        description: input.description,
        isCustomizable: input.isCustomizable,
        isFeatured: input.isFeatured,
        isReservable: input.isReservable,
        name: input.name,
        priceCents: input.priceCents,
        publishedAt: input.availability === "draft" ? null : new Date(),
        shortDescription: input.shortDescription,
        sku: input.sku,
        slug: input.slug,
        stockQuantity: input.stockQuantity
      },
      include: {
        attributes: true,
        category: true
      }
    });

    return mapPrismaProduct(row);
  }
};

export function getCatalogRepository(): CatalogRepository {
  if (process.env.KAYART_DATA_SOURCE === "prisma") {
    return prismaCatalogRepository;
  }

  return mockCatalogRepository;
}
