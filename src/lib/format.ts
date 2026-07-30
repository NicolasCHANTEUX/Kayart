import type { Product } from "@/types/catalog";

export function formatPrice(product: Product): string {
  if (product.priceCents === null) {
    if (product.condition === "service") {
      return "Demande en ligne";
    }

    if (product.isCustomizable || product.availability === "made-to-order") {
      return "Sur devis";
    }

    return "À définir";
  }

  return formatMoneyCents(product.priceCents, product.currency);
}

export function formatMoneyCents(value: number, currency: Product["currency"] = "EUR") {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency
  }).format(value / 100);
}

export function getDiscountPercent(product: Product) {
  if (
    product.priceCents === null ||
    !product.compareAtPriceCents ||
    product.compareAtPriceCents <= product.priceCents
  ) {
    return null;
  }

  return Math.round(((product.compareAtPriceCents - product.priceCents) / product.compareAtPriceCents) * 100);
}

export function formatStock(product: Product): string {
  if (product.condition === "service") {
    return "Service";
  }

  if (product.stockQuantity === null) {
    return "Sur commande";
  }

  if (product.stockQuantity === 0) {
    return "Rupture";
  }

  if (product.stockQuantity === 1) {
    return "1 pièce";
  }

  return `${product.stockQuantity} pièces`;
}
