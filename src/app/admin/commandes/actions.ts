"use server";

import { redirect } from "next/navigation";
import {
  createAdminOrder,
  deleteAdminOrder,
  markAdminOrderPaid
} from "@/server/catalog/catalog.service";
import {
  OrderFormError,
  parseAdminOrderActionFormData,
  parseAdminOrderFormData
} from "@/server/catalog/catalog.input";
import { requireAdminSession } from "@/server/auth/session";
import { requireSameOriginAction } from "@/server/security/request-guards";
import { advanceTestOrder } from "@/server/checkout/admin-orders";
import { issueInvoice } from "@/server/invoicing/invoice-service";
import { recordAdminAudit } from "@/server/audit/admin-audit";
import { revalidatePath } from "next/cache";

export async function issueInvoiceAction(formData: FormData) {
  await requireSameOriginAction();
  const session = await requireAdminSession();
  let orderId = "";
  try {
    const input = parseAdminOrderActionFormData(formData);
    orderId = input.id;
    await issueInvoice(orderId, session.user.id);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Impossible d'émettre la facture pour le moment.";
    const path = /^[0-9a-f-]{36}$/i.test(orderId) ? `/admin/commandes/${orderId}` : "/admin/commandes";
    redirect(`${path}?error=${encodeURIComponent(message)}`);
  }
  revalidatePath("/admin/commandes");
  revalidatePath(`/admin/commandes/${orderId}`);
  redirect(`/admin/commandes/${orderId}?issued=1`);
}

export async function advanceTestOrderAction(formData: FormData) {
  await requireSameOriginAction();
  await requireAdminSession();
  try { await advanceTestOrder(String(formData.get("id") || ""), String(formData.get("status") || "")); }
  catch { redirect("/admin/commandes?error=" + encodeURIComponent("La commande a changé ou son paiement n’est pas confirmé. Actualisez la liste.")); }
  revalidatePath("/admin/commandes");
  redirect("/admin/commandes?updated=fulfillment");
}

export async function createAdminOrderAction(formData: FormData) {
  await requireSameOriginAction();
  const session = await requireAdminSession();

  try {
    const input = parseAdminOrderFormData(formData);
    const order = await createAdminOrder(input);
    await recordAdminAudit({ actorUserId: session.user.id, action: "order.created", entityType: "Order", entityId: order.id, metadata: { orderNumber: order.orderNumber, source: "manual" } });
  } catch (error) {
    const message =
      error instanceof OrderFormError || error instanceof Error
        ? error.message
        : "Impossible de creer la commande pour le moment.";

    redirect(`/admin/commandes?error=${encodeURIComponent(message)}`);
  }

  redirect("/admin/commandes?created=1");
}

export async function markAdminOrderPaidAction(formData: FormData) {
  await requireSameOriginAction();
  const session = await requireAdminSession();

  try {
    const input = parseAdminOrderActionFormData(formData);
    const order = await markAdminOrderPaid(input);
    await recordAdminAudit({ actorUserId: session.user.id, action: "order.payment_confirmed", entityType: "Order", entityId: order.id, metadata: { orderNumber: order.orderNumber, paymentStatus: order.paymentStatus } });
  } catch (error) {
    const message =
      error instanceof OrderFormError || error instanceof Error
        ? error.message
        : "Impossible de mettre a jour le paiement pour le moment.";

    redirect(`/admin/commandes?error=${encodeURIComponent(message)}`);
  }

  redirect("/admin/commandes?updated=paid");
}

export async function deleteAdminOrderAction(formData: FormData) {
  await requireSameOriginAction();
  const session = await requireAdminSession();

  try {
    const input = parseAdminOrderActionFormData(formData);
    await deleteAdminOrder(input);
    await recordAdminAudit({ actorUserId: session.user.id, action: "order.cancelled", entityType: "Order", entityId: input.id, metadata: { source: "manual" } });
  } catch (error) {
    const message =
      error instanceof OrderFormError || error instanceof Error
        ? error.message
        : "Impossible de supprimer la commande pour le moment.";

    redirect(`/admin/commandes?error=${encodeURIComponent(message)}`);
  }

  redirect("/admin/commandes?updated=deleted");
}
