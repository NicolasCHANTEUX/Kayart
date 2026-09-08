import { siteConfig } from "@/config/site";

export const metadata = {
  title: "Contact",
  description: "Contacter KayArt pour une commande, une question, une réparation ou un projet."
};

export default async function ContactPage({ searchParams }: { searchParams?: Promise<{ produit?: string; reference?: string }> }) {
  const params = searchParams ? await searchParams : {};
  const product = typeof params.produit === "string" ? params.produit.slice(0, 200) : "";
  const reference = typeof params.reference === "string" ? params.reference.slice(0, 100) : "";
  const subject = product ? `Demande : ${product} (${reference})` : "Contacter l’atelier KayArt";
  const emailHref = `mailto:${siteConfig.email}?subject=${encodeURIComponent(subject)}`;
  return (
    <section className="section">
      <div className="container split">
        <div>
          <div className="eyebrow">Contact</div>
          <h1 className="page-title">Parler à l'atelier</h1>
          <p className="lead">
            Pour commander une pièce, demander un devis ou parler d’une réparation, contactez-nous
            par email ou par téléphone. Nous confirmerons la disponibilité, le prix et la livraison avant toute commande.
          </p>
        </div>
        <div className="feature-card">
          <div className="meta">Email</div>
          {product ? <p>Votre demande concerne : {product}{reference ? ` — ${reference}` : ""}.</p> : null}
          <h3><a href={emailHref}>{siteConfig.email}</a></h3>
          <p><a href={`tel:${siteConfig.phone.replace(/\s/g, "")}`}>{siteConfig.phone}</a></p>
          <a className="button button--primary" href={emailHref}>Écrire à l’atelier</a>
        </div>
      </div>
    </section>
  );
}
