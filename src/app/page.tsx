import Link from "next/link";
import { ProductCard } from "@/components/catalog/product-card";
import { KayartHeroMark } from "@/components/layout/kayart-brand";
import { listFeaturedProducts } from "@/server/catalog/catalog.service";

export default async function HomePage() {
  const products = (await listFeaturedProducts()).slice(0, 3);
  return <div className="home-page">
    <section className="atelier-hero"><div className="container atelier-hero__grid">
      <div className="atelier-hero__copy">
        <div className="eyebrow"><span className="status-dot"/> Atelier carbone indépendant</div>
        <h1>Du carbone.<br/><em>Du caractère.</em></h1>
        <p>Des pièces pour votre pratique. Un atelier pour réparer, fabriquer et donner forme à vos idées.</p>
        <div className="hero-actions"><Link className="button button--primary" href="/boutique">Explorer la boutique <span aria-hidden="true">↗</span></Link><Link className="text-link" href="/savoir-faire">L’atelier KayArt <span aria-hidden="true">→</span></Link></div>
        <div className="hero-footnote"><span>Conception · Fabrication · Réparation</span><span className="mono">KAYART / CARBON IN MOTION</span></div>
      </div>
      <div className="atelier-hero__visual" aria-hidden="true"><KayartHeroMark/><span className="visual-index">KAYAK / ART / COMPOSITE / SPORT</span><div className="visual-caption"><span className="racing-wordmark">KAYART</span><span className="visual-caption__tagline">À L’ATELIER.<br/>SUR L’EAU.</span></div></div>
    </div></section>
    <section className="section collection-section"><div className="container">
      <div className="section__header"><div><div className="eyebrow">01 / La sélection</div><h2>Prêtes pour la suite.</h2></div><div><p>Pièces neuves, imparfaites et services atelier.</p><Link className="text-link" href="/boutique">Toute la boutique <span aria-hidden="true">↗</span></Link></div></div>
      {products.length ? <div className="grid product-grid">{products.map(product => <ProductCard key={product.id} product={product}/>)}</div> : <div className="collection-empty"><p>Vous recherchez une pièce particulière ? Parlons de votre besoin.</p><Link className="text-link" href="/contact">Contacter l’atelier ↗</Link></div>}
    </div></section>
    <section className="atelier-services"><div className="container"><div className="section__header"><div><div className="eyebrow">02 / Au-delà de la boutique</div><h2>Une pièce. Une histoire.<br/>Et la suite à écrire.</h2></div><p>Votre matériel mérite un regard d’atelier.<br/>Votre projet aussi.</p></div>
      <div className="service-grid">
        <Link href="/reparation" className="service-tile service-tile--repair"><span className="mono">01 — RÉPARER</span><div className="service-line-art" aria-hidden="true"><i/><i/><i/></div><h3>Retour à l’eau.</h3><p>Une pièce endommagée ? Décrivez le problème et partagez vos photos pour préparer un diagnostic.</p><span className="service-tile__cta">Demander un diagnostic <b aria-hidden="true">↗</b></span></Link>
        <Link href="/sur-mesure" className="service-tile service-tile--custom"><span className="mono">02 — IMAGINER</span><div className="service-cross-art" aria-hidden="true">+</div><h3>À votre mesure.</h3><p>Un usage précis, une forme en tête, une contrainte technique : donnons un point de départ à votre projet.</p><span className="service-tile__cta">Parler de mon projet <b aria-hidden="true">↗</b></span></Link>
      </div>
    </div></section>
    <section className="section atelier-manifesto"><div className="container"><div className="eyebrow">03 / L’esprit KayArt</div><div className="manifesto-grid"><h2>Le bon matériel <br/>commence par <br/><em>un échange.</em></h2><div><p className="lead">Comprendre votre pratique. Choisir une pièce adaptée. Prendre le temps de discuter des contraintes avant de fabriquer ou de réparer.</p><p>C’est cette relation directe avec l’atelier que vous retrouvez chez KayArt, de la première question au retrait de votre pièce.</p><Link className="button button--ghost" href="/contact">Échanger avec l’atelier ↗</Link></div></div></div></section>
  </div>;
}
