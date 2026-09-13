"use client";
import { useState } from "react";
import { cartStorageKey, normalizeCart, type CartItem } from "@/lib/cart";
export function AddToCart({ productId, maxQuantity }: { productId: string; maxQuantity: number }) {
  const [message, setMessage] = useState("");
  return <div><button className="button button--primary" type="button" onClick={() => {
    try {
      let items: CartItem[]; try { items = normalizeCart(JSON.parse(localStorage.getItem(cartStorageKey) || "[]")); } catch { items = []; }
      const existing = items.find(item => item.productId === productId);
      if (existing && existing.quantity >= Math.min(10, maxQuantity)) { setMessage("La quantité disponible est déjà dans votre panier."); return; }
      if (existing) existing.quantity++; else items.push({ productId, quantity: 1 });
      localStorage.setItem(cartStorageKey, JSON.stringify(normalizeCart(items))); window.dispatchEvent(new Event("kayart:cart-updated"));
      setMessage("Produit ajouté au panier.");
    } catch { setMessage("Le panier n’a pas pu être enregistré dans ce navigateur."); }
  }}>Ajouter au panier</button>{message ? <p role="status">{message} <a href="/panier">Voir le panier</a></p> : null}</div>;
}
