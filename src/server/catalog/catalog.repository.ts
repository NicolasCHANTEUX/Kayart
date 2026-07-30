import { categories, products } from "@/data/products";
import type {
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
import type { Prisma } from "@prisma/client";
import {
  mapAppAvailabilityForPrisma,
  mapAppConditionForPrisma,
  mapPrismaAdminOrder,
  mapPrismaCategory,
  mapPrismaProduct
} from "@/server/catalog/catalog.mapper";
import { getPrismaClient } from "@/server/db/prisma";
import type { Category, Product } from "@/types/catalog";
import type { AdminOrder } from "@/types/orders";

export type CatalogRepository = {
  listCategories(): Promise<Category[]>;
  listProducts(): Promise<Product[]>;
  listPublishedProducts(): Promise<Product[]>;
  listAdminOrders(): Promise<AdminOrder[]>;
  findProductById(id: string): Promise<Product | null>;
  findProductBySlug(slug: string): Promise<Product | null>;
  createCategory(input: CategoryCreateInput): Promise<Category>;
  updateCategory(input: CategoryUpdateInput): Promise<Category>;
  deleteCategory(input: CategoryDeleteInput): Promise<void>;
  createProduct(input: ProductCreateInput): Promise<Product>;
  updateProduct(input: ProductUpdateInput): Promise<Product>;
  updateProductStock(input: ProductStockUpdateInput): Promise<Product>;
  updateProductVisibility(input: ProductVisibilityUpdateInput): Promise<Product>;
  deleteProduct(input: ProductDeleteInput): Promise<void>;
  createAdminOrder(input: AdminOrderCreateInput): Promise<AdminOrder>;
};

const productCoreInclude = {
  attributes: true,
  category: true,
  images: {
    include: {
      mediaAsset: true
    }
  }
} satisfies Prisma.ProductInclude;

const productInclude = {
  ...productCoreInclude,
  baseProduct: {
    include: productCoreInclude
  }
} satisfies Prisma.ProductInclude;

const orderInclude = {
  items: true
} satisfies Prisma.OrderInclude;

export const mockCatalogRepository: CatalogRepository = {
  async listCategories() {
    return categories;
  },

  async listProducts() {
    return products;
  },

  async listPublishedProducts() {
    return products.filter(
      (product) =>
        product.publishedAt &&
        product.availability !== "archived" &&
        product.availability !== "draft" &&
        product.availability !== "unavailable"
    );
  },

  async findProductById(id: string) {
    return products.find((product) => product.id === id) ?? null;
  },

  async findProductBySlug(slug: string) {
    return (
      products.find(
        (product) =>
          product.slug === slug &&
          product.availability !== "archived" &&
          product.availability !== "draft" &&
          product.publishedAt &&
          product.availability !== "unavailable"
      ) ?? null
    );
  },

  async listAdminOrders() {
    return [];
  },

  async createCategory() {
    throw new Error("La création catégorie nécessite KAYART_DATA_SOURCE=prisma.");
  },

  async updateCategory() {
    throw new Error("La modification catégorie nécessite KAYART_DATA_SOURCE=prisma.");
  },

  async deleteCategory() {
    throw new Error("La suppression catégorie nécessite KAYART_DATA_SOURCE=prisma.");
  },

  async createProduct() {
    throw new Error("La sauvegarde produit nécessite KAYART_DATA_SOURCE=prisma.");
  },

  async updateProduct() {
    throw new Error("La modification produit nécessite KAYART_DATA_SOURCE=prisma.");
  },

  async updateProductStock() {
    throw new Error("La mise à jour stock nécessite KAYART_DATA_SOURCE=prisma.");
  },

  async updateProductVisibility() {
    throw new Error("La mise à jour de visibilité nécessite KAYART_DATA_SOURCE=prisma.");
  },

  async deleteProduct() {
    throw new Error("La suppression produit nécessite KAYART_DATA_SOURCE=prisma.");
  },

  async createAdminOrder() {
    throw new Error("La creation commande necessite KAYART_DATA_SOURCE=prisma.");
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

  async createCategory(input) {
    const prisma = getPrismaClient();
    const row = await prisma.category.create({
      data: {
        description: input.description,
        isActive: input.isActive,
        name: input.name,
        position: input.position,
        slug: input.slug
      }
    });

    return mapPrismaCategory(row);
  },

  async updateCategory(input) {
    const prisma = getPrismaClient();
    const row = await prisma.category.update({
      data: {
        description: input.description,
        isActive: input.isActive,
        name: input.name,
        position: input.position,
        slug: input.slug,
        updatedAt: new Date()
      },
      where: {
        id: input.id
      }
    });

    return mapPrismaCategory(row);
  },

  async deleteCategory(input) {
    const prisma = getPrismaClient();

    await prisma.category.delete({
      where: {
        id: input.id
      }
    });
  },

  async listProducts() {
    const prisma = getPrismaClient();
    const rows = await prisma.product.findMany({
      include: productInclude,
      orderBy: [{ createdAt: "desc" }]
    });

    return rows.map(mapPrismaProduct);
  },

  async listPublishedProducts() {
    const prisma = getPrismaClient();
    const rows = await prisma.product.findMany({
      include: productInclude,
      orderBy: [{ createdAt: "desc" }],
      where: {
        availability: {
          notIn: ["archived", "draft", "unavailable"]
        },
        publishedAt: {
          not: null
        }
      }
    });

    return rows.map(mapPrismaProduct);
  },

  async listAdminOrders() {
    const prisma = getPrismaClient();
    const rows = await prisma.order.findMany({
      include: orderInclude,
      orderBy: [{ createdAt: "desc" }],
      take: 50
    });

    return rows.map(mapPrismaAdminOrder);
  },

  async findProductById(id: string) {
    const prisma = getPrismaClient();
    const row = await prisma.product.findUnique({
      include: productInclude,
      where: {
        id
      }
    });

    return row ? mapPrismaProduct(row) : null;
  },

  async findProductBySlug(slug: string) {
    const prisma = getPrismaClient();
    const row = await prisma.product.findFirst({
      include: productInclude,
      where: {
        availability: {
          notIn: ["archived", "draft", "unavailable"]
        },
        publishedAt: {
          not: null
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
        attributes:
          input.attributes.length > 0
            ? {
                create: input.attributes.map((attribute, index) => ({
                  label: attribute.label,
                  position: index,
                  unit: attribute.unit,
                  value: attribute.value
                }))
            }
            : undefined,
        availability: mapAppAvailabilityForPrisma(input.availability),
        baseProductId: input.baseProductId,
        categoryId: input.categoryId,
        compareAtPriceCents: input.compareAtPriceCents,
        condition: mapAppConditionForPrisma(input.condition),
        defectDescription: input.defectDescription,
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
        stockQuantity: input.stockQuantity,
        images:
          input.images.length > 0
            ? {
                create: input.images.map((image) => ({
                  isPrimary: image.isPrimary,
                  position: image.position,
                  mediaAsset: {
                    create: {
                      altText: image.altText,
                      bucket: image.bucket,
                      mimeType: image.mimeType,
                      originalFilename: image.originalFilename,
                      path: image.path,
                      sizeBytes: image.sizeBytes,
                      visibility: "public"
                    }
                  }
                }))
              }
            : undefined
      },
      include: productInclude
    });

    return mapPrismaProduct(row);
  },

  async updateProduct(input) {
    const prisma = getPrismaClient();

    return prisma.$transaction(async (tx) => {
      const existing = await tx.product.findUnique({
        include: {
          images: true
        },
        where: {
          id: input.id
        }
      });

      if (!existing) {
        throw new Error("Produit introuvable.");
      }

      const hasPrimaryImage = existing.images.some((image) => image.isPrimary);
      const row = await tx.product.update({
        data: {
          attributes: {
            deleteMany: {},
            create: input.attributes.map((attribute, index) => ({
              label: attribute.label,
              position: index,
              unit: attribute.unit,
              value: attribute.value
            }))
          },
          availability: mapAppAvailabilityForPrisma(input.availability),
          baseProductId: input.baseProductId === undefined ? undefined : input.baseProductId,
          categoryId: input.categoryId,
          compareAtPriceCents: input.compareAtPriceCents,
          condition: mapAppConditionForPrisma(input.condition),
          defectDescription:
            input.defectDescription === undefined ? undefined : input.defectDescription,
          description: input.description,
          images:
            input.images.length > 0
              ? {
                  create: input.images.map((image, index) => ({
                    isPrimary: hasPrimaryImage ? false : image.isPrimary,
                    position: existing.images.length + index,
                    mediaAsset: {
                      create: {
                        altText: image.altText,
                        bucket: image.bucket,
                        mimeType: image.mimeType,
                        originalFilename: image.originalFilename,
                        path: image.path,
                        sizeBytes: image.sizeBytes,
                        visibility: "public"
                      }
                    }
                  }))
                }
              : undefined,
          isCustomizable: input.isCustomizable,
          isFeatured: input.isFeatured,
          isReservable: input.isReservable,
          name: input.name,
          priceCents: input.priceCents,
          publishedAt:
            input.availability === "draft" ||
            input.availability === "unavailable" ||
            input.availability === "archived"
              ? null
              : existing.publishedAt ?? new Date(),
          shortDescription: input.shortDescription,
          sku: input.sku,
          slug: input.slug,
          stockQuantity: input.stockQuantity
        },
        include: productInclude,
        where: {
          id: input.id
        }
      });

      return mapPrismaProduct(row);
    });
  },

  async updateProductStock(input) {
    const prisma = getPrismaClient();
    const existing = await prisma.product.findUnique({
      select: {
        condition: true
      },
      where: {
        id: input.id
      }
    });

    if (!existing) {
      throw new Error("Produit introuvable.");
    }

    if (existing.condition === "service") {
      throw new Error("Le stock d'un service n'est pas suivi.");
    }

    if ((existing.condition === "imperfect" || existing.condition === "used") && input.stockQuantity > 1) {
      throw new Error("Un produit imparfait doit rester une pièce unique.");
    }

    const row = await prisma.product.update({
      data: {
        stockQuantity: input.stockQuantity
      },
      include: productInclude,
      where: {
        id: input.id
      }
    });

    return mapPrismaProduct(row);
  },

  async updateProductVisibility(input) {
    const prisma = getPrismaClient();
    const row = await prisma.product.update({
      data: {
        availability: mapAppAvailabilityForPrisma(input.availability),
        publishedAt: input.availability === "available" ? new Date() : null
      },
      include: productInclude,
      where: {
        id: input.id
      }
    });

    return mapPrismaProduct(row);
  },

  async deleteProduct(input) {
    const prisma = getPrismaClient();

    await prisma.$transaction(async (tx) => {
      await tx.orderItem.updateMany({
        data: {
          productId: null
        },
        where: {
          productId: input.id
        }
      });

      await tx.reservation.deleteMany({
        where: {
          productId: input.id
        }
      });

      await tx.product.delete({
        where: {
          id: input.id
        }
      });
    });
  },

  async createAdminOrder(input) {
    const prisma = getPrismaClient();

    return prisma.$transaction(async (tx) => {
      const requestedProductIds = input.items.map((item) => item.productId);
      const productRows = await tx.product.findMany({
        select: {
          availability: true,
          condition: true,
          id: true,
          name: true,
          priceCents: true,
          sku: true,
          stockQuantity: true
        },
        where: {
          id: {
            in: requestedProductIds
          }
        }
      });
      const productsById = new Map(productRows.map((product) => [product.id, product]));

      const orderItems = input.items.map((item) => {
        const product = productsById.get(item.productId);

        if (!product) {
          throw new Error("Un produit de la commande est introuvable.");
        }

        if (product.condition === "service") {
          throw new Error(`Le service "${product.name}" ne peut pas décrémenter de stock.`);
        }

        if (product.availability === "archived" || product.availability === "draft") {
          throw new Error(`Le produit "${product.name}" n'est pas prêt pour une vente directe.`);
        }

        if (product.stockQuantity === null) {
          throw new Error(`Le stock du produit "${product.name}" n'est pas suivi.`);
        }

        if (product.stockQuantity < item.quantity) {
          throw new Error(`Stock insuffisant pour "${product.name}".`);
        }

        const unitPriceCents = product.priceCents ?? 0;

        return {
          productId: product.id,
          productName: product.name,
          productSku: product.sku,
          quantity: item.quantity,
          unitPriceCents,
          totalCents: unitPriceCents * item.quantity
        };
      });

      for (const item of orderItems) {
        const updateResult = await tx.product.updateMany({
          data: {
            stockQuantity: {
              decrement: item.quantity
            },
            updatedAt: new Date()
          },
          where: {
            id: item.productId,
            stockQuantity: {
              gte: item.quantity
            }
          }
        });

        if (updateResult.count !== 1) {
          throw new Error(`Stock insuffisant pour "${item.productName}".`);
        }
      }

      const subtotalCents = orderItems.reduce((total, item) => total + item.totalCents, 0);
      const row = await tx.order.create({
        data: {
          currency: "EUR",
          customerNote: formatAdminOrderNote(input.customerNote),
          guestEmail: input.guestEmail,
          items: {
            create: orderItems.map((item) => ({
              productId: item.productId,
              productName: item.productName,
              productSku: item.productSku,
              quantity: item.quantity,
              totalCents: item.totalCents,
              unitPriceCents: item.unitPriceCents
            }))
          },
          orderNumber: generateAdminOrderNumber(),
          paidAt: new Date(),
          paymentStatus: "paid",
          shippingCents: 0,
          status: "completed",
          subtotalCents,
          totalCents: subtotalCents
        },
        include: orderInclude
      });

      return mapPrismaAdminOrder(row);
    });
  }
};

function generateAdminOrderNumber() {
  const now = new Date();
  const date = now.toISOString().slice(0, 10).replaceAll("-", "");
  const suffix = `${now.getTime().toString(36)}${Math.random().toString(36).slice(2, 6)}`;

  return `ADM-${date}-${suffix.toUpperCase()}`;
}

function formatAdminOrderNote(note: string | null) {
  const prefix = "Vente directe admin";

  if (!note) {
    return prefix;
  }

  return `${prefix} - ${note}`;
}

export function getCatalogRepository(): CatalogRepository {
  if (process.env.KAYART_DATA_SOURCE === "prisma") {
    return prismaCatalogRepository;
  }

  return mockCatalogRepository;
}
