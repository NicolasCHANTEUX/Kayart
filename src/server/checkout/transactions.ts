import type { Prisma } from "@prisma/client";
import { getPrismaClient } from "@/server/db/prisma";
export async function checkoutTransaction<T>(operation: (tx: Prisma.TransactionClient) => Promise<T>): Promise<T> {
  for (let attempt = 0; ; attempt++) {
    try { return await getPrismaClient().$transaction(operation, { isolationLevel: "Serializable", maxWait: 5000, timeout: 15000 }); }
    catch (error) {
      if (attempt >= 2 || typeof error !== "object" || !error || !("code" in error) || error.code !== "P2034") throw error;
    }
  }
}
