import { getLegalConfig } from "@/config/legal";
import type { InvoiceSellerSnapshot, InvoiceTaxRegime } from "./invoice-types";

const siretPattern = /^\d{14}$/u;
const vatNumberPattern = /^[A-Z]{2}[A-Z0-9]{2,13}$/u;
const bucketPattern = /^[a-z0-9][a-z0-9_-]{0,62}$/u;

export type InvoiceConfiguration = {
  enabled: boolean;
  ready: boolean;
  missing: string[];
  seller: InvoiceSellerSnapshot;
  tax: {
    regime: InvoiceTaxRegime | null;
    rateBps: number | null;
    statement: string;
  };
  operationCategory: string;
  paymentTerms: string;
  legalNotices: string;
  storageBucket: string;
};

export type ReadyInvoiceConfiguration = Omit<InvoiceConfiguration, "ready" | "missing" | "tax"> & {
  ready: true;
  missing: [];
  tax: InvoiceConfiguration["tax"] & { regime: InvoiceTaxRegime };
};

export class InvoiceConfigurationError extends Error {
  readonly missing: string[];

  constructor(missing: string[]) {
    super(`Configuration de facturation incomplète : ${missing.join(", ")}.`);
    this.name = "InvoiceConfigurationError";
    this.missing = missing;
  }
}

export function getInvoiceConfig(): InvoiceConfiguration {
  const legal = getLegalConfig();
  const missing = new Set<string>();
  if (process.env.KAYART_LEGAL_APPROVED !== "true") missing.add("KAYART_LEGAL_APPROVED");
  const relevantLegalFields: Record<string, string> = {
    legalName: "KAYART_LEGAL_NAME",
    legalForm: "KAYART_LEGAL_FORM",
    legalAddress: "KAYART_LEGAL_ADDRESS",
    registration: "KAYART_LEGAL_REGISTRATION",
    taxStatement: "KAYART_LEGAL_TAX_STATEMENT"
  };
  legal.missing.forEach((field) => {
    const environmentName = relevantLegalFields[field];
    if (environmentName) missing.add(environmentName);
  });
  const value = (name: string, raw: string | undefined, maxLength: number) => {
    const normalized = (raw ?? "").trim();
    if (!normalized || normalized.length > maxLength) missing.add(name);
    return normalized;
  };

  const legalName = value("KAYART_LEGAL_NAME", legal.legalName, 240);
  const legalForm = value("KAYART_LEGAL_FORM", legal.legalForm, 160);
  const legalAddress = value("KAYART_LEGAL_ADDRESS", legal.legalAddress, 1200);
  const registration = value("KAYART_LEGAL_REGISTRATION", legal.registration, 500);
  const statement = value("KAYART_LEGAL_TAX_STATEMENT", legal.taxStatement, 1000);
  const rawSiret = value("KAYART_INVOICE_SIRET", process.env.KAYART_INVOICE_SIRET, 32);
  const siret = rawSiret.replace(/[\s.-]/gu, "");
  if (rawSiret && !siretPattern.test(siret)) missing.add("KAYART_INVOICE_SIRET");

  const rawRegime = (process.env.KAYART_INVOICE_TAX_REGIME ?? "").trim().toLowerCase();
  const regime: InvoiceTaxRegime | null = rawRegime === "franchise" || rawRegime === "vat" ? rawRegime : null;
  if (!regime) missing.add("KAYART_INVOICE_TAX_REGIME");
  if (regime === "franchise" && (!/tva\s+non\s+applicable/iu.test(statement) || !/\b293\s*b\b/iu.test(statement))) {
    missing.add("KAYART_LEGAL_TAX_STATEMENT");
  }

  const rawVatNumber = (process.env.KAYART_INVOICE_VAT_NUMBER ?? "").trim().toUpperCase().replace(/[\s.-]/gu, "");
  if (regime === "vat" && (!rawVatNumber || !vatNumberPattern.test(rawVatNumber))) missing.add("KAYART_INVOICE_VAT_NUMBER");

  const rawRate = (process.env.KAYART_INVOICE_VAT_RATE_BPS ?? "").trim();
  const parsedRate = /^\d{1,5}$/u.test(rawRate) ? Number(rawRate) : Number.NaN;
  const rateBps = regime === "vat" && Number.isSafeInteger(parsedRate) && parsedRate >= 0 && parsedRate <= 10_000
    ? parsedRate
    : null;
  if (regime === "vat" && rateBps === null) missing.add("KAYART_INVOICE_VAT_RATE_BPS");

  const operationCategory = value("KAYART_INVOICE_OPERATION_CATEGORY", process.env.KAYART_INVOICE_OPERATION_CATEGORY, 300);
  const paymentTerms = value("KAYART_INVOICE_PAYMENT_TERMS", process.env.KAYART_INVOICE_PAYMENT_TERMS, 1000);
  const legalNotices = value("KAYART_INVOICE_LEGAL_NOTICES", process.env.KAYART_INVOICE_LEGAL_NOTICES, 4000);
  const storageBucket = value("SUPABASE_INVOICE_BUCKET", process.env.SUPABASE_INVOICE_BUCKET, 63);
  if (storageBucket && !bucketPattern.test(storageBucket)) missing.add("SUPABASE_INVOICE_BUCKET");

  const addressLines = legalAddress
    .split(/\r?\n/u)
    .map((line) => line.trim())
    .filter(Boolean);
  if (!addressLines.length) missing.add("KAYART_LEGAL_ADDRESS");

  const email = legal.email.trim();
  const seller: InvoiceSellerSnapshot = {
    legalName,
    legalForm,
    addressLines,
    registration,
    siret,
    ...(regime === "vat" && rawVatNumber ? { vatNumber: rawVatNumber } : {}),
    ...(email ? { email } : {}),
    ...(legal.commercialName.trim() ? { commercialName: legal.commercialName.trim() } : {})
  };
  const missingList = [...missing].sort();
  const enabled = process.env.KAYART_INVOICING_ENABLED === "true";

  return {
    enabled,
    ready: enabled && missingList.length === 0,
    missing: missingList,
    seller,
    tax: { regime, rateBps, statement },
    operationCategory,
    paymentTerms,
    legalNotices,
    storageBucket
  };
}

export function requireInvoiceConfig(): ReadyInvoiceConfiguration {
  const config = getInvoiceConfig();
  const missing = config.enabled ? config.missing : ["KAYART_INVOICING_ENABLED", ...config.missing];
  if (!config.ready || !config.tax.regime) throw new InvoiceConfigurationError([...new Set(missing)]);
  return config as ReadyInvoiceConfiguration;
}

