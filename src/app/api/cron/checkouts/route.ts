import { timingSafeEqual } from "node:crypto";
import { getPrismaClient } from "@/server/db/prisma";
import { reconcileCheckout } from "@/server/checkout/reconciliation";
export const maxDuration = 60;
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  const actual = Buffer.from(request.headers.get("authorization") || "");
  const expected = Buffer.from(secret ? `Bearer ${secret}` : "");
  if (!secret || actual.length !== expected.length || !timingSafeEqual(actual, expected)) return new Response(null, { status: 401 });
  const started = Date.now();
  const orders = await getPrismaClient().order.findMany({ where: { isTest: true, paymentStatus: "pending", checkoutKey: { not: null }, checkoutHolds: { some: { status: "active", expiresAt: { lte: new Date() } } } }, select: { id: true, checkoutKey: true }, take: 25, orderBy: [{ updatedAt: "asc" }, { id: "asc" }] });
  let reconciled = 0, needsReview = 0, failed = 0;
  for (const order of orders) {
    // Rotate failed/ambiguous attempts so the oldest 25 cannot starve later orders.
    // Keep headroom for one Stripe operation, including SDK retries.
    if (Date.now() - started > 5000) break;
    try { await getPrismaClient().order.updateMany({ where: { id: order.id, paymentStatus: "pending" }, data: { updatedAt: new Date() } }); const result = await reconcileCheckout(order.checkoutKey!); if (result.needsReview) needsReview++; else if (result.status !== "pending") reconciled++; }
    catch { failed++; }
  }
  return Response.json({ reconciled, needsReview, failed });
}
