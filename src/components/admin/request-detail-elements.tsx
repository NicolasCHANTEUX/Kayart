import { ProductImageView } from "@/components/catalog/product-image";
import { requestKindLabels, requestStatusLabels, type CustomerRequestStatus, type RequestKind } from "@/lib/customer-requests";
import type { AdminRequest } from "./admin-request-card";

export function RequestMessageHeader({ request, kind, status, deletedAt, title }: { request: AdminRequest; kind: RequestKind; status: CustomerRequestStatus; deletedAt: string | null; title: string }) {
  const received = new Date(request.createdAt).toLocaleString("fr-FR", { timeZone: "Europe/Paris", dateStyle: "long", timeStyle: "short" });
  return <header className="request-detail__header">
    <div className="request-detail__category">{requestKindLabels[kind]}</div>
    <div className="request-detail__title-row"><h2>{title}</h2><span className={`request-detail__status request-detail__status--${deletedAt ? "trashed" : status}`}>{deletedAt ? "Corbeille" : requestStatusLabels[status]}</span></div>
    <div className="request-detail__envelope">
      <div><span className="request-detail__field-label">De</span><strong>{request.name}</strong><a href={`mailto:${encodeURIComponent(request.email)}`}>{request.email}</a></div>
      <div><span className="request-detail__field-label">Reçu le</span><time dateTime={request.createdAt}>{received}</time></div>
      {request.phone ? <div><span className="request-detail__field-label">Téléphone</span><span>{request.phone}</span></div> : null}
    </div>
  </header>;
}

export function RequestPhotoAttachments({ imageIds, showEmpty = false }: { imageIds: string[]; showEmpty?: boolean }) {
  if (!imageIds.length && !showEmpty) return null;
  return <section className="request-detail__attachments" aria-label="Photos jointes">
    <h3>Photos jointes <span>({imageIds.length})</span></h3>
    {imageIds.length ? <div className="request-detail__photo-grid">{imageIds.map((id, index) => <a key={id} href={`/api/admin/request-images/${id}`} target="_blank" rel="noreferrer" aria-label={`Ouvrir la photo ${index + 1} en grand`}>
      <ProductImageView src={`/api/admin/request-images/${id}`} alt={`Photo ${index + 1} de la demande`} /><span>Photo {index + 1} · Agrandir</span>
    </a>)}</div> : <p className="form-hint">Aucune photo jointe à cette demande.</p>}
  </section>;
}

export function StandardRequestDetail({ request, kind, status, deletedAt }: { request: AdminRequest; kind: RequestKind; status: CustomerRequestStatus; deletedAt: string | null }) {
  return <div className="request-detail">
    <RequestMessageHeader request={request} kind={kind} status={status} deletedAt={deletedAt} title={request.subject} />
    {kind === "custom" ? <section className="request-detail__facts" aria-label="Informations du projet">
      {request.discipline ? <div><span>Discipline / usage</span><strong>{request.discipline}</strong></div> : null}
      {request.practiceLevel ? <div><span>Niveau de pratique</span><strong>{request.practiceLevel}</strong></div> : null}
      {request.budgetHint ? <div><span>Budget indicatif</span><strong>{request.budgetHint}</strong></div> : null}
    </section> : null}
    <section className="request-detail__body"><h3>{kind === "custom" ? "Projet demandé" : "Message"}</h3><p className="request-message">{request.message}</p></section>
    {kind === "custom" && request.constraints ? <section className="request-detail__body request-detail__body--secondary"><h3>Dimensions, contraintes et délai souhaité</h3><p className="request-message">{request.constraints}</p></section> : null}
    <RequestPhotoAttachments imageIds={request.imageIds} />
  </div>;
}
