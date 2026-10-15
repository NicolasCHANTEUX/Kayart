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
  isManual: boolean;
  isTest?: boolean;
  customerName?: string | null;
  fulfillmentMethod?: string | null;
  shippingAddressLines?: string[];
  items: AdminOrderItem[];
};

export type AdminOrderInvoice = {
  id: string;
  invoiceNumber: string;
  issuedAt: string;
  archiveStatus: "pending" | "ready" | "failed";
  subtotalExclTaxCents: number;
  shippingExclTaxCents: number;
  totalExclTaxCents: number;
  taxCents: number;
  totalInclTaxCents: number;
};

export type AdminOrderHistoryEntry = {
  id: string;
  action: string;
  createdAt: string;
  metadata?: Record<string, unknown> | null;
};

export type AdminOrderDetail = AdminOrder & {
  updatedAt: string;
  billingAddressLines: string[];
  shippingAddressLines: string[];
  shippingZoneName: string | null;
  stripeCheckoutSessionId: string | null;
  stripePaymentIntentId: string | null;
  invoice: AdminOrderInvoice | null;
  invoiceEligibility: {
    eligible: boolean;
    reason: string | null;
  };
  history: AdminOrderHistoryEntry[];
};
