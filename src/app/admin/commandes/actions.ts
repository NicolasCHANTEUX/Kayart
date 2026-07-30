"use server";

import { redirect } from "next/navigation";
import { createAdminOrder } from "@/server/catalog/catalog.service";
import { OrderFormError, parseAdminOrderFormData } from "@/server/catalog/catalog.input";
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
