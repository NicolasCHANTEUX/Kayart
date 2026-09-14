"use client";
import Link from "next/link";
import { useState } from "react";
import { formatMoneyCents } from "@/lib/format";
import type { CartState } from "./use-cart";
import { attemptStorageKey } from "./use-cart";

export function CartFeedback({ cart }: { cart: CartState }) {
  return <>
    {cart.storageError ? <div className="form-notice form-notice--error" role="alert"><p>{cart.storageError}</p><button type="button" className="button button--ghost" onClick={cart.refresh}>Réessayer</button><button type="button" className="button button--ghost" disabled={!!cart.attemptKey} onClick={() => { if (window.confirm("Vider les articles enregistrés dans ce panier ?")) cart.updateItems([]); }}>Vider le panier</button></div> : null}
    {cart.quoteError ? <div className="form-notice form-notice--error" role="alert"><p>{cart.quoteError}</p><button type="button" className="button button--ghost" onClick={cart.refresh}>Actualiser le panier</button></div> : null}
  </>;
}

export function PendingAttempt({ cart }: { cart: CartState }) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  if (!cart.attemptKey) return null;
  async function cancel() {
    setPending(true); setError("");
    try {
      const response = await fetch("/api/checkout/cancel", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ checkoutKey: cart.attemptKey }), signal: AbortSignal.timeout(65000) });
      const result = await response.json();
      if (!response.ok || result.status === "pending") throw new Error(result.error || "La confirmation est encore en attente. Réessayez ou contactez l’atelier.");
      if (result.status === "paid") {
        if (typeof result.sessionId !== "string" || !/^cs_test_[a-zA-Z0-9_]{10,200}$/.test(result.sessionId)) throw new Error("Ce paiement est déjà confirmé. Contactez l’atelier avant de recommencer.");
        window.location.assign(`/commande/confirmation?session_id=${encodeURIComponent(result.sessionId)}`);
        return;
      }
      localStorage.removeItem(attemptStorageKey);
      cart.setAttemptKey("");
      // Remove the Stripe return marker without navigating or losing the cart state.
      if (new URL(window.location.href).searchParams.has("checkout")) window.history.replaceState(null, "", window.location.pathname);
      window.dispatchEvent(new Event("kayart:cart-updated"));
      cart.refresh();
    } catch (error) { setError(error instanceof Error ? error.message : "Annulation impossible."); }
    finally { setPending(false); }
  }
  return <div className="form-notice cart-attempt"><p>Une tentative de paiement doit être vérifiée avant de modifier le panier. Les pièces peuvent encore être réservées.</p><button type="button" className="button button--ghost" disabled={pending} onClick={cancel}>{pending ? "Vérification…" : "Annuler et vérifier cette tentative"}</button><Link href="/contact">Contacter l’atelier</Link>{error ? <p role="alert">{error}</p> : null}</div>;
}

export function EmptyCart() {
  return <div className="cart-empty"><span className="eyebrow">Votre prochaine pièce vous attend</span><h2>Tout commence par un choix.</h2><p>Votre panier est vide. Découvrez les pièces disponibles à l’atelier.</p><Link className="button button--primary" href="/boutique">Découvrir la boutique ↗</Link></div>;
}

export function OrderingUnavailable() {
  return <div className="form-notice"><p>Les commandes en ligne ne sont pas encore ouvertes. Vous pouvez préparer votre panier et échanger avec l’atelier pour votre projet.</p><Link className="text-link" href="/contact">Contacter l’atelier ↗</Link></div>;
}

export function DeliveryOptions({ cart, disabled = false, estimate = false }: { cart: CartState; disabled?: boolean; estimate?: boolean }) {
  const { delivery, updateDelivery, quotePending } = cart;
  const quote = cart.quote ?? cart.previousQuote;
  return <fieldset className="cart-delivery" disabled={disabled}>
    <legend>{estimate ? "Estimer la réception" : "Réception de votre commande"}</legend>
    <label className="request-consent"><input type="radio" name="method" checked={delivery.method === "pickup"} onChange={() => updateDelivery({ ...delivery, method: "pickup" })} />Retrait gratuit à l’atelier, sur rendez-vous</label>
    <label className="request-consent"><input type="radio" name="method" checked={delivery.method === "shipping"} onChange={() => updateDelivery({ ...delivery, method: "shipping" })} />Livraison</label>
    {delivery.method === "shipping" ? <>
      {quote?.shippable && quote.countries.length ? <div className="cart-destination"><label>Pays<select value={delivery.country} onChange={event => updateDelivery({ ...delivery, country: event.target.value, zoneId: "" })}>
        {!quote.countries.includes(delivery.country) ? <option value={delivery.country}>Choisir un pays</option> : null}
        {quote.countries.map(country => <option key={country} value={country}>{new Intl.DisplayNames(["fr"], { type: "region" }).of(country)}</option>)}
      </select></label><label>Code postal<input value={delivery.postalCode} maxLength={20} autoComplete="postal-code" onChange={event => updateDelivery({ ...delivery, postalCode: event.target.value, zoneId: "" })} /></label></div> : null}
      {quotePending ? <p role="status">Vérification des tarifs…</p> : quote?.shippingZones.length ? quote.shippingZones.map(zone => <label className="request-consent" key={zone.id}><input type="radio" name="shippingZone" checked={delivery.zoneId === zone.id} onChange={() => updateDelivery({ ...delivery, zoneId: zone.id })} />{zone.name} — {formatMoneyCents(zone.priceCents)}</label>) : <p className="cart-hint">{quote?.shippable && quote.countries.length && !delivery.postalCode ? "Renseignez votre code postal pour connaître les tarifs." : "Aucun tarif automatique disponible pour ce panier ou cette destination."} <Link href="/contact">Demander un devis de transport</Link>.</p>}
    </> : null}
  </fieldset>;
}

export function CartTotals({ cart }: { cart: CartState }) {
  const { quote, quotePending, delivery } = cart;
  const shipping = delivery.method === "pickup" ? 0 : quote?.shippingZones.find(zone => zone.id === delivery.zoneId)?.priceCents;
  const ready = !!quote?.canCheckout && shipping !== undefined;
  return <div className="cart-totals" aria-live="polite" aria-busy={quotePending}>
    <div><span>{quote && !quote.canCheckout ? "Sous-total des articles disponibles" : "Sous-total"}</span><strong>{quote ? formatMoneyCents(quote.subtotalCents) : "À actualiser"}</strong></div>
    <div><span>{delivery.method === "pickup" ? "Retrait à l’atelier" : "Livraison"}</span><span>{shipping === 0 ? "Gratuit" : shipping === undefined ? "À déterminer" : formatMoneyCents(shipping)}</span></div>
    <div className="cart-totals__total"><span>Total estimé</span><strong>{ready ? formatMoneyCents(quote.subtotalCents + shipping) : "À confirmer"}</strong></div>
    {quotePending ? <p className="cart-hint" role="status">Actualisation des prix et du stock…</p> : null}
    {quote && !quote.canCheckout ? <p className="cart-hint">Corrigez les articles signalés pour obtenir le total complet.</p> : null}
  </div>;
}
