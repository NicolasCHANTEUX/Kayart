import { requireAdminSession } from "@/server/auth/session";
import { getPrismaClient } from "@/server/db/prisma";
import { getCatalogRepository } from "./catalog.repository";

export async function getAdminOverview() {
  await requireAdminSession();
  if (process.env.KAYART_DATA_SOURCE !== "prisma") {
    const repo = getCatalogRepository();
    const [products, orders] = await Promise.all([repo.listProducts(), repo.listAdminOrders()]);
    return { products: products.length, orders: orders.length, testOrders: orders.filter(order => order.isTest).length, openRequests: 0 };
  }
  // Counts do not load order contents or customer contact details.
  return getPrismaClient().$transaction(async tx => {
    const where = { status: { in: ["new", "inProgress"] as ("new" | "inProgress")[] }, deletedAt: null };
    const [products, orders, testOrders, contact, repair, custom] = await Promise.all([
      tx.product.count(), tx.order.count(), tx.order.count({ where: { isTest: true } }),
      tx.contactRequest.count({ where }), tx.repairRequest.count({ where }), tx.customRequest.count({ where })
    ]);
    return { products, orders, testOrders, openRequests: contact + repair + custom };
  }, { isolationLevel: "RepeatableRead" });
}
