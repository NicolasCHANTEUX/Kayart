import { getPrismaClient } from "@/server/db/prisma";
import { requireAdminSession } from "@/server/auth/session";
import { requestStatuses, type RequestKind, type CustomerRequestStatus } from "@/lib/customer-requests";
import type { CustomerRequestInput } from "@/server/requests/request-input";
import { removePrivateRequestImages, storePrivateRequestImages } from "@/server/requests/private-images";

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
      // A concurrent retry can win the unique submission key; only that conflict is success.
      const saved = input.kind === "contact" ? await prisma.contactRequest.findUnique(lookup)
        : input.kind === "repair" ? await prisma.repairRequest.findUnique(lookup) : await prisma.customRequest.findUnique(lookup);
      if (saved) return;
    }
    throw error;
  }
}

export async function listAdminRequests(kind: RequestKind, page: number, status?: CustomerRequestStatus) {
  await requireAdminSession();
  const prisma = getPrismaClient();
  const query = { where: status ? { status } : {}, orderBy: [{ createdAt: "desc" as const }, { id: "desc" as const }], take: 26, skip: (page - 1) * 25 };
  const rows = kind === "contact" ? await prisma.contactRequest.findMany(query) : kind === "repair" ? await prisma.repairRequest.findMany(query) : await prisma.customRequest.findMany(query);
  const displayed = rows.slice(0, 25);
  const media = displayed.length ? await prisma.requestMedia.findMany({ where: { requestType: kind, requestId: { in: displayed.map(row => row.id) }, mediaAsset: { visibility: "private", bucket: "request-images" } }, select: { requestId: true, mediaAssetId: true } }) : [];
  return {
    hasNext: rows.length > 25,
    requests: displayed.map(row => ({ id: row.id, name: row.name, email: row.email, phone: row.phone, status: row.status,
      createdAt: row.createdAt.toISOString(), updatedAt: row.updatedAt.toISOString(),
      subject: "subject" in row ? row.subject : "productType" in row ? row.productType || "Réparation" : row.discipline || "Projet sur mesure",
      message: "message" in row ? row.message : "damageDescription" in row ? row.damageDescription : row.projectDescription,
      details: "projectDescription" in row ? [row.practiceLevel && `Pratique : ${row.practiceLevel}`, row.constraints && `Contraintes : ${row.constraints}`, row.budgetHint && `Budget : ${row.budgetHint}`].filter(Boolean).join("\n") : "",
      imageIds: media.filter(image => image.requestId === row.id).map(image => image.mediaAssetId)
    }))
  };
}

export async function updateAdminRequestStatus(kind: RequestKind, id: string, status: CustomerRequestStatus, updatedAt: string) {
  await requireAdminSession();
  if (!requestStatuses.includes(status)) throw new Error("Statut invalide.");
  const prisma = getPrismaClient();
  const query = { where: { id, updatedAt: new Date(updatedAt) }, data: { status, updatedAt: new Date() } };
  const result = kind === "contact" ? await prisma.contactRequest.updateMany(query) : kind === "repair" ? await prisma.repairRequest.updateMany(query) : await prisma.customRequest.updateMany(query);
  if (!result.count) throw new Error("Cette demande a changé. Rechargez la page avant de réessayer.");
}
