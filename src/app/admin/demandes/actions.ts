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
  const previousStatus = String(form.get("previousStatus")) as CustomerRequestStatus;
  const id = String(form.get("id")), updatedAt = String(form.get("updatedAt"));
  if (!requestKinds.includes(kind) || !requestStatuses.includes(status) || !requestStatuses.includes(previousStatus) || !/^[0-9a-f-]{36}$/i.test(id) || !Number.isFinite(Date.parse(updatedAt))) redirect("/admin/demandes?error=invalid");
  const page = Math.max(1, Math.min(1000, Number.parseInt(String(form.get("page") || "1"), 10) || 1));
  const filterStatus = String(form.get("filterStatus") || "");
  const listUrl = new URLSearchParams({ type: kind, page: String(page) });
  if (requestStatuses.includes(filterStatus as CustomerRequestStatus)) listUrl.set("status", filterStatus);
  try { await updateAdminRequestStatus(kind, id, status, updatedAt, previousStatus); }
  catch { listUrl.set("error", "conflict"); redirect(`/admin/demandes?${listUrl}`); }
  revalidatePath("/admin/demandes");
  listUrl.set("updated", "1");
  redirect(`/admin/demandes?${listUrl}`);
}
