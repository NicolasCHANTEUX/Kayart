import { randomUUID } from "node:crypto";
import { CustomerRequestForm } from "@/components/requests/customer-request-form";
import { siteConfig } from "@/config/site";
export const metadata = {
  title: "Sur mesure",
  description: "Demander une pièce carbone sur mesure à l'atelier KayArt."
};

export default function CustomPage() {
  return (
    <section className="section">
      <div className="container split">
        <div>
          <div className="eyebrow">Sur mesure / Projet</div>
          <h1 className="page-title">Votre idée.<br/>Notre point de départ.</h1>
          <p className="lead">
            Présentez votre projet, son usage et les contraintes à respecter. L’atelier vous
            recontactera pour préciser la faisabilité, les dimensions et le devis.
          </p>
          <CustomerRequestForm kind="custom" submissionKey={randomUUID()} enabled={process.env.KAYART_DATA_SOURCE === "prisma"} />
        </div>
        <aside className="feature-card request-guide">
          <div className="meta">Paramètres</div>
          <h3>Usage, dimensions, contraintes</h3>
          <p>Indiquez les dimensions souhaitées, le poids, la rigidité, la finition et votre délai. Le budget peut rester indicatif.</p>
          <ol className="request-steps"><li><span>01</span>Présentez votre besoin</li><li><span>02</span>Échangez avec l’atelier</li><li><span>03</span>Validez les prochaines étapes</li></ol>
          <p><a href={`mailto:${siteConfig.email}`}>{siteConfig.email}</a></p>
        </aside>
      </div>
    </section>
  );
}
