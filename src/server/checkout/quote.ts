import { getPrismaClient } from "@/server/db/prisma";
import { listPublishedProducts } from "@/server/catalog/catalog.service";
import { normalizeCart } from "@/lib/cart";
import { availableShippingZones } from "@/server/checkout/shipping";
import { isTestCheckoutEnabled } from "@/server/checkout/stripe";
export async function quoteCart(value: unknown, country = "FR", postalCode = "") {
  const items = normalizeCart(value);
  const products = await listPublishedProducts();
  const lines = items.map(item => {
    const product = products.find(product => product.id === item.productId);
    if (!product || product.availability !== "available" || product.condition === "service" || product.isCustomizable || product.priceCents === null || !product.stockQuantity || product.stockQuantity < item.quantity) throw new Error("Un produit du panier est indisponible ou nécessite un devis. Retirez-le pour continuer.");
    return { ...item, name: product.name, slug: product.slug, unitPriceCents: product.priceCents, totalCents: product.priceCents * item.quantity, maxQuantity: Math.min(10, product.stockQuantity), deliveryMode: product.deliveryMode ?? "quote" };
  });
  const subtotalCents = lines.reduce((sum, item) => sum + item.totalCents, 0);
  if (!Number.isSafeInteger(subtotalCents) || subtotalCents > 2147483647) throw new Error("Montant du panier trop élevé.");
  const zones = process.env.KAYART_DATA_SOURCE === "prisma" ? await getPrismaClient().shippingZone.findMany({ where: { enabled: true, priceCents: { gt: 0 } }, orderBy: { name: "asc" } }) : [];
  const shippable = lines.length > 0 && lines.every(line => line.deliveryMode === "shippable");
  return { lines, subtotalCents, pickupCents: 0, shippable, countries: Array.from(new Set(zones.flatMap(zone => zone.countryCodes))), shippingZones: availableShippingZones(zones, country, postalCode, shippable).map(zone => ({ id: zone.id, name: zone.name, priceCents: zone.priceCents! })), testCheckoutEnabled: isTestCheckoutEnabled() };
}
