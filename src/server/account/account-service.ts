import type { AuthenticatedUser } from "@/types/auth";
import { getPrismaClient } from "@/server/db/prisma";
import { requireAccountSession } from "@/server/auth/session";

const orderSelect = {
  id: true,
  orderNumber: true,
  createdAt: true,
  status: true,
  paymentStatus: true,
  totalCents: true,
  currency: true,
  isTest: true,
  items: { select: { productName: true, quantity: true }, take: 2 }
} as const;

export async function getAccountProfile() {
  const { user } = await requireAccountSession();
  const customer = await getPrismaClient().customer.findUnique({
    where: { authUserId: user.id },
    select: { firstName: true, lastName: true, phone: true }
  });
  return { email: user.email, firstName: customer?.firstName ?? "", lastName: customer?.lastName ?? "", phone: customer?.phone ?? "" };
}

export async function updateAccountProfile(input: { firstName: string; lastName: string; phone: string }) {
  const { user } = await requireAccountSession();
  if (process.env.KAYART_DATA_SOURCE !== "prisma") throw new Error("Profil indisponible.");
  await getPrismaClient().customer.upsert({
    where: { authUserId: user.id },
    create: { authUserId: user.id, email: user.email.toLowerCase(), ...input },
    update: input,
    select: { id: true }
  });
}

export async function listAccountOrders(page: number) {
  const { user } = await requireAccountSession();
  const safePage = Number.isSafeInteger(page) && page > 0 ? Math.min(page, 1000) : 1;
  const where = { customer: { is: { authUserId: user.id } } };
  const prisma = getPrismaClient();
  const [orders, count] = await Promise.all([
    prisma.order.findMany({ where, select: orderSelect, orderBy: [{ createdAt: "desc" }, { id: "desc" }], skip: (safePage - 1) * 10, take: 10 }),
    prisma.order.count({ where })
  ]);
  return { orders, count, page: safePage, pageCount: Math.ceil(count / 10) };
}

export async function getAccountOrder(id: string) {
  const { user } = await requireAccountSession();
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) return null;
  return getPrismaClient().order.findFirst({
    where: { id, customer: { is: { authUserId: user.id } } },
    select: {
      id: true, orderNumber: true, createdAt: true, status: true, paymentStatus: true,
      subtotalCents: true, shippingCents: true, totalCents: true, currency: true,
      isTest: true, fulfillmentMethod: true, customerName: true, shippingAddress: true,
      items: { select: { id: true, productName: true, productSku: true, quantity: true, unitPriceCents: true, totalCents: true } }
    }
  });
}

export async function getAccountHome() {
  const { user } = await requireAccountSession();
  const prisma = getPrismaClient();
  const [customer, orders] = await Promise.all([
    prisma.customer.findUnique({ where: { authUserId: user.id }, select: { firstName: true, lastName: true } }),
    prisma.order.findMany({
      where: { customer: { is: { authUserId: user.id } } },
      select: orderSelect,
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      take: 2
    })
  ]);
  return { email: user.email, name: [customer?.firstName, customer?.lastName].filter(Boolean).join(" "), orders };
}

export function checkoutEmailMatchesAccount(inputEmail: string, user: AuthenticatedUser | null) {
  return !user || inputEmail.toLowerCase() === user.email.trim().toLowerCase();
}
