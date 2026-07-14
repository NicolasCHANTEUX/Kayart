import Link from "next/link";

export default function NotFound() {
  return (
    <section className="section">
      <div className="container">
        <div className="eyebrow">404</div>
        <h1 className="page-title">Page introuvable</h1>
        <p className="lead">La page demandee n'existe pas ou a ete deplacee.</p>
        <div className="actions-row">
          <Link className="button button--primary" href="/">
            Retour accueil
          </Link>
        </div>
      </div>
    </section>
  );
}
