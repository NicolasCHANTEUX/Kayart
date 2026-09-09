"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdminSession } from "@/server/auth/session";
import { requireSameOriginAction } from "@/server/security/request-guards";
import { getPrismaClient } from "@/server/db/prisma";
import { parseShippingZone } from "@/server/checkout/shipping-input";
export async function saveShippingZoneAction(form: FormData) {
  await requireSameOriginAction(); await requireAdminSession();
  try {
    const data = parseShippingZone(form), id = String(form.get("id") || "");
    const prisma = getPrismaClient();
    if (id) { if (!/^[0-9a-f-]{36}$/i.test(id)) throw new Error("Invalid id"); await prisma.shippingZone.update({ where: { id }, data }); }
    else await prisma.shippingZone.create({ data });
  } catch { redirect("/admin/livraison?error=1"); }
  revalidatePath("/admin/livraison");redirect("/admin/livraison?updated=1");
}
