import Link from "next/link";
import { ProductCard } from "@/components/catalog/product-card";
import { listFeaturedProducts } from "@/server/catalog/catalog.service";

const processSteps = [
  "Conception",
  "Preparation",
  "Stratification",
  "Finition",
  "Controle"
];

export default async function HomePage() {
  const featuredProducts = await listFeaturedProducts();

  return (
    <>
      <section className="hero">
        <div className="container hero__content">
          <div className="eyebrow">Atelier carbone / kayak / pieces techniques</div>
          <h1>Carbon in Motion</h1>
          <p>
            Pieces en carbone faconnees a la main pour la performance, la precision et la
            duree. Boutique, reparation, occasion et projets sur mesure.
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
            <h2>Produits, services et pieces uniques</h2>
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
              KayArt doit montrer le geste, les matieres, les contraintes et les choix techniques.
              Chaque fiche, chaque demande et chaque image doit aider le client a comprendre ce
              qu'il achete ou ce qu'il confie a l'atelier.
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
            <h2>Reparation et sur-mesure comme parcours dedies</h2>
          </div>
          <div className="grid">
            <article className="feature-card">
              <div className="feature-card__visual" aria-hidden="true" />
              <div>
                <div className="meta">Diagnostic</div>
                <h3>Reparation carbone</h3>
              </div>
              <p>
                Un formulaire dedie permettra d'envoyer photos, contexte et description du
                dommage pour une reponse claire de l'atelier.
              </p>
              <Link className="button button--ghost" href="/reparation">
                Demander un diagnostic
              </Link>
            </article>

            <article className="feature-card">
              <div className="feature-card__visual" aria-hidden="true" />
              <div>
                <div className="meta">Projet</div>
                <h3>Fabrication sur mesure</h3>
              </div>
              <p>
                Dimensions, usage, niveau, contraintes et finition seront cadres dans une demande
                simple, sans transformer la V1 en configurateur complexe.
              </p>
              <Link className="button button--ghost" href="/sur-mesure">
                Preparer une demande
              </Link>
            </article>

            <article className="feature-card">
              <div className="feature-card__visual" aria-hidden="true" />
              <div>
                <div className="meta">PWA</div>
                <h3>Installable sans complexite</h3>
              </div>
              <p>
                Le socle prevoit une PWA progressive : installation mobile et desktop, cache
                sobre, sans panier offline ni notification prematuree.
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
