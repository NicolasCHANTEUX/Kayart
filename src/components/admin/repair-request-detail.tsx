import type { CustomerRequestStatus } from "@/lib/customer-requests";
import type { AdminRequest } from "./admin-request-card";
import { RequestMessageHeader, RequestPhotoAttachments } from "./request-detail-elements";

export function RepairRequestDetail({ request, status, deletedAt }: { request: AdminRequest; status: CustomerRequestStatus; deletedAt: string | null }) {
  return <div className="request-detail request-detail--repair">
    <RequestMessageHeader request={request} kind="repair" status={status} deletedAt={deletedAt} title={request.productType || "Pièce non précisée"} />
    <section className="request-detail__body"><h3>Dommages constatés et contexte</h3><p className="request-message">{request.message}</p></section>
    <RequestPhotoAttachments imageIds={request.imageIds} showEmpty />
  </div>;
}
