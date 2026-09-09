"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { cartStorageKey, normalizeCart, type CartItem } from "@/lib/cart";
import { formatMoneyCents } from "@/lib/format";
type Quote = { lines: Array<CartItem & { name: string; unitPriceCents: number; totalCents: number; maxQuantity: number }>; subtotalCents: number; shippable: boolean; countries: string[]; shippingZones: Array<{ id: string; name: string; priceCents: number }>; testCheckoutEnabled: boolean };
const attemptStorageKey = "kayart-checkout-attempt-v1";
export function CartPage({ pendingCheckout }: { pendingCheckout?: string }) {
  const [items, setItems] = useState<CartItem[]>([]), [loaded, setLoaded] = useState(false), [quote, setQuote] = useState<Quote | null>(null);
  const [error, setError] = useState(""), [pending, setPending] = useState(false), [checkoutKey, setCheckoutKey] = useState("");
  const [quotePending, setQuotePending] = useState(true);
  const [country, setCountry] = useState("FR"), [postalCode, setPostalCode] = useState(""), [method, setMethod] = useState("pickup"), [zoneId, setZoneId] = useState("");
  const [cancelKey, setCancelKey] = useState(pendingCheckout ?? "");
  const [retryBody, setRetryBody] = useState<Record<string, unknown> | null>(null);
  useEffect(() => { try { setItems(normalizeCart(JSON.parse(localStorage.getItem(cartStorageKey) || "[]"))); const saved = localStorage.getItem(attemptStorageKey); if (saved && /^[0-9a-f-]{36}$/i.test(saved)) setCancelKey(pendingCheckout || saved); } catch { setError("Le stockage local du panier est indisponible ou invalide."); } setLoaded(true); setCheckoutKey(crypto.randomUUID()); }, [pendingCheckout]);
  useEffect(() => {
    if (!loaded) return;
    setQuotePending(true);
    try { localStorage.setItem(cartStorageKey, JSON.stringify(items)); } catch { setError("L’enregistrement local du panier est indisponible."); }
    const controller = new AbortController();
    const timer = setTimeout(() => {
      fetch("/api/cart/quote", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ items, country, postalCode }), signal: controller.signal }).then(async response => {
        const payload = await response.json();
        if (!response.ok) throw new Error(payload.error);
        setQuote(payload); setError("");
      }).catch(error => { if (error.name !== "AbortError") { setQuote(null); setError(error.message || "Calcul du panier impossible."); } }).finally(() => { if (!controller.signal.aborted) setQuotePending(false); });
    }, 250);
    return () => { clearTimeout(timer); controller.abort(); };
  }, [items, loaded, country, postalCode]);
  const shipping = method === "shipping" ? quote?.shippingZones.find(zone => zone.id === zoneId) : null;
  async function checkout(form: FormData) {
    const body = { ...Object.fromEntries(form), items, checkoutKey, method, country, postalCode, shippingZoneId: zoneId, testAcknowledged: form.get("testAcknowledged") === "on" };
    await sendCheckout(body);
  }
  async function sendCheckout(body: Record<string, unknown>) {
    setPending(true); setError("");
    try {
      localStorage.setItem(attemptStorageKey, String(body.checkoutKey));
      setRetryBody(body);
      const response = await fetch("/api/checkout", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error);
      const url = new URL(result.url);
      if (url.protocol !== "https:" || url.hostname !== "checkout.stripe.com") throw new Error("Adresse de paiement invalide.");
      window.location.assign(url.toString());
    } catch (error) { setCancelKey(String(body.checkoutKey)); setError(error instanceof Error ? error.message : "Paiement indisponible."); setPending(false); }
  }
  if (!loaded) return <p role="status">Chargement du panier…</p>;
  return <div className="cart-layout">
    {error ? <p className="form-notice form-notice--error" role="alert">{error}</p> : null}
    {cancelKey ? <div className="form-notice"><p>Une tentative de paiement est en cours. Son stock reste réservé jusqu’à son annulation ou son expiration confirmée par Stripe.</p><button className="button button--ghost" disabled={pending} onClick={async () => {
      setPending(true);
      try { const response = await fetch("/api/checkout/cancel", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ checkoutKey: cancelKey }) }); const result = await response.json(); if (!response.ok || result.status === "pending") throw new Error(result.error || "Confirmation encore en attente. Contactez l’atelier si le problème persiste."); localStorage.removeItem(attemptStorageKey); setCancelKey(""); setRetryBody(null); setCheckoutKey(crypto.randomUUID()); setItems([...items]); }
      catch (error) { setError(error instanceof Error ? error.message : "Annulation impossible."); } finally { setPending(false); }
    }}>Annuler cette tentative</button>{retryBody ? <button className="button button--ghost" disabled={pending} onClick={() => sendCheckout(retryBody)}>Reprendre la même tentative</button> : null}</div> : null}
    {!items.length ? <p>Votre panier est vide. <Link href="/boutique">Découvrir la boutique</Link></p> : <>
      <ul className="cart-lines">{items.map(item => { const line = quote?.lines.find(line => line.productId === item.productId); return <li key={item.productId}><div><strong>{line?.name ?? "Article du panier"}</strong><p>{line ? formatMoneyCents(line.totalCents) : "Prix et stock en cours de vérification"}</p></div><label>Quantité<input type="number" min={1} max={line?.maxQuantity ?? 10} value={item.quantity} disabled={pending || !!cancelKey} onChange={event => { const quantity = Number(event.target.value); if (Number.isInteger(quantity) && quantity > 0 && quantity <= 10) { setItems(items.map(other => other.productId === item.productId ? { ...other, quantity } : other)); setCheckoutKey(crypto.randomUUID()); } }} /></label><button className="button button--ghost" disabled={pending || !!cancelKey} onClick={() => { setItems(items.filter(other => other.productId !== item.productId)); setCheckoutKey(crypto.randomUUID()); }}>Retirer</button></li>; })}</ul>
      <form action={checkout} className="customer-request-form"><fieldset disabled={pending || !!cancelKey}><legend>Réception</legend>
        <label className="request-consent"><input type="radio" name="method" value="pickup" checked={method === "pickup"} onChange={() => setMethod("pickup")} />Retrait atelier gratuit, sur rendez-vous</label>
        {quote?.shippable && quote.countries.length ? <><label>Pays<select value={country} onChange={event => setCountry(event.target.value)}>{quote.countries.map(value => <option key={value} value={value}>{new Intl.DisplayNames(["fr"], { type: "region" }).of(value)}</option>)}</select></label><label>Code postal<input maxLength={20} value={postalCode} onChange={event => setPostalCode(event.target.value)} /></label></> : null}
        {quote?.shippingZones.map(zone => <label className="request-consent" key={zone.id}><input type="radio" name="method" value="shipping" checked={method === "shipping" && zoneId === zone.id} onChange={() => { setMethod("shipping"); setZoneId(zone.id); }} />{zone.name} : {formatMoneyCents(zone.priceCents)}</label>)}
        {!quote?.shippingZones.length ? <p>La livraison automatique n’est pas disponible pour ce panier ou cette destination. Pour un transport particulier ou une autre destination, <Link href="/contact">demandez un devis à l’atelier</Link>.</p> : null}
      </fieldset><fieldset disabled={pending || !!cancelKey}><legend>Coordonnées de test</legend><label>Nom<input name="name" required maxLength={120} autoComplete="name" /></label><label>Email<input name="email" type="email" required maxLength={254} autoComplete="email" /></label>
        {method === "shipping" ? <><label>Adresse<input name="line1" required maxLength={200} autoComplete="address-line1" /></label><label>Complément<input name="line2" maxLength={200} autoComplete="address-line2" /></label><label>Ville<input name="city" required maxLength={100} autoComplete="address-level2" /></label></> : null}
        <p>Total : {quote ? formatMoneyCents(quote.subtotalCents + (shipping?.priceCents ?? 0)) : "…"}</p>
        <label className="request-consent"><input name="testAcknowledged" type="checkbox" required />Je comprends qu’il s’agit d’un paiement de test, sans achat réel. J’utiliserai uniquement des données de test.</label>
        <button className="button button--primary" disabled={quotePending || !quote?.testCheckoutEnabled || (method === "shipping" && !shipping)}>{pending ? "Ouverture…" : "Continuer vers Stripe — test"}</button>
        {!quote?.testCheckoutEnabled ? <p>Le paiement de test n’est pas encore activé. Pour une demande réelle, <Link href="/contact">contactez l’atelier</Link>.</p> : null}
      </fieldset></form>
    </>}
  </div>;
}
