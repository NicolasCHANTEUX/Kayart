export type InvoiceTaxRegime = "franchise" | "vat";

export type InvoiceSellerSnapshot = {
  legalName: string;
  legalForm: string;
  addressLines: string[];
  registration: string;
  siret: string;
  vatNumber?: string;
  email?: string;
  commercialName?: string;
};

export type InvoiceAddressSnapshot = {
  name?: string;
  line1: string;
  line2?: string;
  postalCode: string;
  city: string;
  country: string;
};

export type InvoiceBuyerSnapshot = {
  name: string;
  email?: string;
  companyName?: string;
  registration?: string;
  vatNumber?: string;
  billingAddress: InvoiceAddressSnapshot;
  shippingAddress?: InvoiceAddressSnapshot;
};

export type InvoiceLineSnapshot = {
  reference?: string;
  description: string;
  quantity: number;
  unitPriceExclTaxCents: number;
  taxRateBps: number | null;
  totalExclTaxCents: number;
  taxCents: number;
  totalInclTaxCents: number;
};

export type InvoiceTaxBreakdownSnapshot = {
  label: string;
  rateBps: number | null;
  baseCents: number;
  taxCents: number;
};

export type InvoiceTaxSnapshot = {
  regime: InvoiceTaxRegime;
  statement: string;
  operationCategory: string;
  legalNotices: string;
  breakdown: InvoiceTaxBreakdownSnapshot[];
};

export type InvoicePaymentSnapshot = {
  method: string;
  paidAt?: string | Date;
  dueDate?: string | Date;
  terms: string;
};

/**
 * Canonical, immutable input of the PDF renderer. All monetary values are integer cents.
 * The renderer deliberately never reads a product, customer, order or environment variable.
 */
export type InvoicePdfInput = {
  invoiceNumber: string;
  orderNumber: string;
  issuedAt: string | Date;
  saleDate: string | Date;
  currency: string;
  subtotalExclTaxCents: number;
  shippingExclTaxCents: number;
  totalExclTaxCents: number;
  taxCents: number;
  totalInclTaxCents: number;
  sellerSnapshot: InvoiceSellerSnapshot;
  buyerSnapshot: InvoiceBuyerSnapshot;
  linesSnapshot: InvoiceLineSnapshot[];
  taxSnapshot: InvoiceTaxSnapshot;
  paymentSnapshot: InvoicePaymentSnapshot;
};

