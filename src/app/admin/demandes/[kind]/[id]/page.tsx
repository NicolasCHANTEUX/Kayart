import Link from "next/link";
import { notFound } from "next/navigation";
import { AdminRequestCard } from "@/components/admin/admin-request-card";
import { requestKinds, requestKindLabels, type RequestKind } from "@/lib/customer-requests";
import { getAdminRequest } from "@/server/requests/request-service";

export const metadata = { title: "Admin — Détail de la demande" };

export default async function RequestDetailPage({ params }: { params: Promise<{ kind: string; id: string }> }) {
  const { kind, id } = await params;
  if (!requestKinds.includes(kind as RequestKind) || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) notFound();
  const request = await getAdminRequest(kind as RequestKind, id);
  if (!request) notFound();
  return <section className="section admin-page"><div className="container">
    <div className="section__header"><div><div className="eyebrow">Administration · {requestKindLabels[kind as RequestKind]}</div><h1 className="page-title">Détail de la demande</h1></div><Link className="button button--ghost" href={`/admin/demandes?type=${kind}${request.deletedAt ? "&trash=1" : ""}`}>Retour aux demandes</Link></div>
    <AdminRequestCard kind={kind as RequestKind} request={request} expanded />
  </div></section>;
}
