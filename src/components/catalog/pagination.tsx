import Link from "next/link";
import { pageHref } from "@/lib/list-query";
export function Pagination({ path, filters, page, pages }: { path: string; filters: Record<string,string>; page: number; pages: number }) {
  if (pages <= 1) return null;
  return <nav className="list-pagination" aria-label="Pagination"><span>Page {page} sur {pages}</span>{page > 1 ? <Link className="button button--ghost" href={pageHref(path,filters,page-1)}>Précédente</Link> : null}{page < pages ? <Link className="button button--ghost" href={pageHref(path,filters,page+1)}>Suivante</Link> : null}</nav>;
}
