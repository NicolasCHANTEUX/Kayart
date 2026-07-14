export const metadata = {
  title: "Sur mesure",
  description: "Demander une piece carbone sur mesure a l'atelier KayArt."
};

export default function CustomPage() {
  return (
    <section className="section">
      <div className="container split">
        <div>
          <div className="eyebrow">Projet personnalise</div>
          <h1 className="page-title">Sur mesure</h1>
          <p className="lead">
            Le sur-mesure sera un parcours dedie, avec une demande structuree plutot qu'un
            configurateur complexe dans la V1.
          </p>
        </div>
        <div className="feature-card">
          <div className="meta">Parametres</div>
          <h3>Usage, dimensions, contraintes</h3>
          <p>Niveau, discipline, poids, rigidite, finition et delais seront cadres progressivement.</p>
        </div>
      </div>
    </section>
  );
}
