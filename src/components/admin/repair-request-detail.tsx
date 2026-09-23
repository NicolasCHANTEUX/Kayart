import { ProductImageView } from "@/components/catalog/product-image";
import { requestStatusLabels, type CustomerRequestStatus } from "@/lib/customer-requests";
import type { AdminRequest } from "./admin-request-card";

export function RepairRequestDetail({ request, status, deletedAt }: { request: AdminRequest; status: CustomerRequestStatus; deletedAt: string | null }) {
  return <div className="repair-request-detail">
    <div className="repair-request-detail__intro">
      <div className="meta">Reçue le {new Date(request.createdAt).toLocaleString("fr-FR", { timeZone: "Europe/Paris" })} · {requestStatusLabels[status]}{deletedAt ? " · Dans la corbeille" : ""}</div>
      <h2>{request.productType || "Pièce non précisée"}</h2>
    </div>
    <div className="repair-request-detail__grid">
      <section aria-labelledby="repair-description-title">
        <h3 id="repair-description-title">Dommages constatés et contexte</h3>
        <p className="request-message">{request.message}</p>
      </section>
      <section aria-labelledby="repair-client-title">
        <h3 id="repair-client-title">Coordonnées du client</h3>
        <dl>
          <dt>Nom</dt><dd>{request.name}</dd>
          <dt>Email</dt><dd><a href={`mailto:${encodeURIComponent(request.email)}`}>{request.email}</a></dd>
          {request.phone ? <><dt>Téléphone</dt><dd>{request.phone}</dd></> : null}
        </dl>
      </section>
    </div>
    <section aria-labelledby="repair-photos-title">
      <h3 id="repair-photos-title">Photos jointes ({request.imageIds.length})</h3>
      {request.imageIds.length ? <div className="repair-request-detail__photos">{request.imageIds.map((id, index) => <a key={id} href={`/api/admin/request-images/${id}`} target="_blank" rel="noreferrer" aria-label={`Ouvrir la photo ${index + 1} en grand`}>
        <ProductImageView src={`/api/admin/request-images/${id}`} alt={`Photo ${index + 1} de la réparation`} /><span>Photo {index + 1} · Agrandir</span>
      </a>)}</div> : <p className="form-hint">Aucune photo jointe à cette demande.</p>}
    </section>
  </div>;
}
