import { createHash, randomUUID } from "node:crypto";
import type Stripe from "stripe";
import { getPrismaClient } from "@/server/db/prisma";
import { availableShippingZones } from "@/server/checkout/shipping";
import { getTestStripe, isTestCheckoutEnabled } from "@/server/checkout/stripe";
import { checkoutTransaction } from "@/server/checkout/transactions";
import type { CheckoutInput } from "@/server/checkout/checkout-input";
import { releaseRejectedCheckout } from "@/server/checkout/settlement";

export async function startTestCheckout(input: CheckoutInput) {
  if (!isTestCheckoutEnabled()) throw new Error("Le paiement de test n’est pas encore disponible. Contactez l’atelier.");
  const configuredUrl = process.env.NEXT_PUBLIC_SITE_URL || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "");
  const origin = new URL(configuredUrl).origin;
  if (process.env.VERCEL === "1" && !origin.startsWith("https://")) throw new Error("Adresse du site non configurée.");
  const { checkoutKey, ...content } = input;
  const fingerprint = createHash("sha256").update(JSON.stringify(content)).digest("hex");
  const order = await checkoutTransaction(async tx => {
    const existing = await tx.order.findUnique({ where: { checkoutKey }, include: { items: true, checkoutHolds: true } });
    if (existing) {
      if (existing.checkoutFingerprint !== fingerprint || existing.paymentStatus !== "pending") throw new Error("Cette tentative a changé ou est terminée. Revenez au panier.");
      return existing;
    }
    const products = await tx.product.findMany({ where: { id: { in: input.items.map(item => item.productId) } } });
    const items = input.items.map(item => {
      const product = products.find(product => product.id === item.productId);
      if (!product || !product.publishedAt || product.availability !== "available" || product.condition === "service" || product.isCustomizable || !product.priceCents || !product.stockQuantity || product.stockQuantity < item.quantity) throw new Error("Un produit est indisponible ou nécessite un devis.");
      return { product, quantity: item.quantity, totalCents: product.priceCents * item.quantity };
    });
    let shippingCents = 0;
    if (input.method === "shipping") {
      const zones = await tx.shippingZone.findMany({ where: { id: input.shippingZoneId! } });
      const selected = availableShippingZones(zones, input.address!.country, input.address!.postalCode, items.every(item => item.product.deliveryMode === "shippable"))[0];
      if (!selected) throw new Error("Cette livraison n’est pas disponible. Choisissez le retrait atelier ou contactez-nous pour un devis.");
      shippingCents = selected.priceCents!;
    }
    const subtotalCents = items.reduce((sum, item) => sum + item.totalCents, 0);
    if (!Number.isSafeInteger(subtotalCents + shippingCents) || subtotalCents <= 0 || subtotalCents + shippingCents > 2147483647) throw new Error("Montant invalide.");
    for (const item of items) {
      const result = await tx.product.updateMany({ where: { id: item.product.id, availability: "available", publishedAt: { not: null }, stockQuantity: { gte: item.quantity } }, data: { stockQuantity: { decrement: item.quantity }, updatedAt: new Date() } });
      if (!result.count) throw new Error("Le stock vient de changer. Actualisez votre panier.");
    }
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000);
    return tx.order.create({ data: {
      orderNumber: `KT-TEST-${randomUUID()}`, checkoutKey, checkoutFingerprint: fingerprint, isTest: true,
      guestEmail: input.email, fulfillmentMethod: input.method, shippingZoneId: input.shippingZoneId,
      shippingAddress: input.address ?? undefined, customerNote: input.method === "pickup" ? "Retrait gratuit à l’atelier, sur rendez-vous." : "Livraison selon la zone sélectionnée.",
      subtotalCents, shippingCents, totalCents: subtotalCents + shippingCents,
      items: { create: items.map(item => ({ productId: item.product.id, productName: item.product.name, productSku: item.product.sku, quantity: item.quantity, unitPriceCents: item.product.priceCents!, totalCents: item.totalCents })) },
      checkoutHolds: { create: items.map(item => ({ productId: item.product.id, quantity: item.quantity, expiresAt })) }
    }, include: { items: true, checkoutHolds: true } });
  });
  const stripe = getTestStripe();
  if (order.stripeCheckoutSessionId) {
    const session = await stripe.checkout.sessions.retrieve(order.stripeCheckoutSessionId);
    if (session.livemode || session.status !== "open" || !session.url) throw new Error("Cette session est terminée. Revenez au panier.");
    return { url: session.url };
  }
  const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = order.items.map(item => ({ price_data: { currency: "eur", unit_amount: item.unitPriceCents, product_data: { name: item.productName } }, quantity: item.quantity }));
  if (order.shippingCents > 0) lineItems.push({ price_data: { currency: "eur", unit_amount: order.shippingCents, product_data: { name: "Livraison" } }, quantity: 1 });
  let session: Stripe.Checkout.Session;
  try {
    session = await stripe.checkout.sessions.create({ mode: "payment", payment_method_types: ["card"], customer_email: order.guestEmail, client_reference_id: order.id,
      metadata: { orderId: order.id, fingerprint }, line_items: lineItems,
      expires_at: Math.floor(order.checkoutHolds[0].expiresAt.getTime() / 1000),
      success_url: `${origin}/commande/confirmation?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/panier?checkout=${checkoutKey}`,
      custom_text: { submit: { message: "Mode test KayArt : aucune commande réelle. Utilisez uniquement les données de test Stripe." } }
    }, { idempotencyKey: `kayart-checkout:${order.id}` });
  } catch (error) {
    // Network failures are ambiguous: a Stripe session may exist. Keep the hold
    // until a verified Stripe expiration/payment event or reconciliation resolves it.
    if (typeof error === "object" && error && "type" in error && error.type === "StripeInvalidRequestError") await releaseRejectedCheckout(order.id);
    throw new Error("Le paiement de test n’a pas pu être ouvert. Réessayez la même tentative ou contactez l’atelier.");
  }
  if (session.livemode || !session.url || new URL(session.url).hostname !== "checkout.stripe.com") throw new Error("Session Stripe de test invalide.");
  await getPrismaClient().order.updateMany({ where: { id: order.id, OR: [{ stripeCheckoutSessionId: null }, { stripeCheckoutSessionId: session.id }] }, data: { stripeCheckoutSessionId: session.id, updatedAt: new Date() } });
  return { url: session.url };
}
