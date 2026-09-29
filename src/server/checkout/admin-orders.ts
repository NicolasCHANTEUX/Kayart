import { getCatalogRepository } from "@/server/catalog/catalog.repository";
import { mapPrismaAdminOrder } from "@/server/catalog/catalog.mapper";
import { requireAdminSession } from "@/server/auth/session";
import { checkoutTransaction } from "@/server/checkout/transactions";
import { getPrismaClient } from "@/server/db/prisma";
import { getInvoiceEligibility } from "@/server/invoicing/invoice-service";
import { isMissingInvoicingSchemaError } from "@/server/invoicing/invoice-schema";
import type { AdminOrder, AdminOrderDetail } from "@/types/orders";

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function getAdminOrderDetail(id: string): Promise<AdminOrderDetail | null> {
  await requireAdminSession();
  if (!uuidPattern.test(id)) return null;

  if (process.env.KAYART_DATA_SOURCE !== "prisma") {
    const order = (await getCatalogRepository().listAdminOrders()).find((candidate) => candidate.id === id);
    return order ? mapFallbackOrderDetail(order) : null;
  }

  const prisma = getPrismaClient();
  const order = await prisma.order.findUnique({
    where: { id },
    include: {
      items: true,
      shippingZone: {
        select: { name: true }
      }
    }
  });

  if (!order) return null;

  let invoiceSchemaReady = true;
  let invoice: Awaited<ReturnType<typeof findInvoiceForOrder>> = null;
  try {
    invoice = await findInvoiceForOrder(prisma, order.id);
  } catch (error) {
    if (!isMissingInvoicingSchemaError(error)) throw error;
    invoiceSchemaReady = false;
  }

  const entityIds = invoice ? [order.id, invoice.id] : [order.id];
  const historyRows = await prisma.auditLog.findMany({
    where: {
      entityId: { in: entityIds },
      entityType: { in: ["Order", "Invoice", "order", "invoice"] }
    },
    select: {
      id: true,
      action: true,
      createdAt: true,
      metadata: true
    },
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    take: 100
  }).catch(() => []);

  return {
    ...mapPrismaAdminOrder(order),
    updatedAt: order.updatedAt.toISOString(),
    billingAddressLines: addressLines(order.billingAddress),
    shippingAddressLines: addressLines(order.shippingAddress),
    shippingZoneName: order.shippingZone?.name ?? null,
    stripeCheckoutSessionId: order.stripeCheckoutSessionId,
    stripePaymentIntentId: order.stripePaymentIntentId,
    invoice: invoice ? {
      id: invoice.id,
      invoiceNumber: invoice.invoiceNumber,
      issuedAt: invoice.issuedAt.toISOString(),
      archiveStatus: invoice.archiveStatus,
      subtotalExclTaxCents: invoice.subtotalExclTaxCents,
      shippingExclTaxCents: invoice.shippingExclTaxCents,
      totalExclTaxCents: invoice.totalExclTaxCents,
      taxCents: invoice.taxCents,
      totalInclTaxCents: invoice.totalInclTaxCents
    } : null,
    invoiceEligibility: invoiceSchemaReady
      ? getInvoiceEligibility(order)
      : {
          eligible: false,
          reason: "La migration de facturation 20260929_invoices n’est pas encore appliquée à cette base de données."
        },
    history: historyRows.map((entry) => ({
      id: entry.id,
      action: entry.action,
      createdAt: entry.createdAt.toISOString(),
      metadata: metadataRecord(entry.metadata)
    }))
  };
}

function findInvoiceForOrder(prisma: ReturnType<typeof getPrismaClient>, orderId: string) {
  return prisma.invoice.findUnique({
    where: { orderId },
    select: {
      id: true,
      invoiceNumber: true,
      issuedAt: true,
      archiveStatus: true,
      subtotalExclTaxCents: true,
      shippingExclTaxCents: true,
      totalExclTaxCents: true,
      taxCents: true,
      totalInclTaxCents: true
    }
  });
}

export async function advanceTestOrder(id: string, expectedStatus: string) {
  const session = await requireAdminSession();
  if (!uuidPattern.test(id)) throw new Error("Commande invalide.");
  return checkoutTransaction(async tx => {
    const order = await tx.order.findUnique({ where: { id } });
    if (!order?.isTest || order.paymentStatus !== "paid" || !order.stripeCheckoutSessionId || order.status !== expectedStatus) throw new Error("Cette commande ne peut pas avancer.");
    const next = order.status === "paid" ? "preparing"
      : order.status === "preparing" ? (order.fulfillmentMethod === "pickup" ? "ready" : order.fulfillmentMethod === "shipping" ? "shipped" : null)
      : ["ready", "shipped"].includes(order.status) ? "completed" : null;
    if (!next) throw new Error("Transition indisponible.");
    const updated = await tx.order.update({ where: { id }, data: { status: next, updatedAt: new Date() } });
    await tx.auditLog?.create({
      data: {
        actorUserId: session.user.id,
        action: "order.status_changed",
        entityType: "Order",
        entityId: order.id,
        metadata: { from: order.status, to: next }
      }
    });
    return updated;
  });
}

function addressLines(value: unknown) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return [];
  const address = value as Record<string, unknown>;
  const line = (key: string) => typeof address[key] === "string" ? address[key].trim() : "";
  const locality = [line("postalCode"), line("city")].filter(Boolean).join(" ");
  const registration = line("companyRegistration");
  return [
    line("name"),
    line("line1"),
    line("line2"),
    locality,
    line("country"),
    registration ? `Identifiant entreprise : ${registration}` : ""
  ].filter(Boolean);
}

function metadataRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value)
    ? value as Record<string, unknown>
    : null;
}

function mapFallbackOrderDetail(order: AdminOrder): AdminOrderDetail {
  return {
    ...order,
    updatedAt: order.createdAt,
    billingAddressLines: [],
    shippingAddressLines: order.shippingAddressLines ?? [],
    shippingZoneName: null,
    stripeCheckoutSessionId: null,
    stripePaymentIntentId: null,
    invoice: null,
    invoiceEligibility: {
      eligible: false,
      reason: "L’émission de factures nécessite le stockage persistant de l’application."
    },
    history: []
  };
}
