import type { Product } from "@/types/catalog";

export function formatPrice(product: Product): string {
  if (product.priceCents === null) {
    if (product.condition === "service") {
      return "Demande en ligne";
    }

    if (product.isCustomizable || product.availability === "made-to-order") {
      return "Sur devis";
    }

    return "A definir";
  }

  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: product.currency
  }).format(product.priceCents / 100);
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
    return "1 piece";
  }

  return `${product.stockQuantity} pieces`;
}
