"use client";

import { useRef, useState, type FormEvent } from "react";
import Link from "next/link";
import { ProductImageView } from "@/components/catalog/product-image";
import { requestKindLabels, requestStatuses, requestStatusLabels, type CustomerRequestStatus, type RequestKind } from "@/lib/customer-requests";
import { setRequestTrashedAction, updateRequestStatusAction } from "@/app/admin/demandes/actions";

export type AdminRequest = {
  id: string; name: string; email: string; phone: string | null; status: CustomerRequestStatus;
  createdAt: string; updatedAt: string; deletedAt: string | null;
  subject: string; message: string; details: string; imageIds: string[];
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

  return <article className={`feature-card admin-request-card${status === "closed" || deletedAt ? " admin-request-card--muted" : ""}`}>
    <div className="admin-request-card__content">
      <div className="meta">{requestKindLabels[kind]} · {requestStatusLabels[status]} · {new Date(request.createdAt).toLocaleString("fr-FR", { timeZone: "Europe/Paris" })}{deletedAt ? " · Dans la corbeille" : ""}</div>
      {expanded ? <h1>{request.subject}</h1> : <h2><Link href={detailHref}>{request.subject}</Link></h2>}
      <p>{request.name} · <a href={`mailto:${encodeURIComponent(request.email)}`}>{request.email}</a>{request.phone ? ` · ${request.phone}` : ""}</p>
      {expanded ? <><p className="request-message">{request.message}</p>{request.details ? <p className="request-message">{request.details}</p> : null}</>
        : <p className="request-message admin-request-card__excerpt">{request.message}</p>}
      {request.imageIds.length ? <div className="request-photos">{request.imageIds.map(id => <a key={id} href={`/api/admin/request-images/${id}`} target="_blank" rel="noreferrer"><ProductImageView src={`/api/admin/request-images/${id}`} alt="Photo jointe à la demande" /></a>)}</div> : null}
      {!expanded ? <Link className="button button--ghost" href={detailHref}>Voir le détail</Link> : null}
    </div>
    {!deletedAt ? <form className="request-filter admin-request-card__controls" onSubmit={saveStatus} aria-busy={busy}>
      <label>Statut<select value={selectedStatus} onChange={event => { setSelectedStatus(event.target.value as CustomerRequestStatus); setNotice(null); }} disabled={busy}>{requestStatuses.map(value => <option key={value} value={value}>{requestStatusLabels[value]}</option>)}</select></label>
      <button className="button button--primary" type="submit" disabled={busy}>{busy ? <><span className="loading-spinner" aria-hidden="true" /> Enregistrement…</> : "Enregistrer"}</button>
    </form> : null}
    {expanded ? <div className="admin-request-card__trash"><button className="button button--ghost" type="button" disabled={busy} onClick={changeTrash}>{deletedAt ? "Restaurer la demande" : "Supprimer la demande"}</button><span className="form-hint">{deletedAt ? "La demande et ses photos sont conservées dans la corbeille." : "La suppression place la demande et ses photos dans la corbeille."}</span></div> : null}
    {notice ? <p className={`form-notice ${notice.error ? "form-notice--error" : "form-notice--success"}`} role={notice.error ? "alert" : "status"}>{notice.text}{expanded && !notice.error && deletedAt ? <> <Link href={`/admin/demandes?type=${kind}&trash=1`}>Voir la corbeille</Link></> : null}</p> : null}
  </article>;
}
