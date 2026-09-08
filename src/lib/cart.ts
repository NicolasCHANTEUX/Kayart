export type CartItem = { productId: string; quantity: number };
export function normalizeCart(value: unknown): CartItem[] {
  if (!Array.isArray(value) || value.length > 20) throw new Error("Le panier peut contenir 20 références maximum.");
  const quantities = new Map<string, number>();
  for (const item of value) {
    if (!item || typeof item !== "object" || typeof item.productId !== "string" || !/^[a-zA-Z0-9-]{1,80}$/.test(item.productId) || !Number.isInteger(item.quantity) || item.quantity < 1 || item.quantity > 10) throw new Error("Quantité ou produit invalide.");
    const total = (quantities.get(item.productId) ?? 0) + item.quantity;
    if (total > 10) throw new Error("Dix unités maximum par référence.");
    quantities.set(item.productId, total);
  }
  return Array.from(quantities, ([productId, quantity]) => ({ productId, quantity })).sort((a, b) => a.productId.localeCompare(b.productId));
}
export const cartStorageKey = "kayart-cart-v1";
