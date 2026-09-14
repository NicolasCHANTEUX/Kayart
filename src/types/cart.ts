import type { CartItem } from "@/lib/cart";
import type { ProductCondition } from "./catalog";

export type CartLine = CartItem & {
  name: string;
  slug: string | null;
  sku: string | null;
  imageUrl: string | null;
  condition: ProductCondition | null;
  unitPriceCents: number | null;
  totalCents: number | null;
  maxQuantity: number;
  deliveryMode: "shippable" | "pickupOnly" | "quote";
  issue: "unavailable" | "quote_required" | "stock" | null;
  message: string | null;
};

export type CartQuote = {
  lines: CartLine[];
  subtotalCents: number;
  canCheckout: boolean;
  pickupCents: number;
  shippable: boolean;
  countries: string[];
  shippingZones: Array<{ id: string; name: string; priceCents: number }>;
  testCheckoutEnabled: boolean;
};

export type CartDelivery = {
  method: "pickup" | "shipping";
  country: string;
  postalCode: string;
  zoneId: string;
};
