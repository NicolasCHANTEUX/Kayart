export const metadata = {
  title: "Journal",
  description: "Realisations, conseils et coulisses de l'atelier KayArt."
};

export default function JournalPage() {
  return (
    <section className="section">
      <div className="container">
        <div className="eyebrow">Articles et realisations</div>
        <h1 className="page-title">Journal</h1>
        <p className="lead">
          Le journal recevra les articles, realisations recentes, conseils techniques et contenus
          atelier. Les commentaires publics restent hors V1.
        </p>
      </div>
    </section>
  );
}
