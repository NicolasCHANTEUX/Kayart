import type { ContactRequest, CustomRequest, RepairRequest } from "@prisma/client";
import { getPrismaClient } from "@/server/db/prisma";
import { requireAdminSession } from "@/server/auth/session";
import { requestKinds, requestStatuses, type RequestKind, type CustomerRequestStatus } from "@/lib/customer-requests";
import type { CustomerRequestInput } from "@/server/requests/request-input";
import { removePrivateRequestImages, storePrivateRequestImages } from "@/server/requests/private-images";

type AdminRequestRow = ContactRequest | RepairRequest | CustomRequest;

function mapAdminRequest(row: AdminRequestRow, imageIds: string[]) {
  return { id: row.id, name: row.name, email: row.email, phone: row.phone, status: row.status,
    createdAt: row.createdAt.toISOString(), updatedAt: row.updatedAt.toISOString(), deletedAt: row.deletedAt?.toISOString() ?? null,
    subject: "subject" in row ? row.subject : "productType" in row ? row.productType || "Réparation" : row.discipline || "Projet sur mesure",
    message: "message" in row ? row.message : "damageDescription" in row ? row.damageDescription : row.projectDescription,
    details: "projectDescription" in row ? [row.practiceLevel && `Pratique : ${row.practiceLevel}`, row.constraints && `Contraintes : ${row.constraints}`, row.budgetHint && `Budget : ${row.budgetHint}`].filter(Boolean).join("\n") : "",
    imageIds };
}

export async function submitCustomerRequest(input: CustomerRequestInput) {
  const prisma = getPrismaClient();
  const lookup = { where: { submissionKey: input.submissionKey }, select: { id: true } };
  const existing = input.kind === "contact" ? await prisma.contactRequest.findUnique(lookup)
    : input.kind === "repair" ? await prisma.repairRequest.findUnique(lookup) : await prisma.customRequest.findUnique(lookup);
  if (existing) return;
  const images = await storePrivateRequestImages(input.files);
  try {
    await prisma.$transaction(async tx => {
      const common = { submissionKey: input.submissionKey, name: input.name, email: input.email, phone: input.phone, privacyAcknowledgedAt: new Date() };
      const row = input.kind === "contact" ? await tx.contactRequest.create({ data: { ...common, subject: input.subject, message: input.message } })
        : input.kind === "repair" ? await tx.repairRequest.create({ data: { ...common, productType: input.productType, damageDescription: input.message } })
        : await tx.customRequest.create({ data: { ...common, discipline: input.discipline || null, practiceLevel: input.practiceLevel || null, projectDescription: input.message, constraints: input.constraints || null, budgetHint: input.budgetHint || null } });
      for (const image of images) {
        await tx.requestMedia.create({ data: { requestType: input.kind, requestId: row.id, mediaAsset: { create: { ...image, bucket: "request-images", mimeType: "image/webp", visibility: "private", altText: "Photo jointe à une demande de réparation" } } } });
      }
    });
  } catch (error) {
    await removePrivateRequestImages(images);
    if (typeof error === "object" && error !== null && "code" in error && error.code === "P2002") {
      const saved = input.kind === "contact" ? await prisma.contactRequest.findUnique(lookup)
        : input.kind === "repair" ? await prisma.repairRequest.findUnique(lookup) : await prisma.customRequest.findUnique(lookup);
      if (saved) return;
    }
    throw error;
  }
}

export async function listAdminRequests(kind: RequestKind, page: number, status?: CustomerRequestStatus, trashed = false) {
  await requireAdminSession();
  const prisma = getPrismaClient();
  const query = { where: { ...(status ? { status } : {}), deletedAt: trashed ? { not: null } : null }, orderBy: [{ createdAt: "desc" as const }, { id: "desc" as const }], take: 26, skip: (page - 1) * 25 };
  const rows = kind === "contact" ? await prisma.contactRequest.findMany(query) : kind === "repair" ? await prisma.repairRequest.findMany(query) : await prisma.customRequest.findMany(query);
  const displayed = rows.slice(0, 25);
  const media = displayed.length ? await prisma.requestMedia.findMany({ where: { requestType: kind, requestId: { in: displayed.map(row => row.id) }, mediaAsset: { visibility: "private", bucket: "request-images" } }, select: { requestId: true, mediaAssetId: true } }) : [];
  return { hasNext: rows.length > 25,
    requests: displayed.map(row => mapAdminRequest(row, media.filter(image => image.requestId === row.id).map(image => image.mediaAssetId))) };
}

export async function getAdminRequest(kind: RequestKind, id: string) {
  await requireAdminSession();
  if (!requestKinds.includes(kind)) return null;
  const prisma = getPrismaClient();
  const where = { id };
  const row = kind === "contact" ? await prisma.contactRequest.findUnique({ where })
    : kind === "repair" ? await prisma.repairRequest.findUnique({ where }) : await prisma.customRequest.findUnique({ where });
  if (!row) return null;
  const media = await prisma.requestMedia.findMany({ where: { requestType: kind, requestId: id, mediaAsset: { visibility: "private", bucket: "request-images" } }, select: { mediaAssetId: true } });
  return mapAdminRequest(row, media.map(image => image.mediaAssetId));
}

export async function updateAdminRequestStatus(kind: RequestKind, id: string, status: CustomerRequestStatus, updatedAt: string, previousStatus: CustomerRequestStatus) {
  await requireAdminSession();
  if (!requestKinds.includes(kind) || !requestStatuses.includes(status) || !requestStatuses.includes(previousStatus)) throw new Error("Statut invalide.");
  const prisma = getPrismaClient();
  const timestamp = new Date(updatedAt);
  if (!Number.isFinite(timestamp.getTime())) throw new Error("Version de la demande invalide.");
  const nextUpdatedAt = new Date(Math.max(Date.now(), timestamp.getTime() + 1));
  const query = { where: { id, status: previousStatus, deletedAt: null, updatedAt: { gte: timestamp, lt: new Date(timestamp.getTime() + 1) } }, data: { status, updatedAt: nextUpdatedAt } };
  const result = kind === "contact" ? await prisma.contactRequest.updateMany(query) : kind === "repair" ? await prisma.repairRequest.updateMany(query) : await prisma.customRequest.updateMany(query);
  if (!result.count) throw new Error("Cette demande a changé. Rechargez la page avant de réessayer.");
  return { status, updatedAt: nextUpdatedAt.toISOString() };
}

export async function setAdminRequestTrashed(kind: RequestKind, id: string, updatedAt: string, trashed: boolean) {
  await requireAdminSession();
  if (!requestKinds.includes(kind)) throw new Error("Type de demande invalide.");
  const timestamp = new Date(updatedAt);
  if (!Number.isFinite(timestamp.getTime())) throw new Error("Version de la demande invalide.");
  const prisma = getPrismaClient();
  const nextUpdatedAt = new Date(Math.max(Date.now(), timestamp.getTime() + 1));
  const nextDeletedAt = trashed ? new Date() : null;
  const query = { where: { id, deletedAt: trashed ? null : { not: null }, updatedAt: { gte: timestamp, lt: new Date(timestamp.getTime() + 1) } },
    data: { deletedAt: nextDeletedAt, updatedAt: nextUpdatedAt } };
  const result = kind === "contact" ? await prisma.contactRequest.updateMany(query) : kind === "repair" ? await prisma.repairRequest.updateMany(query) : await prisma.customRequest.updateMany(query);
  if (!result.count) throw new Error("Cette demande a changé. Rechargez la page avant de réessayer.");
  return { deletedAt: nextDeletedAt?.toISOString() ?? null, updatedAt: nextUpdatedAt.toISOString() };
}
