import Link from "next/link";
export const metadata = { title: "L’atelier", description: "Fabrication carbone, réparation et projets sur mesure : échangez directement avec l’atelier KayArt." };
export default function CraftPage() {
  return <section className="section"><div className="container">
    <div className="craft-intro"><div className="eyebrow">L’atelier / KayArt</div><h1 className="page-title">De la matière<br/>au mouvement.</h1><p className="lead">Des pièces en carbone, une pratique sur l’eau et le goût du travail d’atelier. KayArt réunit fabrication, réparation et projets sur mesure autour d’un même point de départ : votre besoin.</p><Link className="text-link" href="/contact">Parler à l’atelier ↗</Link></div>
    <div className="craft-grid">
      <article><span className="mono">01 / Choisir</span><h2>La bonne pièce.</h2><p>Consultez les dimensions, le poids, l’état et la disponibilité sur chaque fiche. Les pièces imparfaites présentent leurs défauts et leurs propres photos pour vous aider à choisir.</p><Link className="text-link" href="/boutique">Explorer les pièces ↗</Link></article>
      <article><span className="mono">02 / Réparer</span><h2>Regarder de près.</h2><p>Une vue d’ensemble, des photos du dommage et le contexte d’utilisation permettent de préparer l’échange. La faisabilité et le devis se précisent avec l’atelier.</p><Link className="text-link" href="/reparation">Préparer un diagnostic ↗</Link></article>
      <article><span className="mono">03 / Concevoir</span><h2>Partir de votre usage.</h2><p>Une forme spécifique ou une contrainte particulière ? Partagez vos dimensions, votre pratique et vos idées de finition pour poser les bases du projet.</p><Link className="text-link" href="/sur-mesure">Présenter mon projet ↗</Link></article>
    </div>
  </div></section>;
}
