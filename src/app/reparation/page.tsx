export const metadata = {
  title: "Reparation",
  description: "Demander un diagnostic de reparation carbone a l'atelier KayArt."
};

export default function RepairPage() {
  return (
    <section className="section">
      <div className="container split">
        <div>
          <div className="eyebrow">Diagnostic atelier</div>
          <h1 className="page-title">Reparation</h1>
          <p className="lead">
            Cette page cadrera le parcours de demande avec description, photos, type de piece et
            reponse de l'atelier. Le formulaire sera branche apres le schema de donnees.
          </p>
        </div>
        <div className="feature-card">
          <div className="meta">V1</div>
          <h3>Formulaire prevu</h3>
          <p>Nom, email, type de produit, description du dommage, photos et consentement.</p>
        </div>
      </div>
    </section>
  );
}
