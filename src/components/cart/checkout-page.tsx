"use client";
import Link from "next/link";
import { useRef, useState } from "react";
import { cartStorageKey, normalizeCart } from "@/lib/cart";
import { formatMoneyCents } from "@/lib/format";
import { attemptStorageKey, useCart } from "./use-cart";
import { CartFeedback, CartTotals, DeliveryOptions, EmptyCart, OrderingUnavailable, PendingAttempt } from "./cart-shared";

export function CheckoutPage() {
  const cart = useCart();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [retryBody, setRetryBody] = useState<Record<string, unknown> | null>(null);
  const sending = useRef(false);
  const shipping = cart.delivery.method === "pickup" || cart.quote?.shippingZones.some(zone => zone.id === cart.delivery.zoneId);
  const ready = !!cart.quote?.canCheckout && cart.quote.testCheckoutEnabled && shipping && !cart.storageError && !cart.attemptKey;

  async function sendCheckout(body: Record<string, unknown>, retry = false) {
    if (sending.current) return;
    sending.current = true;
    setPending(true); setError("");
    let attempted = false;
    try {
      const saved = localStorage.getItem(attemptStorageKey);
      if ((!retry && saved) || (retry && saved !== body.checkoutKey)) throw new Error("Une autre tentative a changé. Revenez au panier pour la vérifier.");
      if (!retry && JSON.stringify(normalizeCart(JSON.parse(localStorage.getItem(cartStorageKey) || "[]"))) !== JSON.stringify(cart.items)) {
        cart.refresh(); throw new Error("Votre panier a changé dans un autre onglet. Vérifiez le récapitulatif avant de continuer.");
      }
      localStorage.setItem(attemptStorageKey, String(body.checkoutKey));
      attempted = true;
      setRetryBody(body);
      const response = await fetch("/api/checkout", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body), signal: AbortSignal.timeout(65000) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Le paiement n’a pas pu être ouvert.");
      const url = new URL(result.url);
      if (url.protocol !== "https:" || url.hostname !== "checkout.stripe.com") throw new Error("Adresse de paiement invalide.");
      window.location.assign(url.toString());
    } catch (error) {
      if (attempted) cart.setAttemptKey(String(body.checkoutKey));
      setError(error instanceof Error ? error.message : "Paiement indisponible.");
      setPending(false); sending.current = false;
    }
  }

  async function checkout(form: FormData) {
    if (!ready || sending.current) return;
    await sendCheckout({ ...Object.fromEntries(form), items: cart.items, checkoutKey: crypto.randomUUID(), method: cart.delivery.method, country: cart.delivery.country, postalCode: cart.delivery.postalCode, shippingZoneId: cart.delivery.zoneId, testAcknowledged: form.get("testAcknowledged") === "on" });
  }

  if (!cart.loaded) return <p role="status">Chargement de votre commande…</p>;
  return <div className="cart-layout">
    <Link className="text-link" href="/panier">← Revenir au panier</Link>
    <CartFeedback cart={cart} />
    {error ? <p className="form-notice form-notice--error" role="alert">{error}</p> : null}
    {!pending ? <PendingAttempt cart={cart} /> : null}
    {retryBody && cart.attemptKey === retryBody.checkoutKey ? <button type="button" className="button button--ghost" disabled={pending} onClick={() => sendCheckout(retryBody, true)}>Reprendre la même tentative de test</button> : null}
    {!cart.items.length && !cart.storageError ? <EmptyCart /> : cart.quote && !cart.quote.testCheckoutEnabled ? <OrderingUnavailable /> : cart.items.length ? <>
      {cart.quote && !cart.quote.canCheckout && !cart.attemptKey ? <p className="form-notice form-notice--error" role="alert">Certains articles doivent être corrigés. <Link href="/panier">Vérifier le panier</Link> avant de poursuivre.</p> : null}
      {(cart.quote ?? cart.previousQuote)?.testCheckoutEnabled || cart.attemptKey || pending ? <form action={checkout} className="checkout-workspace">
        <div className="checkout-fields customer-request-form">
          <div className="form-notice">Vous êtes dans le parcours de test KayArt. Aucun achat réel : utilisez uniquement des coordonnées de test.</div>
          <fieldset disabled={pending || !!cart.attemptKey}><legend>Vos coordonnées de test</legend>
            <label>Nom complet<input name="name" required maxLength={120} autoComplete="name" /></label>
            <label>Email<input name="email" type="email" required maxLength={254} autoComplete="email" /></label>
            <p className="cart-hint">Aucun compte n’est nécessaire pour poursuivre.</p>
          </fieldset>
          <DeliveryOptions cart={cart} disabled={pending || !!cart.attemptKey} />
          {cart.delivery.method === "shipping" ? <fieldset disabled={pending || !!cart.attemptKey}><legend>Adresse de livraison de test</legend>
            <label>Adresse<input name="line1" required maxLength={200} autoComplete="address-line1" /></label>
            <label>Complément d’adresse (facultatif)<input name="line2" maxLength={200} autoComplete="address-line2" /></label>
            <label>Ville<input name="city" required maxLength={100} autoComplete="address-level2" /></label>
          </fieldset> : null}
        </div>
        <aside className="cart-summary" aria-labelledby="checkout-summary-title">
          <h2 id="checkout-summary-title">Votre commande</h2>
          <ul className="checkout-lines">{(cart.quote ?? cart.previousQuote)?.lines.map(line => <li key={line.productId}><span>{line.name} <small>× {line.quantity}</small></span><strong>{line.totalCents === null ? "À confirmer" : formatMoneyCents(line.totalCents)}</strong>{line.issue && !cart.attemptKey ? <p className="cart-product__issue">{line.message}</p> : null}</li>)}</ul>
          <CartTotals cart={cart} />
          <label className="request-consent checkout-consent"><input name="testAcknowledged" type="checkbox" required disabled={pending || !!cart.attemptKey} />Je comprends qu’il s’agit d’un paiement de test, sans achat réel. J’utiliserai uniquement des données de test.</label>
          <button className="button button--primary cart-continue" disabled={!ready || pending}>{pending ? "Ouverture du paiement…" : "Continuer vers Stripe — test ↗"}</button>
          <p className="cart-hint">Le montant et la disponibilité seront vérifiés à nouveau avant d’ouvrir Stripe.</p>
        </aside>
      </form> : cart.quotePending ? <p role="status">Vérification des articles et de la disponibilité des commandes…</p> : null}
    </> : null}
  </div>;
}
