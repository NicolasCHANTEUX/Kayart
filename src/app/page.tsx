import Link from "next/link";
import { ProductCard } from "@/components/catalog/product-card";
import { listFeaturedProducts } from "@/server/catalog/catalog.service";

const processSteps = [
  "Conception",
  "Preparation",
  "Stratification",
  "Finition",
  "Contrôle"
];

export default async function HomePage() {
  const featuredProducts = await listFeaturedProducts();

  return (
    <>
      <section className="hero">
        <div className="container hero__content">
          <div className="eyebrow">Atelier carbone / kayak / pièces techniques</div>
          <h1>KayArt</h1>
          <p>
            Fabrication carbone, réparation de kayak, pièces uniques et projets sur mesure.
            Une boutique d'atelier pensée pour comprendre, choisir et confier le bon matériel.
          </p>
          <div className="hero__actions">
            <Link className="button button--primary" href="/boutique">
              Explorer la boutique
            </Link>
            <Link className="button button--ghost" href="/sur-mesure">
              Demander du sur mesure
            </Link>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="section__header">
            <h2>Produits, services et pièces uniques</h2>
            <Link className="button button--ghost" href="/boutique">
              Tout voir
            </Link>
          </div>
          <div className="grid">
            {featuredProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </div>
      </section>

      <section className="section section--light">
        <div className="container split">
          <div>
            <div className="eyebrow">Savoir-faire</div>
            <h2>Une logique d'atelier avant une logique de catalogue</h2>
            <p className="lead">
              KayArt doit montrer le geste, les matières, les contraintes et les choix techniques.
              Chaque fiche, chaque demande et chaque image doit aider le client à comprendre ce
              qu'il achète ou ce qu'il confie à l'atelier.
            </p>
          </div>
          <div className="process">
            {processSteps.map((step, index) => (
              <div className="process__item" key={step}>
                <div className="process__number">{String(index + 1).padStart(2, "0")}</div>
                <div>{step}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="section__header">
            <h2>Réparation et sur-mesure comme parcours dédiés</h2>
          </div>
          <div className="grid">
            <article className="feature-card feature-card--repair">
              <div className="feature-card__visual" aria-hidden="true" />
              <div>
                <div className="meta">Diagnostic</div>
                <h3>Réparation carbone</h3>
              </div>
              <p>
                Un formulaire dédié permettra d'envoyer photos, contexte et description du
                dommage pour une réponse claire de l'atelier.
              </p>
              <Link className="button button--ghost" href="/reparation">
                Demander un diagnostic
              </Link>
            </article>

            <article className="feature-card feature-card--custom">
              <div className="feature-card__visual" aria-hidden="true" />
              <div>
                <div className="meta">Projet</div>
                <h3>Fabrication sur mesure</h3>
              </div>
              <p>
                Dimensions, usage, niveau, contraintes et finition seront cadrés dans une demande
                simple, sans transformer la V1 en configurateur complexe.
              </p>
              <Link className="button button--ghost" href="/sur-mesure">
                Préparer une demande
              </Link>
            </article>

            <article className="feature-card feature-card--journal">
              <div className="feature-card__visual" aria-hidden="true" />
              <div>
                <div className="meta">PWA</div>
                <h3>Installable sans complexité</h3>
              </div>
              <p>
                Le socle prévoit une PWA progressive : installation mobile et desktop, cache
                sobre, sans panier offline ni notification prématurée.
              </p>
              <Link className="button button--ghost" href="/journal">
                Suivre le projet
              </Link>
            </article>
          </div>
        </div>
      </section>
    </>
  );
}
