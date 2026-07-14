import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";

type GlobalWithPrisma = typeof globalThis & {
  kayartPrisma?: PrismaClient;
};

const globalForPrisma = globalThis as GlobalWithPrisma;

export function getPrismaClient() {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is required when KAYART_DATA_SOURCE=prisma.");
  }

  if (!globalForPrisma.kayartPrisma) {
    const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
    globalForPrisma.kayartPrisma = new PrismaClient({ adapter });
  }

  return globalForPrisma.kayartPrisma;
}
