import { normalizeCart } from "@/lib/cart";
export function parseCheckoutInput(value: unknown) {
  if (!value || typeof value !== "object") throw new Error("Demande invalide.");
  const input = value as Record<string, unknown>;
  const text = (key: string, max: number, required = false) => {
    const value = typeof input[key] === "string" ? input[key].trim() : "";
    if (value.length > max || (required && !value)) throw new Error("Coordonnées incomplètes ou invalides.");
    return value;
  };
  const checkoutKey = text("checkoutKey", 36, true);
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(checkoutKey)) throw new Error("Rechargez le panier.");
  const email = text("email", 254, true).toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error("Adresse email invalide.");
  const name = text("name", 120, true);
  const method = text("method", 10, true);
  if (method !== "pickup" && method !== "shipping") throw new Error("Mode de réception invalide.");
  if (input.testAcknowledged !== true) throw new Error("Confirmez que vous effectuez un paiement de test.");
  const address = method === "shipping" ? { name, line1: text("line1", 200, true), line2: text("line2", 200), postalCode: text("postalCode", 20, true), city: text("city", 100, true), country: text("country", 2, true).toUpperCase() } : null;
  if (address && !/^[A-Z]{2}$/.test(address.country)) throw new Error("Pays invalide.");
  const shippingZoneId = method === "shipping" ? text("shippingZoneId", 36, true) : null;
  const items = normalizeCart(input.items);
  if (!items.length) throw new Error("Le panier est vide.");
  return { checkoutKey, email, name, method, address, shippingZoneId, items };
}
export type CheckoutInput = ReturnType<typeof parseCheckoutInput>;
