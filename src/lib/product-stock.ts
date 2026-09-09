import type { Product } from "@/types/catalog";

export function stockCategory(product: Pick<Product, "condition" | "availability" | "stockQuantity">) {
  if (product.condition === "service") return "service";
  if (product.availability === "made-to-order" || product.stockQuantity === null) return "made-to-order";
  if (product.stockQuantity === 0) return "out";
  if (product.stockQuantity <= 5) return "low";
  return "available";
}
