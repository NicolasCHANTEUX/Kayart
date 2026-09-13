import Link from "next/link";
export const metadata = { title: "Journal", description: "Le journal de l’atelier KayArt." };
export default function JournalPage() {
  return <section className="section"><div className="container"><div className="eyebrow">Notes d’atelier</div><h1 className="page-title">Le journal.</h1><p className="lead">La matière, les pièces et ce qui se passe entre les deux.</p><div className="journal-empty"><span className="mono">PREMIÈRES NOTES À VENIR</span><h2>Chaque pièce a son histoire.</h2><p>Les premières publications de l’atelier ne sont pas encore disponibles. En attendant, découvrez les pièces du catalogue ou échangez directement avec KayArt.</p><div className="actions-row"><Link className="button button--primary" href="/boutique">Explorer la boutique ↗</Link><Link className="text-link" href="/contact">Contacter l’atelier ↗</Link></div></div></div></section>;
}
