import { getPrismaClient } from "@/server/db/prisma";
import { listPublishedProducts } from "@/server/catalog/catalog.service";
import { normalizeCart } from "@/lib/cart";
import { availableShippingZones } from "@/server/checkout/shipping";
import { isTestCheckoutEnabled } from "@/server/checkout/stripe";
import type { CartLine, CartQuote } from "@/types/cart";
export async function quoteCart(value: unknown, country = "FR", postalCode = ""): Promise<CartQuote> {
  const items = normalizeCart(value);
  const products = await listPublishedProducts();
  const lines: CartLine[] = items.map(item => {
    const product = products.find(product => product.id === item.productId);
    // Never fetch an unpublished product to decorate an old cart entry.
    if (!product) return { ...item, name: "Article indisponible", slug: null, sku: null, imageUrl: null, condition: null, unitPriceCents: null, totalCents: null, maxQuantity: 0, deliveryMode: "quote", issue: "unavailable", message: "Ce produit n’est plus disponible. Retirez-le du panier." };
    const requiresQuote = product.condition === "service" || product.isCustomizable || product.priceCents === null || product.priceCents <= 0;
    const maxQuantity = Math.min(10, Math.max(0, product.stockQuantity ?? 0));
    const issue = requiresQuote ? "quote_required" : product.availability !== "available" || maxQuantity === 0 ? "unavailable" : item.quantity > maxQuantity ? "stock" : null;
    const message = issue === "quote_required" ? "Cette pièce nécessite un échange avec l’atelier. Retirez-la pour poursuivre la commande." : issue === "unavailable" ? "Ce produit n’est plus disponible. Retirez-le du panier." : issue === "stock" ? `Plus que ${maxQuantity} disponible${maxQuantity > 1 ? "s" : ""}. Ajustez la quantité.` : null;
    const image = product.images.find(image => image.isPrimary) ?? product.images[0];
    return { ...item, name: product.name, slug: product.slug, sku: product.sku, imageUrl: product.primaryImageUrl ?? image?.url ?? null, condition: product.condition, unitPriceCents: product.priceCents, totalCents: product.priceCents === null ? null : product.priceCents * item.quantity, maxQuantity, deliveryMode: product.deliveryMode ?? "quote", issue, message };
  });
  const subtotalCents = lines.reduce((sum, item) => sum + (item.issue ? 0 : item.totalCents ?? 0), 0);
  if (!Number.isSafeInteger(subtotalCents) || subtotalCents > 2147483647) throw new Error("Montant du panier trop élevé.");
  const zones = process.env.KAYART_DATA_SOURCE === "prisma" ? await getPrismaClient().shippingZone.findMany({ where: { enabled: true, priceCents: { gt: 0 } }, orderBy: { name: "asc" } }) : [];
  const canCheckout = lines.length > 0 && lines.every(line => !line.issue);
  const shippable = canCheckout && lines.every(line => line.deliveryMode === "shippable");
  return { lines, subtotalCents, canCheckout, pickupCents: 0, shippable, countries: Array.from(new Set(zones.flatMap(zone => zone.countryCodes))), shippingZones: availableShippingZones(zones, country, postalCode, shippable).map(zone => ({ id: zone.id, name: zone.name, priceCents: zone.priceCents! })), testCheckoutEnabled: isTestCheckoutEnabled() };
}
