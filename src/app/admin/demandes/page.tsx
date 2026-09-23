import Link from "next/link";
import { AdminRequestCard } from "@/components/admin/admin-request-card";
import { requestKinds, requestKindLabels, requestStatuses, requestStatusLabels, type RequestKind, type CustomerRequestStatus } from "@/lib/customer-requests";
import { listAdminRequests } from "@/server/requests/request-service";

export const metadata = { title: "Admin — Demandes" };

export default async function RequestsPage({ searchParams }: { searchParams?: Promise<{ type?: string; page?: string; status?: string; trash?: string }> }) {
  const params = searchParams ? await searchParams : {};
  const kind = requestKinds.includes(params.type as RequestKind) ? params.type as RequestKind : "contact";
  const status = requestStatuses.includes(params.status as CustomerRequestStatus) ? params.status as CustomerRequestStatus : undefined;
  const trashed = params.trash === "1";
  const page = Math.max(1, Math.min(1000, Number.parseInt(params.page ?? "1", 10) || 1));
  const { requests, hasNext } = await listAdminRequests(kind, page, status, trashed);
  const title = kind === "repair" ? "Demandes de réparation" : kind === "custom" ? "Demandes sur mesure" : "Demandes de contact";
  const url = (type: RequestKind, targetPage = 1, targetStatus = status, targetTrash = trashed) => {
    const query = new URLSearchParams({ type, page: String(targetPage) });
    if (targetStatus) query.set("status", targetStatus);
    if (targetTrash) query.set("trash", "1");
    return `/admin/demandes?${query}`;
  };
  return <section className="section admin-page"><div className="container">
    <div className="section__header"><div><div className="eyebrow">Administration · Demandes clients</div><h1 className="page-title">{title}</h1></div><Link className="button button--ghost" href="/admin">Retour admin</Link></div>
    <nav className="header-actions request-type-tabs" aria-label="Type de demande">{requestKinds.map(type => <Link aria-current={type === kind ? "page" : undefined} className="button button--ghost" key={type} href={url(type, 1, undefined)}>{requestKindLabels[type]}</Link>)}</nav>
    <nav className="header-actions request-view-tabs" aria-label="Affichage des demandes"><Link className="button button--ghost" aria-current={!trashed ? "page" : undefined} href={url(kind, 1, status, false)}>Demandes</Link><Link className="button button--ghost" aria-current={trashed ? "page" : undefined} href={url(kind, 1, status, true)}>Corbeille</Link></nav>
    <form className="request-filter" method="get"><input type="hidden" name="type" value={kind} />{trashed ? <input type="hidden" name="trash" value="1" /> : null}<label>Statut<select name="status" defaultValue={status ?? ""}><option value="">Tous</option>{requestStatuses.map(value => <option key={value} value={value}>{requestStatusLabels[value]}</option>)}</select></label><button className="button button--ghost">Filtrer</button></form>
    {!trashed ? <p className="form-hint">Le changement de statut n’envoie aucun email. Marquez « Réponse envoyée » après avoir répondu au client.</p> : <p className="form-hint">Ouvrez une demande pour la restaurer avec ses photos.</p>}
    {!requests.length ? <p className="feature-card">Aucune demande pour ce filtre.</p> : null}
    <div className="request-list">{requests.map(request => <AdminRequestCard key={request.id} kind={kind} request={request} />)}</div>
    <nav className="header-actions" aria-label="Pagination">{page > 1 ? <Link href={url(kind, page - 1)}>Précédent</Link> : null}<span>Page {page}</span>{hasNext ? <Link href={url(kind, page + 1)}>Suivant</Link> : null}</nav>
  </div></section>;
}
