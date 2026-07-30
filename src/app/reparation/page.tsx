export const metadata = {
  title: "Réparation",
  description: "Demander un diagnostic de réparation carbone à l'atelier KayArt."
};

export default function RepairPage() {
  return (
    <section className="section">
      <div className="container split">
        <div>
          <div className="eyebrow">Diagnostic atelier</div>
          <h1 className="page-title">Réparation</h1>
          <p className="lead">
            Cette page cadrera le parcours de demande avec description, photos, type de pièce et
            réponse de l'atelier. Le formulaire sera branché après le schéma de données.
          </p>
        </div>
        <div className="feature-card">
          <div className="meta">V1</div>
          <h3>Formulaire prévu</h3>
          <p>Nom, email, type de produit, description du dommage, photos et consentement.</p>
        </div>
      </div>
    </section>
  );
}
