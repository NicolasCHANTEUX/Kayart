export const metadata = {
  title: "Contact",
  description: "Contacter KayArt pour une commande, une question, une reparation ou un projet."
};

export default function ContactPage() {
  return (
    <section className="section">
      <div className="container split">
        <div>
          <div className="eyebrow">Contact</div>
          <h1 className="page-title">Parler a l'atelier</h1>
          <p className="lead">
            Le formulaire general sera ajoute apres les formulaires metier reparation et sur-mesure,
            pour eviter de tout melanger dans un seul canal.
          </p>
        </div>
        <div className="feature-card">
          <div className="meta">Email</div>
          <h3>contact.kayart@gmail.com</h3>
          <p>Adresse temporaire issue du projet existant, a confirmer avant production.</p>
        </div>
      </div>
    </section>
  );
}
