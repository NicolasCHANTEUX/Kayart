"use client";
import { useEffect } from "react";
import { cartStorageKey, normalizeCart, type CartItem } from "@/lib/cart";
export function ClearPaidCart({ checkoutKey, purchased }: { checkoutKey: string; purchased: CartItem[] }) {
  useEffect(() => {
    try {
      if (localStorage.getItem("kayart-checkout-attempt-v1") !== checkoutKey) return;
      const cart = normalizeCart(JSON.parse(localStorage.getItem(cartStorageKey) || "[]"));
      const remaining = cart.map(item => ({ ...item, quantity: item.quantity - (purchased.find(line => line.productId === item.productId)?.quantity ?? 0) })).filter(item => item.quantity > 0);
      localStorage.setItem(cartStorageKey, JSON.stringify(remaining)); window.dispatchEvent(new Event("kayart:cart-updated"));
      localStorage.removeItem("kayart-checkout-attempt-v1");
    } catch { /* Storage may be disabled; payment confirmation remains authoritative. */ }
  }, [checkoutKey, purchased]);
  return null;
}
