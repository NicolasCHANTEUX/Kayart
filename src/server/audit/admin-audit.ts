import type { Prisma } from "@prisma/client";
import { getPrismaClient } from "@/server/db/prisma";

type AdminAuditInput = {
  actorUserId: string;
  action: string;
  entityType: string;
  entityId: string;
  metadata?: Prisma.InputJsonValue;
};

export async function recordAdminAudit(input: AdminAuditInput) {
  if (process.env.KAYART_DATA_SOURCE !== "prisma") return;
  try {
    await getPrismaClient().auditLog.create({ data: input });
  } catch {
    // The business mutation has already committed. Do not invite a duplicate
    // action because the auxiliary history could not be written.
    console.error(`KayArt audit write failed for ${input.action}.`);
  }
}
