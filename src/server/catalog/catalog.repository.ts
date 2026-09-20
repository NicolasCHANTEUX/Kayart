import { categories, products } from "@/data/products";
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
import type { Prisma } from "@prisma/client";
import {
  mapAppAvailabilityForPrisma,
  mapAppConditionForPrisma,
  mapPrismaAdminOrder,
  mapPrismaCategory,
  mapPrismaProduct,
  mapPublicPrismaProduct
} from "@/server/catalog/catalog.mapper";
import { getPrismaClient } from "@/server/db/prisma";
import type { Category, Product } from "@/types/catalog";
import type { AdminOrder } from "@/types/orders";
import { isManualAdminOrder, requireManualOrders } from "@/server/catalog/order-safety";
import { planProductImages } from "./product-image-plan";
import { ProductFormError } from "./catalog.input";

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
  markAdminOrderPaid(input: AdminOrderActionInput): Promise<AdminOrder>;
  deleteAdminOrder(input: AdminOrderActionInput): Promise<void>;
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

export const productInclude = {
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
  },

  async markAdminOrderPaid() {
    throw new Error("La mise a jour paiement necessite KAYART_DATA_SOURCE=prisma.");
  },

  async deleteAdminOrder() {
    throw new Error("La suppression commande necessite KAYART_DATA_SOURCE=prisma.");
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

    return rows.map(mapPublicPrismaProduct);
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

    return row ? mapPublicPrismaProduct(row) : null;
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
        deliveryMode: input.deliveryMode ?? "quote",
        defectDescription: input.defectDescription,
        description: input.description,
        isCustomizable: input.isCustomizable,
        isFeatured: input.isFeatured,
        isReservable: input.isReservable,
        name: input.name,
        priceCents: input.priceCents,
        publishedAt:
          input.availability === "draft" || input.availability === "archived"
            ? null
            : input.isPublished
              ? new Date()
              : null,
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
          images: true,
          checkoutHolds: { where: { status: "active" } }
        },
        where: {
          id: input.id
        }
      });

      if (!existing) {
        throw new Error("Produit introuvable.");
      }
      if (existing.checkoutHolds?.length && (input.stockQuantity !== existing.stockQuantity || input.condition !== existing.condition)) {
        throw new Error("Une tentative de paiement réserve ce produit. Le stock et le type ne peuvent pas être modifiés maintenant.");
      }

      const imagesToDelete = existing.images.filter((image) => input.deletedImageIds.includes(image.id));
      const imagePlan = planProductImages(existing.images, input);
      if (existing.condition === "imperfect" || input.condition === "imperfect") {
        if (existing.condition !== input.condition || (input.baseProductId !== undefined && input.baseProductId !== existing.baseProductId)) {
          throw new ProductFormError({ condition: "Le type et le modèle d’origine d’un imparfait doivent être conservés." });
        }
        const defect = input.defectDescription === undefined ? existing.defectDescription : input.defectDescription;
        if (!defect || defect.trim().length < 10) throw new ProductFormError({ defectDescription: "Décrivez le défaut en au moins 10 caractères." });
        if (!imagePlan.existing.length && !imagePlan.added.length) throw new ProductFormError({ images: "Conservez au moins une photo du défaut constaté." });
        const price = input.preservePrices ? existing.priceCents : input.priceCents;
        const reference = input.preservePrices ? existing.compareAtPriceCents : input.compareAtPriceCents;
        if (price === null || reference === null || price <= 0 || price >= reference) throw new ProductFormError({ basePrice: "Un imparfait doit conserver un prix positif inférieur à son prix de référence." });
      }

      // Demote before promotion to respect the unique primary-image index.
      if (existing.images.length) await tx.productImage.updateMany({ where: { productId: input.id }, data: { isPrimary: false } });
      for (const image of imagePlan.existing) {
        await tx.productImage.updateMany({ where: { id: image.id, productId: input.id }, data: { position: image.position, isPrimary: image.isPrimary } });
      }

      if (imagesToDelete.length > 0) {
        await tx.productImage.deleteMany({
          where: {
            id: {
              in: imagesToDelete.map((image) => image.id)
            },
            productId: input.id
          }
        });

        // Keep media metadata: it can still be referenced by another product or request.
      }

      const row = await tx.product.update({
        data: {
          attributes: {
            deleteMany: { label: { in: ["Poids", "Dimensions"] } },
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
          compareAtPriceCents: input.preservePrices ? existing.compareAtPriceCents : input.compareAtPriceCents,
          condition: mapAppConditionForPrisma(input.condition),
          deliveryMode: input.deliveryMode,
          defectDescription:
            input.defectDescription === undefined ? undefined : input.defectDescription,
          description: input.description,
          images:
            input.images.length > 0
              ? {
                  create: imagePlan.added.map((image) => ({
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
              : undefined,
          isCustomizable: input.isCustomizable,
          isFeatured: input.isFeatured,
          isReservable: input.isReservable,
          name: input.name,
          priceCents: input.preservePrices ? existing.priceCents : input.priceCents,
          publishedAt:
            input.availability === "draft" || input.availability === "archived"
              ? null
              : input.isPublished
                ? (existing.publishedAt ?? new Date())
                : null,
          shortDescription: input.shortDescription,
          sku: input.sku,
          slug: input.slug,
          stockQuantity: input.stockQuantity,
          updatedAt: new Date()
        },
        include: productInclude,
        where: {
          id: input.id
        }
      });

      if (!row.images.some((image) => image.isPrimary) && row.images.length > 0) {
        const firstImage = [...row.images].sort((first, second) => first.position - second.position)[0];

        if (firstImage) {
          const promotedRow = await tx.product.update({
            data: {
              images: {
                update: {
                  data: {
                    isPrimary: true
                  },
                  where: {
                    id: firstImage.id
                  }
                }
              }
            },
            include: productInclude,
            where: {
              id: input.id
            }
          });

          return mapPrismaProduct(promotedRow);
        }
      }

      return mapPrismaProduct(row);
    }, { isolationLevel: "Serializable" });
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

    const changed = await prisma.product.updateMany({
      data: {
        stockQuantity: input.stockQuantity,
        updatedAt: new Date()
      },
      where: {
        id: input.id,
        condition: existing.condition,
        checkoutHolds: { none: { status: "active" } }
      }
    });
    if (!changed.count) throw new Error("Le produit a changé ou son stock est réservé par un paiement en cours.");
    const row = await prisma.product.findUniqueOrThrow({ where: { id: input.id }, include: productInclude });

    return mapPrismaProduct(row);
  },

  async updateProductVisibility(input) {
    const prisma = getPrismaClient();
    const existing = await prisma.product.findUnique({ where: { id: input.id } });
    if (!existing) throw new Error("Produit introuvable.");
    if (existing.availability === "draft") {
      throw new Error("Modifiez la fiche et choisissez son statut avant de la publier.");
    }
    const makeAvailable = input.availability === "available";
    // Bringing back an unavailable or archived product also restores its sellable status;
    // hiding a product never changes why it was available (reserved, made-to-order, ...).
    const restocking = makeAvailable && (existing.availability === "unavailable" || existing.availability === "archived");
    const row = await prisma.product.update({
      data: {
        availability: restocking ? "available" : existing.availability,
        publishedAt: makeAvailable ? new Date() : null,
        updatedAt: new Date()
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
    await prisma.product.update({
      where: { id: input.id },
      data: { availability: "archived", publishedAt: null, updatedAt: new Date() }
    });
  },

  async createAdminOrder(input) {
    requireManualOrders();
    const prisma = getPrismaClient();

    // Manual sales are a deliberate exception to the catalog: neither stock nor
    // availability gate them, so admins can record a sale independently of what
    // the site currently shows.
    const requestedProductIds = input.items.map((item) => item.productId);
    const productRows = await prisma.product.findMany({
      select: {
        id: true,
        name: true,
        priceCents: true,
        sku: true
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

      const unitPriceCents = product.priceCents;
      if (unitPriceCents === null || unitPriceCents <= 0 || !Number.isSafeInteger(item.quantity) || item.quantity <= 0 || item.quantity > 10000) {
        throw new Error("Prix ou quantité invalide pour cette vente.");
      }

      return {
        productId: product.id,
        productName: product.name,
        productSku: product.sku,
        quantity: item.quantity,
        unitPriceCents,
        totalCents: unitPriceCents * item.quantity
      };
    });

    const subtotalCents = orderItems.reduce((total, item) => total + item.totalCents, 0);
    if (!Number.isSafeInteger(subtotalCents) || subtotalCents > 2147483647) {
      throw new Error("Le montant total dépasse la limite autorisée.");
    }

    const row = await prisma.order.create({
      data: {
        currency: "EUR",
        customerNote: formatManualOrderNote(input.customerNote),
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
        orderNumber: generateManualOrderNumber(),
        paidAt: null,
        paymentStatus: "pending",
        shippingCents: 0,
        status: "pending",
        subtotalCents,
        totalCents: subtotalCents
      },
      include: orderInclude
    });

    return mapPrismaAdminOrder(row);
  },

  async markAdminOrderPaid(input) {
    requireManualOrders();
    const prisma = getPrismaClient();
    const existing = await prisma.order.findUnique({ where: { id: input.id }, include: orderInclude });
    if (!existing || !isManualAdminOrder(existing)) throw new Error("Cette action est réservée aux ventes manuelles sans paiement Stripe.");
    if (existing.paymentStatus === "paid") return mapPrismaAdminOrder(existing);
    if (existing.status !== "pending" || existing.paymentStatus !== "pending") throw new Error("Cette commande ne peut plus être payée.");
    await prisma.order.updateMany({
      data: {
        paidAt: new Date(),
        paymentStatus: "paid",
        status: "paid",
        updatedAt: new Date()
      },
      where: {
        id: input.id, status: "pending", paymentStatus: "pending",
        orderNumber: existing.orderNumber, customerNote: existing.customerNote,
        stripeCheckoutSessionId: null, stripePaymentIntentId: null
      }
    });
    const row = await prisma.order.findUniqueOrThrow({ where: { id: input.id }, include: orderInclude });
    return mapPrismaAdminOrder(row);
  },

  async deleteAdminOrder(input) {
    requireManualOrders();
    const prisma = getPrismaClient();
    const existing = await prisma.order.findUnique({ where: { id: input.id } });
    if (!existing || !isManualAdminOrder(existing)) throw new Error("Cette action est réservée aux ventes manuelles sans paiement Stripe.");
    if (existing.paymentStatus !== "pending" || existing.status !== "pending") throw new Error("Seules les ventes en attente peuvent être annulées.");

    await prisma.order.updateMany({
      data: { status: "cancelled", paymentStatus: "cancelled", updatedAt: new Date() },
      where: {
        id: input.id, status: "pending", paymentStatus: "pending",
        orderNumber: existing.orderNumber, customerNote: existing.customerNote,
        stripeCheckoutSessionId: null, stripePaymentIntentId: null
      }
    });
  }
};

function generateManualOrderNumber() {
  const now = new Date();
  const date = now.toISOString().slice(0, 10).replaceAll("-", "");
  const suffix = `${now.getTime().toString(36)}${Math.random().toString(36).slice(2, 6)}`;

  return `MAN-${date}-${suffix.toUpperCase()}`;
}

function formatManualOrderNote(note: string | null) {
  const prefix = "Vente manuelle admin";

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
