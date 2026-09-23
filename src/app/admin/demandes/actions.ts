"use server";
import { revalidatePath } from "next/cache";
import { requestKinds, requestStatuses, type RequestKind, type CustomerRequestStatus } from "@/lib/customer-requests";
import { requireSameOriginAction } from "@/server/security/request-guards";
import { setAdminRequestTrashed, updateAdminRequestStatus } from "@/server/requests/request-service";

function parseIdentity(form: FormData) {
  const kind = String(form.get("kind")) as RequestKind;
  const id = String(form.get("id"));
  const updatedAt = String(form.get("updatedAt"));
  if (!requestKinds.includes(kind) || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id) || !Number.isFinite(Date.parse(updatedAt))) return null;
  return { kind, id, updatedAt };
}

export async function updateRequestStatusAction(form: FormData) {
  await requireSameOriginAction();
  const identity = parseIdentity(form);
  const status = String(form.get("status")) as CustomerRequestStatus;
  const previousStatus = String(form.get("previousStatus")) as CustomerRequestStatus;
  if (!identity || !requestStatuses.includes(status) || !requestStatuses.includes(previousStatus)) return { ok: false as const, error: "Données invalides." };
  try {
    const saved = await updateAdminRequestStatus(identity.kind, identity.id, status, identity.updatedAt, previousStatus);
    revalidatePath("/admin/demandes");
    revalidatePath(`/admin/demandes/${identity.kind}/${identity.id}`);
    revalidatePath("/admin");
    return { ok: true as const, ...saved };
  } catch (error) {
    if (typeof error === "object" && error !== null && "digest" in error) throw error;
    return { ok: false as const, error: error instanceof Error && error.message.startsWith("Cette demande a changé") ? error.message : "Mise à jour impossible." };
  }
}

export async function setRequestTrashedAction(form: FormData) {
  await requireSameOriginAction();
  const identity = parseIdentity(form);
  const trashed = form.get("trashed") === "true";
  if (!identity || !["true", "false"].includes(String(form.get("trashed")))) return { ok: false as const, error: "Données invalides." };
  try {
    const saved = await setAdminRequestTrashed(identity.kind, identity.id, identity.updatedAt, trashed);
    revalidatePath("/admin/demandes");
    revalidatePath(`/admin/demandes/${identity.kind}/${identity.id}`);
    revalidatePath("/admin");
    return { ok: true as const, ...saved };
  } catch (error) {
    if (typeof error === "object" && error !== null && "digest" in error) throw error;
    return { ok: false as const, error: error instanceof Error && error.message.startsWith("Cette demande a changé") ? error.message : "Mise à jour impossible." };
  }
}
