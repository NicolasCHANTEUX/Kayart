import { productAvailabilityValues, productConditionValues } from "@/lib/catalog";
import { slugify } from "@/lib/slug";
import type { ProductAvailability, ProductCondition } from "@/types/catalog";

export type ProductAttributeInput = {
  label: string;
  value: string;
  unit?: string | null;
};

export type ProductStoredImageInput = {
  bucket: string;
  path: string;
  originalFilename: string;
  altText: string;
  mimeType: string;
  sizeBytes: number;
  isPrimary: boolean;
  position: number;
};

export type ProductImageUploadInput = {
  file: File;
  isPrimary: boolean;
  position: number;
};

export type ProductCreateInput = {
  name: string;
  slug: string;
  sku: string;
  baseProductId?: string | null;
  categoryId: string;
  condition: ProductCondition;
  availability: ProductAvailability;
  priceCents: number | null;
  compareAtPriceCents: number | null;
  stockQuantity: number | null;
  shortDescription: string | null;
  description: string;
  defectDescription?: string | null;
  attributes: ProductAttributeInput[];
  images: ProductStoredImageInput[];
  isFeatured: boolean;
  isReservable: boolean;
  isCustomizable: boolean;
};

export type ProductUpdateInput = ProductCreateInput & {
  id: string;
};

export type ProductDeleteInput = {
  id: string;
};

export type ProductStockUpdateInput = {
  id: string;
  stockQuantity: number;
};

export type ProductVisibilityUpdateInput = {
  id: string;
  availability: ProductAvailability;
};

export type CategoryCreateInput = {
  name: string;
  slug: string;
  description: string | null;
  position: number;
  isActive: boolean;
};

export type CategoryUpdateInput = CategoryCreateInput & {
  id: string;
};

export type CategoryDeleteInput = {
  id: string;
};

export type AdminOrderItemInput = {
  productId: string;
  quantity: number;
};

export type AdminOrderCreateInput = {
  guestEmail: string;
  customerNote: string | null;
  items: AdminOrderItemInput[];
};

export type ImperfectProductFormInput = {
  baseProductId: string;
  availability: ProductAvailability;
  basePriceCents: number;
  discountPercent: number;
  defectDescription: string;
};

export class ProductFormError extends Error {
  constructor(readonly issues: Record<string, string>) {
    super(Object.values(issues)[0] ?? "Le formulaire produit contient une erreur.");
  }
}

export class CategoryFormError extends Error {
  constructor(readonly issues: Record<string, string>) {
    super(Object.values(issues)[0] ?? "Le formulaire catégorie contient une erreur.");
  }
}

export class OrderFormError extends Error {
  constructor(readonly issues: Record<string, string>) {
    super(Object.values(issues)[0] ?? "Le formulaire commande contient une erreur.");
  }
}

export function parseProductFormData(formData: FormData): ProductCreateInput {
  const issues: Record<string, string> = {};
  const name = readText(formData, "name");
  const sku = readText(formData, "sku");
  const categoryId = readText(formData, "categoryId");
  const description = readText(formData, "description");
  const dimensions = readText(formData, "dimensions");
  const weight = readText(formData, "weight");
  const slug = slugify(readText(formData, "slug") || name);
  const condition = readEnum(formData, "condition", productConditionValues, "Type", issues);
  const availability = readEnum(
    formData,
    "availability",
    productAvailabilityValues,
    "Statut",
    issues
  );

  if (name.length < 3) {
    issues.name = "Le nom du produit doit contenir au moins 3 caractères.";
  }

  if (!slug) {
    issues.slug = "Le slug du produit est obligatoire.";
  }

  if (!sku) {
    issues.sku = "La référence SKU est obligatoire.";
  } else if (!/^[a-z0-9_-]+$/i.test(sku)) {
    issues.sku = "La référence SKU ne doit contenir que lettres, chiffres, tirets ou underscores.";
  }

  if (!categoryId) {
    issues.categoryId = "La catégorie est obligatoire.";
  }

  if (description.length < 10) {
    issues.description = "La description complète doit contenir au moins 10 caractères.";
  }

  const basePriceCents = parsePriceCents(
    readText(formData, "basePrice") || readText(formData, "price"),
    issues,
    "basePrice",
    "Le prix de base doit être un nombre positif."
  );
  const discountPercent = parseDiscountPercent(readText(formData, "discountPercent"), issues);
  const priceCents =
    basePriceCents === null ? null : Math.round((basePriceCents * (100 - discountPercent)) / 100);
  const compareAtPriceCents = basePriceCents !== null && discountPercent > 0 ? basePriceCents : null;
  const stockQuantity =
    condition === "service" ? null : parsePositiveInteger(readText(formData, "stockQuantity"), issues);
  const attributes = parseProductAttributes(formData);

  if (condition !== "service" && availability !== "made-to-order" && basePriceCents === null) {
    issues.basePrice = "Le prix de base TTC est obligatoire pour un produit vendable directement.";
  }

  if (discountPercent > 0 && basePriceCents === null) {
    issues.basePrice = "Renseignez un prix de base avant d'appliquer une réduction.";
  }

  if (priceCents !== null && priceCents <= 0) {
    issues.basePrice = "Le prix final doit rester supérieur à zéro.";
  }

  if (condition !== "service" && availability !== "made-to-order" && stockQuantity === null) {
    issues.stockQuantity = "Le stock est obligatoire pour un produit physique.";
  }

  if (condition !== "service" && availability === "available" && stockQuantity !== null && stockQuantity <= 0) {
    issues.stockQuantity = "Un produit disponible doit avoir un stock supérieur à zéro.";
  }

  if (condition === "imperfect" && stockQuantity !== null && stockQuantity > 1) {
    issues.stockQuantity = "Un produit imparfait doit représenter une pièce unique.";
  }

  if (condition !== "service" && !weight) {
    issues.weight = "Le poids est obligatoire pour un produit physique.";
  } else if (weight && !isPositiveDecimal(weight)) {
    issues.weight = "Le poids doit être supérieur à zéro.";
  }

  if (condition !== "service" && dimensions.length < 3) {
    issues.dimensions = "Les dimensions sont obligatoires pour un produit physique.";
  }

  if (Object.keys(issues).length > 0) {
    throw new ProductFormError(issues);
  }

  return {
    name,
    slug,
    sku,
    categoryId,
    condition,
    availability,
    priceCents,
    compareAtPriceCents,
    stockQuantity,
    shortDescription: readNullableText(formData, "shortDescription"),
    description,
    attributes,
    images: [],
    isFeatured: formData.get("isFeatured") === "on",
    isReservable: formData.get("isReservable") === "on",
    isCustomizable: formData.get("isCustomizable") === "on"
  };
}

export function parseImperfectProductFormData(formData: FormData): ImperfectProductFormInput {
  const issues: Record<string, string> = {};
  const baseProductId = readText(formData, "baseProductId");
  const availability = readEnum(
    formData,
    "availability",
    productAvailabilityValues,
    "Statut",
    issues
  );
  const basePriceCents = parsePriceCents(
    readText(formData, "basePrice"),
    issues,
    "basePrice",
    "Le prix de base doit être un nombre positif."
  );
  const discountPercent = parseDiscountPercent(readText(formData, "discountPercent"), issues);
  const defectDescription = readText(formData, "defectDescription");

  if (!baseProductId) {
    issues.baseProductId = "Le modèle d'origine est obligatoire.";
  }

  if (basePriceCents === null) {
    issues.basePrice = "Le prix de base TTC est obligatoire pour un produit imparfait.";
  }

  if (discountPercent <= 0) {
    issues.discountPercent = "La réduction doit être supérieure à 0%.";
  }

  if (defectDescription.length < 10) {
    issues.defectDescription = "Décrivez le défaut visuel en au moins 10 caractères.";
  }

  if (Object.keys(issues).length > 0) {
    throw new ProductFormError(issues);
  }

  return {
    baseProductId,
    availability,
    basePriceCents: basePriceCents ?? 0,
    discountPercent,
    defectDescription
  };
}

export function parseProductUpdateFormData(formData: FormData): ProductUpdateInput {
  const issues: Record<string, string> = {};
  const id = readText(formData, "id");

  if (!id) {
    issues.id = "Le produit est introuvable.";
  }

  const input = parseProductFormData(formData);

  if (Object.keys(issues).length > 0) {
    throw new ProductFormError(issues);
  }

  return {
    ...input,
    id
  };
}

export function parseProductDeleteFormData(formData: FormData): ProductDeleteInput {
  const issues: Record<string, string> = {};
  const id = readText(formData, "id");

  if (!id) {
    issues.id = "Le produit est introuvable.";
  }

  if (Object.keys(issues).length > 0) {
    throw new ProductFormError(issues);
  }

  return {
    id
  };
}

export function parseProductStockFormData(formData: FormData): ProductStockUpdateInput {
  const issues: Record<string, string> = {};
  const id = readText(formData, "id");
  const stockQuantity = parsePositiveInteger(readText(formData, "stockQuantity"), issues, true);

  if (!id) {
    issues.id = "Le produit est introuvable.";
  }

  if (Object.keys(issues).length > 0) {
    throw new ProductFormError(issues);
  }

  return {
    id,
    stockQuantity: stockQuantity ?? 0
  };
}

export function parseProductVisibilityFormData(
  formData: FormData,
  availability: ProductAvailability
): ProductVisibilityUpdateInput {
  const issues: Record<string, string> = {};
  const id = readText(formData, "id");

  if (!id) {
    issues.id = "Le produit est introuvable.";
  }

  if (Object.keys(issues).length > 0) {
    throw new ProductFormError(issues);
  }

  return {
    id,
    availability
  };
}

export function parseCategoryCreateFormData(formData: FormData): CategoryCreateInput {
  const input = parseCategoryFields(formData);

  return input;
}

export function parseCategoryUpdateFormData(formData: FormData): CategoryUpdateInput {
  const issues: Record<string, string> = {};
  const id = readText(formData, "id");
  const input = parseCategoryFields(formData);

  if (!id) {
    issues.id = "La catégorie est introuvable.";
  }

  if (Object.keys(issues).length > 0) {
    throw new CategoryFormError(issues);
  }

  return {
    ...input,
    id
  };
}

export function parseCategoryDeleteFormData(formData: FormData): CategoryDeleteInput {
  const issues: Record<string, string> = {};
  const id = readText(formData, "id");

  if (!id) {
    issues.id = "La catégorie est introuvable.";
  }

  if (Object.keys(issues).length > 0) {
    throw new CategoryFormError(issues);
  }

  return {
    id
  };
}

export function parseAdminOrderFormData(formData: FormData): AdminOrderCreateInput {
  const issues: Record<string, string> = {};
  const guestEmailInput = readNullableText(formData, "guestEmail");
  const guestEmail = guestEmailInput ?? "vente-directe@kayart.local";
  const customerNote = readNullableText(formData, "customerNote");
  const productIds = formData.getAll("productId");
  const quantities = formData.getAll("quantity");
  const quantityByProductId = new Map<string, number>();

  if (!isEmailLike(guestEmail)) {
    issues.guestEmail = "L'adresse e-mail client n'est pas valide.";
  }

  productIds.forEach((value, index) => {
    const productId = typeof value === "string" ? value.trim() : "";

    if (!productId) {
      return;
    }

    const rawQuantity = quantities[index];
    const quantity = parseOrderQuantity(
      typeof rawQuantity === "string" ? rawQuantity : "",
      issues,
      `quantity_${index}`
    );

    if (quantity === null) {
      return;
    }

    quantityByProductId.set(productId, (quantityByProductId.get(productId) ?? 0) + quantity);
  });

  if (quantityByProductId.size === 0) {
    issues.items = "Ajoutez au moins un produit dans la commande.";
  }

  if (Object.keys(issues).length > 0) {
    throw new OrderFormError(issues);
  }

  return {
    guestEmail,
    customerNote,
    items: Array.from(quantityByProductId, ([productId, quantity]) => ({
      productId,
      quantity
    }))
  };
}

export function parseProductImageFormData(formData: FormData): ProductImageUploadInput[] {
  const issues: Record<string, string> = {};
  const files = formData.getAll("images").filter(isUploadedFile);
  const coverImageIndex = Number(readText(formData, "coverImageIndex"));
  const primaryIndex = Number.isInteger(coverImageIndex) && coverImageIndex >= 0 ? coverImageIndex : 0;

  if (files.length > 6) {
    issues.images = "Un produit peut recevoir 6 images maximum.";
  }

  const uploads = files.map((file, index) => {
    if (!file.type.startsWith("image/")) {
      issues.images = "Seuls les fichiers image sont acceptés.";
    }

    if (file.size > 12 * 1024 * 1024) {
      issues.images = "Chaque image doit faire 12 Mo maximum.";
    }

    return {
      file,
      isPrimary: index === primaryIndex,
      position: index
    };
  });

  if (Object.keys(issues).length > 0) {
    throw new ProductFormError(issues);
  }

  return uploads;
}

function readText(formData: FormData, name: string) {
  const value = formData.get(name);
  return typeof value === "string" ? value.trim() : "";
}

function readNullableText(formData: FormData, name: string) {
  const value = readText(formData, name);
  return value.length > 0 ? value : null;
}

function readEnum<T extends string>(
  formData: FormData,
  name: string,
  allowedValues: readonly T[],
  label: string,
  issues: Record<string, string>
) {
  const value = readText(formData, name);

  if (allowedValues.includes(value as T)) {
    return value as T;
  }

  issues[name] = `${label} invalide.`;
  return allowedValues[0];
}

function parsePriceCents(
  value: string,
  issues: Record<string, string>,
  fieldName = "price",
  message = "Le prix doit être un nombre positif."
) {
  if (!value) {
    return null;
  }

  const amount = Number(value.replace(",", "."));

  if (!Number.isFinite(amount) || amount <= 0) {
    issues[fieldName] = message;
    return null;
  }

  return Math.round(amount * 100);
}

function parseDiscountPercent(value: string, issues: Record<string, string>) {
  if (!value) {
    return 0;
  }

  const percent = Number(value);

  if (!Number.isInteger(percent) || percent < 0 || percent > 99) {
    issues.discountPercent = "La réduction doit être comprise entre 0 et 99%.";
    return 0;
  }

  return percent;
}

function parsePositiveInteger(value: string, issues: Record<string, string>, required = false) {
  if (!value) {
    if (required) {
      issues.stockQuantity = "Le stock est obligatoire.";
    }

    return null;
  }

  const quantity = Number(value);

  if (!Number.isInteger(quantity) || quantity < 0) {
    issues.stockQuantity = "Le stock doit être un nombre entier positif.";
    return null;
  }

  return quantity;
}

function parseOrderQuantity(value: string, issues: Record<string, string>, fieldName: string) {
  const quantity = Number(value);

  if (!Number.isInteger(quantity) || quantity <= 0) {
    issues[fieldName] = "Chaque quantité doit être un nombre entier supérieur à zéro.";
    return null;
  }

  return quantity;
}

function isPositiveDecimal(value: string) {
  const quantity = Number(value.replace(",", "."));
  return Number.isFinite(quantity) && quantity > 0;
}

function isEmailLike(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function parseProductAttributes(formData: FormData): ProductAttributeInput[] {
  const attributes: ProductAttributeInput[] = [];
  const weight = readNullableText(formData, "weight");
  const dimensions = readNullableText(formData, "dimensions");

  if (weight) {
    attributes.push({
      label: "Poids",
      value: weight,
      unit: "kg"
    });
  }

  if (dimensions) {
    attributes.push({
      label: "Dimensions",
      value: dimensions
    });
  }

  return attributes;
}

function parseCategoryFields(formData: FormData): CategoryCreateInput {
  const issues: Record<string, string> = {};
  const name = readText(formData, "name");
  const slug = slugify(readText(formData, "slug") || name);
  const description = readNullableText(formData, "description");
  const positionValue = readText(formData, "position");
  const position = positionValue ? Number(positionValue) : 0;

  if (name.length < 2) {
    issues.name = "Le nom de la catégorie doit contenir au moins 2 caractères.";
  }

  if (!slug) {
    issues.slug = "Le slug de la catégorie est obligatoire.";
  }

  if (!Number.isInteger(position) || position < 0) {
    issues.position = "La position doit être un nombre entier positif.";
  }

  if (Object.keys(issues).length > 0) {
    throw new CategoryFormError(issues);
  }

  return {
    name,
    slug,
    description,
    position,
    isActive: formData.get("isActive") === "on"
  };
}

function isUploadedFile(value: FormDataEntryValue): value is File {
  return (
    typeof value === "object" &&
    value !== null &&
    "arrayBuffer" in value &&
    "name" in value &&
    "size" in value &&
    Number((value as File).size) > 0
  );
}
