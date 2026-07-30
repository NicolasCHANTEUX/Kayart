export type OrderStatus =
  | "pending"
  | "paid"
  | "preparing"
  | "ready"
  | "shipped"
  | "completed"
  | "cancelled"
  | "refunded";

export type PaymentStatus = "pending" | "paid" | "failed" | "cancelled" | "refunded";

export type AdminOrderItem = {
  id: string;
  productId: string | null;
  productName: string;
  productSku: string | null;
  quantity: number;
  unitPriceCents: number;
  totalCents: number;
};

export type AdminOrder = {
  id: string;
  orderNumber: string;
  guestEmail: string;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  currency: "EUR";
  subtotalCents: number;
  shippingCents: number;
  totalCents: number;
  customerNote: string | null;
  paidAt: string | null;
  createdAt: string;
  items: AdminOrderItem[];
};
