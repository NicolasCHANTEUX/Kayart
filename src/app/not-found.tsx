import Link from "next/link";

export default function NotFound() {
  return (
    <section className="section">
      <div className="container">
        <div className="eyebrow">404</div>
        <h1 className="page-title">Page introuvable</h1>
        <p className="lead">La page demandée n'existe pas ou a été déplacée.</p>
        <div className="actions-row">
          <Link className="button button--primary" href="/">
            Retour accueil
          </Link>
        </div>
      </div>
    </section>
  );
}
