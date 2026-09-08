"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requestKinds, requestStatuses, type RequestKind, type CustomerRequestStatus } from "@/lib/customer-requests";
import { requireAdminSession } from "@/server/auth/session";
import { requireSameOriginAction } from "@/server/security/request-guards";
import { updateAdminRequestStatus } from "@/server/requests/request-service";
export async function updateRequestStatusAction(form: FormData) {
  await requireSameOriginAction(); await requireAdminSession();
  const kind = String(form.get("kind")) as RequestKind;
  const status = String(form.get("status")) as CustomerRequestStatus;
  const id = String(form.get("id")), updatedAt = String(form.get("updatedAt"));
  if (!requestKinds.includes(kind) || !requestStatuses.includes(status) || !/^[0-9a-f-]{36}$/i.test(id) || !Number.isFinite(Date.parse(updatedAt))) redirect("/admin/demandes?error=invalid");
  try { await updateAdminRequestStatus(kind, id, status, updatedAt); }
  catch { redirect(`/admin/demandes?type=${kind}&error=conflict`); }
  revalidatePath("/admin/demandes");
  redirect(`/admin/demandes?type=${kind}&updated=1`);
}
