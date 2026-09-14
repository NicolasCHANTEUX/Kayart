"use client";
import Link from "next/link";
import { formatMoneyCents } from "@/lib/format";
import { ProductImageView } from "@/components/catalog/product-image";
import { useCart } from "./use-cart";
import { CartFeedback, CartTotals, DeliveryOptions, EmptyCart, OrderingUnavailable, PendingAttempt } from "./cart-shared";

const conditions = { new: "Neuf", imperfect: "Imparfait", used: "Occasion", service: "Service" };

export function CartPage({ pendingCheckout }: { pendingCheckout?: string }) {
  const cart = useCart(pendingCheckout);
  if (!cart.loaded) return <p role="status">Chargement du panier…</p>;
  const locked = !!cart.attemptKey;
  const canContinue = !cart.storageError && !locked && cart.quote?.canCheckout && cart.quote.testCheckoutEnabled && (cart.delivery.method === "pickup" || cart.quote.shippingZones.some(zone => zone.id === cart.delivery.zoneId));
  return <div className="cart-layout">
    <CartFeedback cart={cart} />
    <PendingAttempt cart={cart} />
    {!cart.items.length && !cart.storageError ? <EmptyCart /> : cart.items.length ? <div className="cart-workspace">
      <div>
        <ul className="cart-lines cart-products" aria-label="Articles du panier">
          {cart.items.map(item => {
            const line = (cart.quote ?? cart.previousQuote)?.lines.find(line => line.productId === item.productId);
            const issue = cart.quote ? line?.issue : null;
            const changeQuantity = (quantity: number) => {
              if (Number.isInteger(quantity) && quantity >= 1 && quantity <= 10) cart.updateItems(cart.items.map(other => other.productId === item.productId ? { ...other, quantity } : other));
            };
            return <li className={`cart-product${issue ? " cart-product--issue" : ""}`} key={item.productId}>
              <div className="cart-product__image"><ProductImageView src={line?.imageUrl ?? undefined} alt={line?.name ?? "Article du panier"} thumbnail /></div>
              <div className="cart-product__info">
                <p className="cart-product__meta">{line?.condition ? conditions[line.condition] : "Article"}{line?.sku ? ` · ${line.sku}` : ""}</p>
                <h2>{line?.slug ? <Link href={`/boutique/${line.slug}`}>{line.name}</Link> : line?.name ?? "Chargement de l’article…"}</h2>
                <p className="cart-product__price">{line?.unitPriceCents != null ? `${formatMoneyCents(line.unitPriceCents)} / pièce` : "Prix indisponible"}</p>
                {issue ? <p className="cart-product__issue" id={`issue-${item.productId}`}>{line?.message}</p> : cart.quote && !locked ? <p className="cart-product__stock">Disponible</p> : null}
                {issue === "quote_required" ? <Link className="text-link" href="/contact">Échanger avec l’atelier</Link> : null}
              </div>
              <div className="cart-product__controls">
                <div className="cart-quantity" role="group" aria-label={`Quantité pour ${line?.name ?? "cet article"}`}>
                  <button type="button" disabled={locked || item.quantity <= 1} aria-label={`Réduire la quantité de ${line?.name ?? "cet article"}`} onClick={() => changeQuantity(item.quantity - 1)}>−</button>
                  <input type="number" min={1} max={cart.quote && line ? Math.max(1, line.maxQuantity) : 10} value={item.quantity} aria-label={`Quantité de ${line?.name ?? "cet article"}`} aria-invalid={issue === "stock" || undefined} aria-describedby={issue ? `issue-${item.productId}` : undefined} disabled={locked} onChange={event => changeQuantity(Number(event.target.value))} />
                  <button type="button" disabled={locked || !cart.quote || item.quantity >= (line?.maxQuantity ?? 0) || !!issue} aria-label={`Augmenter la quantité de ${line?.name ?? "cet article"}`} onClick={() => changeQuantity(item.quantity + 1)}>+</button>
                </div>
                <strong>{cart.quote && line?.unitPriceCents != null ? formatMoneyCents(line.unitPriceCents * item.quantity) : "À actualiser"}</strong>
                <button className="cart-remove" type="button" disabled={locked} aria-label={`Retirer ${line?.name ?? "cet article"} du panier`} onClick={() => cart.updateItems(cart.items.filter(other => other.productId !== item.productId))}>Retirer</button>
                {issue === "stock" && line && line.maxQuantity > 0 ? <button type="button" className="cart-adjust" disabled={locked} onClick={() => changeQuantity(line.maxQuantity)}>Passer à {line.maxQuantity}</button> : null}
              </div>
            </li>;
          })}
        </ul>
        <Link className="text-link" href="/boutique">← Continuer mes achats</Link>
      </div>
      <aside className="cart-summary" aria-labelledby="cart-summary-title">
        <h2 id="cart-summary-title">Votre récapitulatif</h2>
        <DeliveryOptions cart={cart} disabled={locked} estimate />
        <CartTotals cart={cart} />
        {canContinue ? <Link className="button button--primary cart-continue" href="/commande">Passer commande — test ↗</Link> : <button className="button button--primary cart-continue" disabled>Passer commande</button>}
        {cart.quote && !cart.quote.testCheckoutEnabled ? <OrderingUnavailable /> : cart.quote?.testCheckoutEnabled ? <p className="cart-hint">Parcours de test uniquement : aucun achat réel. Les coordonnées seront demandées à l’étape suivante.</p> : null}
        <p className="cart-hint">Les prix et le stock sont vérifiés avant le paiement. L’ajout au panier ne réserve pas les pièces.</p>
      </aside>
    </div> : null}
  </div>;
}
