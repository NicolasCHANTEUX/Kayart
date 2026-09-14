"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { cartStorageKey, normalizeCart, type CartItem } from "@/lib/cart";
import type { CartDelivery, CartQuote } from "@/types/cart";

export const attemptStorageKey = "kayart-checkout-attempt-v1";
const deliveryStorageKey = "kayart-cart-delivery-v1";
const defaultDelivery: CartDelivery = { method: "pickup", country: "FR", postalCode: "", zoneId: "" };

export function useCart(pendingCheckout?: string) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [storageError, setStorageError] = useState("");
  const pendingReturn = useRef(pendingCheckout ?? "");
  const [attemptKey, setAttempt] = useState(pendingCheckout ?? "");
  const setAttemptKey = useCallback((value: string) => { pendingReturn.current = ""; setAttempt(value); }, []);
  const [delivery, setDelivery] = useState<CartDelivery>(defaultDelivery);
  const [revision, setRevision] = useState(0);
  const [previousQuote, setPreviousQuote] = useState<CartQuote | null>(null);
  const [result, setResult] = useState<{ key: string; quote: CartQuote | null; error: string } | null>(null);
  const requestKey = JSON.stringify({ items, country: delivery.country, postalCode: delivery.postalCode, revision });

  const readStorage = useCallback(() => {
    try {
      setItems(normalizeCart(JSON.parse(localStorage.getItem(cartStorageKey) || "[]")));
      const savedAttempt = localStorage.getItem(attemptStorageKey) || "";
      setAttempt(/^[0-9a-f-]{36}$/i.test(savedAttempt) ? savedAttempt : pendingReturn.current);
      setStorageError("");
    } catch { setStorageError("Le panier enregistré est illisible ou le stockage est indisponible. Vous pouvez réessayer ou vider le panier."); }
    setLoaded(true);
  }, []);

  useEffect(() => {
    readStorage();
    try {
      const saved = JSON.parse(sessionStorage.getItem(deliveryStorageKey) || "null");
      if (saved && (saved.method === "pickup" || saved.method === "shipping") && typeof saved.country === "string" && /^[A-Z]{2}$/.test(saved.country) && typeof saved.postalCode === "string" && typeof saved.zoneId === "string") {
        setDelivery({ method: saved.method, country: saved.country, postalCode: saved.postalCode.slice(0, 20), zoneId: saved.zoneId.slice(0, 36) });
      }
    } catch { /* An estimate can be entered again without persistent storage. */ }
    const onStorage = (event: StorageEvent) => {
      if (event.key === null || event.key === cartStorageKey || event.key === attemptStorageKey) readStorage();
    };
    const refresh = () => { readStorage(); setRevision(value => value + 1); };
    window.addEventListener("storage", onStorage);
    window.addEventListener("kayart:cart-updated", readStorage);
    window.addEventListener("focus", refresh);
    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("kayart:cart-updated", readStorage);
      window.removeEventListener("focus", refresh);
    };
  }, [readStorage]);

  useEffect(() => {
    if (!loaded) return;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);
    const timer = setTimeout(async () => {
      try {
        const input = JSON.parse(requestKey);
        const response = await fetch("/api/cart/quote", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(input), signal: controller.signal });
        const payload = await response.json();
        if (!response.ok) throw new Error(payload.error || "Calcul du panier indisponible.");
        if (!controller.signal.aborted) { setPreviousQuote(payload); setResult({ key: requestKey, quote: payload, error: "" }); }
      } catch (error) {
        if (!controller.signal.aborted) setResult({ key: requestKey, quote: null, error: error instanceof Error ? error.message : "Calcul du panier indisponible." });
      } finally { clearTimeout(timeout); }
    }, 250);
    // A timeout must leave the UI actionable; an obsolete request must not replace a new quote.
    const onAbort = () => setResult({ key: requestKey, quote: null, error: "Le calcul prend trop de temps. Réessayez." });
    controller.signal.addEventListener("abort", onAbort);
    return () => { controller.signal.removeEventListener("abort", onAbort); clearTimeout(timer); clearTimeout(timeout); controller.abort(); };
  }, [loaded, requestKey]);

  function updateItems(next: CartItem[]) {
    try {
      if (localStorage.getItem(attemptStorageKey) || attemptKey) return;
      const normalized = normalizeCart(next);
      localStorage.setItem(cartStorageKey, JSON.stringify(normalized));
      setItems(normalized);
      setStorageError("");
      window.dispatchEvent(new Event("kayart:cart-updated"));
    } catch { setStorageError("Les changements n’ont pas pu être enregistrés dans ce navigateur."); }
  }

  function updateDelivery(next: CartDelivery) {
    setDelivery(next);
    try { sessionStorage.setItem(deliveryStorageKey, JSON.stringify(next)); } catch { /* Keep the estimate usable in memory. */ }
  }

  const current = result?.key === requestKey;
  const quote = current ? result.quote : null;
  return {
    items, loaded, storageError, delivery, updateDelivery, updateItems, attemptKey, setAttemptKey,
    quote, previousQuote, quotePending: !current,
    quoteError: current ? result.error : "",
    refresh: () => { readStorage(); setRevision(value => value + 1); }
  };
}

export type CartState = ReturnType<typeof useCart>;
