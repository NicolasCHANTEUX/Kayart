"use client";

import { useRef, useState, type FormEvent } from "react";
import Link from "next/link";
import { requestKindLabels, requestStatuses, requestStatusLabels, type CustomerRequestStatus, type RequestKind } from "@/lib/customer-requests";
import { setRequestTrashedAction, updateRequestStatusAction } from "@/app/admin/demandes/actions";
import { RepairRequestDetail } from "./repair-request-detail";
import { StandardRequestDetail } from "./request-detail-elements";

export type AdminRequest = {
  id: string; name: string; email: string; phone: string | null; status: CustomerRequestStatus;
  createdAt: string; updatedAt: string; deletedAt: string | null;
  subject: string; productType: string | null; discipline: string | null; practiceLevel: string | null;
  constraints: string | null; budgetHint: string | null; message: string; imageIds: string[];
};

export function AdminRequestCard({ request, kind, expanded = false }: { request: AdminRequest; kind: RequestKind; expanded?: boolean }) {
  const [status, setStatus] = useState<CustomerRequestStatus>(request.status);
  const [selectedStatus, setSelectedStatus] = useState<CustomerRequestStatus>(request.status);
  const [updatedAt, setUpdatedAt] = useState(request.updatedAt);
  const [deletedAt, setDeletedAt] = useState(request.deletedAt);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<{ text: string; error: boolean } | null>(null);
  const busyRef = useRef(false);
  const detailHref = `/admin/demandes/${kind}/${request.id}`;

  function formData() {
    const data = new FormData();
    data.set("kind", kind);
    data.set("id", request.id);
    data.set("updatedAt", updatedAt);
    return data;
  }

  async function saveStatus(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busyRef.current || deletedAt) return;
    busyRef.current = true;
    setBusy(true);
    setNotice(null);
    try {
      const data = formData();
      data.set("status", selectedStatus);
      data.set("previousStatus", status);
      const result = await updateRequestStatusAction(data);
      if (!result.ok) { setNotice({ text: result.error, error: true }); return; }
      setStatus(result.status);
      setSelectedStatus(result.status);
      setUpdatedAt(result.updatedAt);
      setNotice({ text: "Statut enregistré.", error: false });
    } catch {
      setNotice({ text: "Enregistrement impossible. Réessayez.", error: true });
    } finally {
      busyRef.current = false;
      setBusy(false);
    }
  }

  async function changeTrash() {
    if (busyRef.current) return;
    const moveToTrash = !deletedAt;
    if (moveToTrash && !window.confirm("Placer cette demande dans la corbeille ? Elle pourra être restaurée avec ses photos.")) return;
    busyRef.current = true;
    setBusy(true);
    setNotice(null);
    try {
      const data = formData();
      data.set("trashed", String(moveToTrash));
      const result = await setRequestTrashedAction(data);
      if (!result.ok) { setNotice({ text: result.error, error: true }); return; }
      setDeletedAt(result.deletedAt);
      setUpdatedAt(result.updatedAt);
      setNotice({ text: moveToTrash ? "Demande placée dans la corbeille." : "Demande restaurée.", error: false });
    } catch {
      setNotice({ text: "Opération impossible. Réessayez.", error: true });
    } finally {
      busyRef.current = false;
      setBusy(false);
    }
  }

  return <article className={`feature-card admin-request-card admin-request-card--${expanded ? "detail" : "list"}${status === "closed" || deletedAt ? " admin-request-card--muted" : ""}`}>
    <div className="admin-request-card__content">
      {expanded ? kind === "repair" ? <RepairRequestDetail request={request} status={status} deletedAt={deletedAt} />
        : <StandardRequestDetail request={request} kind={kind} status={status} deletedAt={deletedAt} />
        : <RequestListPreview request={request} kind={kind} status={status} deletedAt={deletedAt} detailHref={detailHref} />}
    </div>
    {!deletedAt ? <form className="request-filter admin-request-card__controls" onSubmit={saveStatus} aria-busy={busy}>
      <label>Statut<select value={selectedStatus} onChange={event => { setSelectedStatus(event.target.value as CustomerRequestStatus); setNotice(null); }} disabled={busy}>{requestStatuses.map(value => <option key={value} value={value}>{requestStatusLabels[value]}</option>)}</select></label>
      <button className="button button--primary" type="submit" disabled={busy}>{busy ? <><span className="loading-spinner" aria-hidden="true" /> Enregistrement…</> : "Enregistrer"}</button>
    </form> : null}
    {expanded ? <div className="admin-request-card__trash"><button className="button button--ghost" type="button" disabled={busy} onClick={changeTrash}>{deletedAt ? "Restaurer la demande" : "Supprimer la demande"}</button><span className="form-hint">{deletedAt ? "La demande et ses photos sont conservées dans la corbeille." : "La suppression place la demande et ses photos dans la corbeille."}</span></div> : null}
    {notice ? <p className={`form-notice ${notice.error ? "form-notice--error" : "form-notice--success"}`} role={notice.error ? "alert" : "status"}>{notice.text}{expanded && !notice.error && deletedAt ? <> <Link href={`/admin/demandes?type=${kind}&trash=1`}>Voir la corbeille</Link></> : null}</p> : null}
  </article>;
}

function RequestListPreview({ request, kind, status, deletedAt, detailHref }: { request: AdminRequest; kind: RequestKind; status: CustomerRequestStatus; deletedAt: string | null; detailHref: string }) {
  const date = new Date(request.createdAt).toLocaleString("fr-FR", { timeZone: "Europe/Paris", day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
  return <div className="admin-request-card__preview">
    <div className="admin-request-card__topline"><span>{requestKindLabels[kind]}</span><time dateTime={request.createdAt}>{date}</time><span className={`admin-request-card__status admin-request-card__status--${deletedAt ? "trashed" : status}`}>{deletedAt ? "Corbeille" : requestStatusLabels[status]}</span></div>
    <h2><Link href={detailHref}>{request.subject}</Link></h2>
    <p className="admin-request-card__sender">De {request.name}</p>
    <p className="admin-request-card__excerpt">{request.message.slice(0, 180)}</p>
    <div className="admin-request-card__summary-footer">
      {request.imageIds.length ? <span>{request.imageIds.length} photo{request.imageIds.length > 1 ? "s" : ""}</span> : null}
      <Link href={detailHref}>{kind === "repair" ? "Voir la réparation" : "Ouvrir la demande"} <span aria-hidden="true">→</span></Link>
    </div>
  </div>;
}
