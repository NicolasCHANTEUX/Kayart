export const metadata = {
  title: "Sur mesure",
  description: "Demander une pièce carbone sur mesure à l'atelier KayArt."
};

export default function CustomPage() {
  return (
    <section className="section">
      <div className="container split">
        <div>
          <div className="eyebrow">Projet personnalisé</div>
          <h1 className="page-title">Sur mesure</h1>
          <p className="lead">
            Le sur-mesure sera un parcours dédié, avec une demande structurée plutôt qu'un
            configurateur complexe dans la V1.
          </p>
        </div>
        <div className="feature-card">
          <div className="meta">Paramètres</div>
          <h3>Usage, dimensions, contraintes</h3>
          <p>Niveau, discipline, poids, rigidité, finition et délais seront cadrés progressivement.</p>
        </div>
      </div>
    </section>
  );
}
