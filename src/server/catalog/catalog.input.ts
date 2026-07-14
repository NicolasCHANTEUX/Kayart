import { productAvailabilityValues, productConditionValues } from "@/lib/catalog";
import { slugify } from "@/lib/slug";
import type { ProductAvailability, ProductCondition } from "@/types/catalog";

export type ProductCreateInput = {
  name: string;
  slug: string;
  sku: string | null;
  categoryId: string | null;
  condition: ProductCondition;
  availability: ProductAvailability;
  priceCents: number | null;
  stockQuantity: number | null;
  shortDescription: string | null;
  description: string | null;
  isFeatured: boolean;
  isReservable: boolean;
  isCustomizable: boolean;
};

export class ProductFormError extends Error {
  constructor(readonly issues: Record<string, string>) {
    super(Object.values(issues)[0] ?? "Le formulaire produit contient une erreur.");
  }
}

export function parseProductFormData(formData: FormData): ProductCreateInput {
  const issues: Record<string, string> = {};
  const name = readText(formData, "name");
  const slug = slugify(readText(formData, "slug") || name);
  const condition = readEnum(formData, "condition", productConditionValues, "Type", issues);
  const availability = readEnum(
    formData,
    "availability",
    productAvailabilityValues,
    "Statut",
    issues
  );

  if (!name) {
    issues.name = "Le nom du produit est obligatoire.";
  }

  if (!slug) {
    issues.slug = "Le slug du produit est obligatoire.";
  }

  const priceCents = parsePriceCents(readText(formData, "price"), issues);
  const stockQuantity = parsePositiveInteger(readText(formData, "stockQuantity"), issues);

  if (Object.keys(issues).length > 0) {
    throw new ProductFormError(issues);
  }

  return {
    name,
    slug,
    sku: readNullableText(formData, "sku"),
    categoryId: readNullableText(formData, "categoryId"),
    condition,
    availability,
    priceCents,
    stockQuantity,
    shortDescription: readNullableText(formData, "shortDescription"),
    description: readNullableText(formData, "description"),
    isFeatured: formData.get("isFeatured") === "on",
    isReservable: formData.get("isReservable") === "on",
    isCustomizable: formData.get("isCustomizable") === "on"
  };
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

function parsePriceCents(value: string, issues: Record<string, string>) {
  if (!value) {
    return null;
  }

  const amount = Number(value.replace(",", "."));

  if (!Number.isFinite(amount) || amount < 0) {
    issues.price = "Le prix doit etre un nombre positif.";
    return null;
  }

  return Math.round(amount * 100);
}

function parsePositiveInteger(value: string, issues: Record<string, string>) {
  if (!value) {
    return null;
  }

  const quantity = Number(value);

  if (!Number.isInteger(quantity) || quantity < 0) {
    issues.stockQuantity = "Le stock doit etre un nombre entier positif.";
    return null;
  }

  return quantity;
}
