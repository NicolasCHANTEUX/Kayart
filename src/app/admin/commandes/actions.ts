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

export async function createAdminOrderAction(formData: FormData) {
  await requireAdminSession();

  try {
    const input = parseAdminOrderFormData(formData);
    await createAdminOrder(input);
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
  await requireAdminSession();

  try {
    const input = parseAdminOrderActionFormData(formData);
    await markAdminOrderPaid(input);
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
  await requireAdminSession();

  try {
    const input = parseAdminOrderActionFormData(formData);
    await deleteAdminOrder(input);
  } catch (error) {
    const message =
      error instanceof OrderFormError || error instanceof Error
        ? error.message
        : "Impossible de supprimer la commande pour le moment.";

    redirect(`/admin/commandes?error=${encodeURIComponent(message)}`);
  }

  redirect("/admin/commandes?updated=deleted");
}
