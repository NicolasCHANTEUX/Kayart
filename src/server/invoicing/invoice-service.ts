import { createHash } from "node:crypto";
import { Prisma, type Invoice, type Order, type OrderItem } from "@prisma/client";
import { getPrismaClient } from "@/server/db/prisma";
import { checkoutTransaction } from "@/server/checkout/transactions";
import { getInvoiceConfig } from "./invoice-config";
import { renderInvoicePdf } from "./invoice-pdf";
import { storeInvoicePdf } from "./invoice-storage";
import type { InvoicePdfInput } from "./invoice-types";

const invoiceSeries = "FA";
const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

type InvoiceOrder = Order & { items: OrderItem[] };

type PostalAddress = {
  name: string;
  line1: string;
  line2?: string;
  postalCode: string;
  city: string;
  country: string;
  companyRegistration?: string;
};

export class InvoiceIssuanceError extends Error {}

export function getInvoiceEligibility(order: Pick<InvoiceOrder,
  "isTest" | "paymentStatus" | "status" | "paidAt" | "currency" | "billingAddress" |
  "customerName" | "guestEmail" | "subtotalCents" | "shippingCents" | "totalCents" | "items"
>) {
  if (process.env.KAYART_DATA_SOURCE !== "prisma") {
    return { eligible: false, reason: "La facturation exige le stockage PostgreSQL." };
  }
  if (order.isTest) {
    return { eligible: false, reason: "Une commande de test ne peut jamais produire une facture comptable." };
  }
  if (order.paymentStatus !== "paid" || !order.paidAt) {
    return { eligible: false, reason: "La commande doit être réellement payée avant émission." };
  }
  if (order.status === "cancelled" || order.status === "refunded") {
    return { eligible: false, reason: "Une commande annulée ou remboursée n'est pas facturable." };
  }
  if (order.currency !== "EUR") {
    return { eligible: false, reason: "Cette première version de la facturation accepte uniquement les euros." };
  }
  const address = parsePostalAddress(order.billingAddress);
  if (!address || !order.customerName?.trim() || !order.guestEmail.trim()) {
    return { eligible: false, reason: "Le nom, l'e-mail et l'adresse de facturation du client doivent être complets." };
  }
  if (!order.items.length || order.items.some(item =>
    !Number.isSafeInteger(item.quantity) || item.quantity <= 0
    || !Number.isSafeInteger(item.unitPriceCents) || item.unitPriceCents < 0
    || !Number.isSafeInteger(item.totalCents) || item.totalCents < 0
    || item.unitPriceCents * item.quantity !== item.totalCents
  )) {
    return { eligible: false, reason: "Les lignes de la commande ne permettent pas d'établir une facture fiable." };
  }
  const linesTotal = order.items.reduce((sum, item) => sum + item.totalCents, 0);
  if (linesTotal !== order.subtotalCents || order.subtotalCents + order.shippingCents !== order.totalCents || order.totalCents <= 0) {
    return { eligible: false, reason: "Les totaux de la commande sont incohérents." };
  }
  const config = getInvoiceConfig();
  if (!config.enabled) {
    return { eligible: false, reason: "L'émission de factures est désactivée." };
  }
  if (!config.ready) {
    return { eligible: false, reason: `Configuration juridique ou fiscale incomplète : ${config.missing.join(", ")}.` };
  }
  return { eligible: true, reason: null };
}

export async function issueInvoice(orderId: string, actorUserId: string) {
  if (!uuidPattern.test(orderId) || !uuidPattern.test(actorUserId)) {
    throw new InvoiceIssuanceError("Commande ou administrateur invalide.");
  }

  let invoice: Invoice;
  try {
    invoice = await reserveInvoice(orderId, actorUserId);
  } catch (error) {
    if (isPrismaUniqueConflict(error)) {
      const existing = await getPrismaClient().invoice.findUnique({ where: { orderId } });
      if (existing) return archiveInvoice(existing, actorUserId);
    }
    throw error;
  }
  return archiveInvoice(invoice, actorUserId);
}

async function reserveInvoice(orderId: string, actorUserId: string) {
  return checkoutTransaction(async tx => {
    const existing = await tx.invoice.findUnique({ where: { orderId } });
    if (existing) return existing;

    const order = await tx.order.findUnique({ where: { id: orderId }, include: { items: true } });
    if (!order) throw new InvoiceIssuanceError("Commande introuvable.");
    const eligibility = getInvoiceEligibility(order);
    if (!eligibility.eligible) throw new InvoiceIssuanceError(eligibility.reason ?? "Cette commande n'est pas facturable.");

    const config = getInvoiceConfig();
    await tx.invoiceSequence.upsert({
      where: { series: invoiceSeries },
      create: { series: invoiceSeries, currentYear: 0, lastNumber: 0 },
      update: {}
    });
    const sequenceRows = await tx.$queryRaw<Array<{ currentYear: number; lastNumber: number }>>(Prisma.sql`
      SELECT current_year AS "currentYear", last_number AS "lastNumber"
      FROM invoice_sequences
      WHERE series = ${invoiceSeries}
      FOR UPDATE
    `);
    const sequence = sequenceRows[0];
    if (!sequence) throw new InvoiceIssuanceError("Compteur de factures indisponible.");
    const clockRows = await tx.$queryRaw<Array<{ issuedAt: Date; issueYear: number }>>(Prisma.sql`
      SELECT clock_timestamp() AS "issuedAt",
             EXTRACT(YEAR FROM clock_timestamp() AT TIME ZONE 'Europe/Paris')::int AS "issueYear"
    `);
    const clock = clockRows[0];
    if (!clock) throw new InvoiceIssuanceError("Horodatage de facturation indisponible.");
    const sequenceNumber = sequence.currentYear === clock.issueYear ? sequence.lastNumber + 1 : 1;
    if (!Number.isSafeInteger(sequenceNumber) || sequenceNumber <= 0 || sequenceNumber > 999999) {
      throw new InvoiceIssuanceError("La série annuelle de factures est épuisée.");
    }
    const invoiceNumber = `${invoiceSeries}-${clock.issueYear}-${String(sequenceNumber).padStart(6, "0")}`;
    const snapshots = buildInvoiceSnapshots(order, config);

    await tx.invoiceSequence.update({
      where: { series: invoiceSeries },
      data: { currentYear: clock.issueYear, lastNumber: sequenceNumber, lastIssuedAt: clock.issuedAt, updatedAt: clock.issuedAt }
    });
    const created = await tx.invoice.create({
      data: {
        orderId: order.id,
        orderNumber: order.orderNumber,
        series: invoiceSeries,
        sequenceYear: clock.issueYear,
        sequenceNumber,
        invoiceNumber,
        issuedAt: clock.issuedAt,
        saleDate: order.paidAt!,
        issuedByUserId: actorUserId,
        currency: order.currency,
        subtotalExclTaxCents: snapshots.totals.subtotalExclTaxCents,
        shippingExclTaxCents: snapshots.totals.shippingExclTaxCents,
        totalExclTaxCents: snapshots.totals.totalExclTaxCents,
        taxCents: snapshots.totals.taxCents,
        totalInclTaxCents: order.totalCents,
        sellerSnapshot: toJson(snapshots.seller),
        buyerSnapshot: toJson(snapshots.buyer),
        linesSnapshot: toJson(snapshots.lines),
        taxSnapshot: toJson(snapshots.tax),
        paymentSnapshot: toJson(snapshots.payment)
      }
    });
    await tx.auditLog.create({
      data: {
        actorUserId,
        action: "invoice.issued",
        entityType: "Invoice",
        entityId: created.id,
        metadata: { invoiceNumber, orderId: order.id, orderNumber: order.orderNumber }
      }
    });
    return created;
  });
}

async function archiveInvoice(invoice: Invoice, actorUserId: string) {
  if (invoice.archiveStatus === "ready") return invoice;
  try {
    // The renderer performs a complete runtime validation of every snapshot.
    const bytes = await renderInvoicePdf(invoice as unknown as InvoicePdfInput);
    const sha256 = createHash("sha256").update(bytes).digest("hex");
    const stored = await storeInvoicePdf({
      invoiceId: invoice.id,
      invoiceNumber: invoice.invoiceNumber,
      issuedAt: invoice.issuedAt,
      bytes,
      sha256
    });
    const prisma = getPrismaClient();
    await prisma.$transaction(async tx => {
      const changed = await tx.invoice.updateMany({
        where: { id: invoice.id, archiveStatus: { not: "ready" } },
        data: {
          archiveStatus: "ready",
          storageBucket: stored.bucket,
          storagePath: stored.path,
          pdfSha256: sha256,
          pdfSizeBytes: stored.sizeBytes,
          archivedAt: new Date(),
          updatedAt: new Date()
        }
      });
      if (changed.count) {
        await tx.auditLog.create({
          data: {
            actorUserId,
            action: "invoice.archived",
            entityType: "Invoice",
            entityId: invoice.id,
            metadata: { invoiceNumber: invoice.invoiceNumber, orderId: invoice.orderId, sha256 }
          }
        });
      }
    });
    return prisma.invoice.findUniqueOrThrow({ where: { id: invoice.id } });
  } catch {
    const prisma = getPrismaClient();
    const concurrentlyArchived = await prisma.invoice.findUnique({ where: { id: invoice.id } }).catch(() => null);
    if (concurrentlyArchived?.archiveStatus === "ready") return concurrentlyArchived;
    await prisma.invoice.updateMany({
      where: { id: invoice.id, archiveStatus: { not: "ready" } },
      data: { archiveStatus: "failed", updatedAt: new Date() }
    }).catch(() => undefined);
    await prisma.auditLog.create({
      data: {
        actorUserId,
        action: "invoice.archive_failed",
        entityType: "Invoice",
        entityId: invoice.id,
        metadata: { invoiceNumber: invoice.invoiceNumber, orderId: invoice.orderId }
      }
    }).catch(() => undefined);
    throw new InvoiceIssuanceError(
      `La facture ${invoice.invoiceNumber} a bien été numérotée, mais son archivage PDF doit être relancé.`
    );
  }
}

export function buildInvoiceSnapshots(order: InvoiceOrder, config = getInvoiceConfig()) {
  const billingAddress = parsePostalAddress(order.billingAddress);
  if (!billingAddress) throw new InvoiceIssuanceError("Adresse de facturation incomplète.");
  const shippingAddress = parsePostalAddress(order.shippingAddress);
  const regime = config.tax.regime;
  if (!regime) throw new InvoiceIssuanceError("Régime fiscal non configuré.");
  const rateBps = regime === "vat" ? config.tax.rateBps : null;
  if (regime === "vat" && rateBps === null) throw new InvoiceIssuanceError("Taux de TVA non configuré.");
  const lines = order.items.map((item, index) => {
    const unitExclTaxCents = rateBps === null ? item.unitPriceCents : netFromGross(item.unitPriceCents, rateBps);
    const totalExclTaxCents = unitExclTaxCents * item.quantity;
    if (!Number.isSafeInteger(totalExclTaxCents) || totalExclTaxCents > item.totalCents) {
      throw new InvoiceIssuanceError("Calcul fiscal impossible pour une ligne de commande.");
    }
    return {
      position: index + 1,
      reference: item.productSku || `LIGNE-${index + 1}`,
      description: item.productName,
      quantity: item.quantity,
      unitPriceInclTaxCents: item.unitPriceCents,
      unitPriceExclTaxCents: unitExclTaxCents,
      taxRateBps: rateBps,
      totalExclTaxCents,
      taxCents: item.totalCents - totalExclTaxCents,
      totalInclTaxCents: item.totalCents
    };
  });
  const subtotalExclTaxCents = lines.reduce((sum, line) => sum + line.totalExclTaxCents, 0);
  const shippingExclTaxCents = rateBps === null ? order.shippingCents : netFromGross(order.shippingCents, rateBps);
  const totalExclTaxCents = subtotalExclTaxCents + shippingExclTaxCents;
  const taxCents = order.totalCents - totalExclTaxCents;
  if ([subtotalExclTaxCents, shippingExclTaxCents, totalExclTaxCents, taxCents].some(value => !Number.isSafeInteger(value) || value < 0)) {
    throw new InvoiceIssuanceError("Calcul fiscal impossible pour cette commande.");
  }
  return {
    seller: config.seller,
    buyer: {
      name: order.customerName!.trim(),
      email: order.guestEmail,
      registration: billingAddress.companyRegistration,
      billingAddress: withoutRegistration(billingAddress),
      ...(shippingAddress ? { shippingAddress: withoutRegistration(shippingAddress) } : {})
    },
    lines,
    tax: {
      regime,
      rateBps,
      statement: config.tax.statement,
      operationCategory: config.operationCategory,
      legalNotices: config.legalNotices,
      breakdown: [{ label: rateBps === null ? "TVA non applicable" : `TVA ${(rateBps / 100).toLocaleString("fr-FR")} %`, rateBps, baseCents: totalExclTaxCents, taxCents }]
    },
    payment: {
      method: order.stripePaymentIntentId ? "Carte bancaire" : "Paiement enregistré manuellement",
      paidAt: order.paidAt!.toISOString(),
      dueDate: order.paidAt!.toISOString(),
      terms: config.paymentTerms
    },
    totals: { subtotalExclTaxCents, shippingExclTaxCents, totalExclTaxCents, taxCents }
  };
}

function parsePostalAddress(value: Prisma.JsonValue | null): PostalAddress | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const record = value as Record<string, unknown>;
  const text = (key: string) => typeof record[key] === "string" ? record[key].trim() : "";
  const address = {
    name: text("name"), line1: text("line1"), line2: text("line2") || undefined,
    postalCode: text("postalCode"), city: text("city"), country: text("country").toUpperCase(),
    companyRegistration: text("companyRegistration") || undefined
  };
  if (!address.name || !address.line1 || !address.postalCode || !address.city || !/^[A-Z]{2}$/.test(address.country)) return null;
  return address;
}

function withoutRegistration(address: PostalAddress) {
  return {
    name: address.name,
    line1: address.line1,
    ...(address.line2 ? { line2: address.line2 } : {}),
    postalCode: address.postalCode,
    city: address.city,
    country: address.country
  };
}

function netFromGross(grossCents: number, rateBps: number) {
  return Math.round(grossCents * 10000 / (10000 + rateBps));
}

function toJson(value: unknown): Prisma.InputJsonValue {
  return JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue;
}

function isPrismaUniqueConflict(error: unknown) {
  return typeof error === "object" && error !== null && "code" in error && error.code === "P2002";
}
