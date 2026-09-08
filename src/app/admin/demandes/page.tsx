import Link from "next/link";
import { requestKinds, requestKindLabels, requestStatuses, requestStatusLabels, type RequestKind, type CustomerRequestStatus } from "@/lib/customer-requests";
import { listAdminRequests } from "@/server/requests/request-service";
import { updateRequestStatusAction } from "./actions";
export const metadata = { title: "Admin — Demandes" };
export default async function RequestsPage({ searchParams }: { searchParams?: Promise<{ type?: string; page?: string; status?: string; error?: string; updated?: string }> }) {
  const params = searchParams ? await searchParams : {};
  const kind = requestKinds.includes(params.type as RequestKind) ? params.type as RequestKind : "contact";
  const status = requestStatuses.includes(params.status as CustomerRequestStatus) ? params.status as CustomerRequestStatus : undefined;
  const page = Math.max(1, Math.min(1000, Number.parseInt(params.page ?? "1", 10) || 1));
  const { requests, hasNext } = await listAdminRequests(kind, page, status);
  return <section className="section admin-page"><div className="container">
    <div className="section__header"><div><div className="eyebrow">Administration</div><h1 className="page-title">Demandes clients</h1></div><Link className="button button--ghost" href="/admin">Retour admin</Link></div>
    <nav className="header-actions" aria-label="Type de demande">{requestKinds.map(type => <Link aria-current={type === kind ? "page" : undefined} className="button button--ghost" key={type} href={`/admin/demandes?type=${type}`}>{requestKindLabels[type]}</Link>)}</nav>
    <form className="request-filter" method="get"><input type="hidden" name="type" value={kind} /><label>Statut<select name="status" defaultValue={status ?? ""}><option value="">Tous</option>{requestStatuses.map(value => <option key={value} value={value}>{requestStatusLabels[value]}</option>)}</select></label><button className="button button--ghost">Filtrer</button></form>
    {params.error ? <p className="form-notice form-notice--error" role="alert">Mise à jour impossible. Rechargez la demande et réessayez.</p> : null}
    {params.updated ? <p className="form-notice form-notice--success" role="status">Statut enregistré.</p> : null}
    <p className="form-hint">Le changement de statut n’envoie aucun email. Marquez « Réponse envoyée » après avoir répondu au client.</p>
    {!requests.length ? <p className="feature-card">Aucune demande pour ce filtre.</p> : null}
    <div className="request-list">{requests.map(request => <article className="feature-card" key={request.id}>
      <div className="meta">{requestKindLabels[kind]} · {requestStatusLabels[request.status]} · {new Date(request.createdAt).toLocaleString("fr-FR", { timeZone: "Europe/Paris" })}</div>
      <h2>{request.subject}</h2><p>{request.name} — <a href={`mailto:${encodeURIComponent(request.email)}`}>{request.email}</a>{request.phone ? ` — ${request.phone}` : ""}</p>
      <p className="request-message">{request.message}</p>{request.details ? <p className="request-message">{request.details}</p> : null}
      <div className="request-photos">{request.imageIds.map(id => <a key={id} href={`/api/admin/request-images/${id}`} target="_blank" rel="noreferrer"><img src={`/api/admin/request-images/${id}`} alt="Photo jointe à la demande" loading="lazy" /></a>)}</div>
      <form action={updateRequestStatusAction} className="request-filter"><input type="hidden" name="kind" value={kind} /><input type="hidden" name="id" value={request.id} /><input type="hidden" name="updatedAt" value={request.updatedAt} /><label>Statut<select name="status" defaultValue={request.status}>{requestStatuses.map(value => <option key={value} value={value}>{requestStatusLabels[value]}</option>)}</select></label><button className="button button--primary">Enregistrer</button></form>
    </article>)}</div>
    <nav className="header-actions" aria-label="Pagination">{page > 1 ? <Link href={`/admin/demandes?type=${kind}&page=${page - 1}&status=${status ?? ""}`}>Précédent</Link> : null}<span>Page {page}</span>{hasNext ? <Link href={`/admin/demandes?type=${kind}&page=${page + 1}&status=${status ?? ""}`}>Suivant</Link> : null}</nav>
  </div></section>;
}
