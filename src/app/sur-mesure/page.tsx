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
          <div className="eyebrow">Projet personnalisé</div>
          <h1 className="page-title">Sur mesure</h1>
          <p className="lead">
            Présentez votre projet, son usage et les contraintes à respecter. L’atelier vous
            recontactera pour préciser la faisabilité, les dimensions et le devis.
          </p>
          <CustomerRequestForm kind="custom" submissionKey={randomUUID()} enabled={process.env.KAYART_DATA_SOURCE === "prisma"} />
        </div>
        <div className="feature-card">
          <div className="meta">Paramètres</div>
          <h3>Usage, dimensions, contraintes</h3>
          <p>Indiquez les dimensions souhaitées, le poids, la rigidité, la finition et votre délai. Le budget peut rester indicatif.</p>
          <p><a href={`mailto:${siteConfig.email}`}>{siteConfig.email}</a></p>
        </div>
      </div>
    </section>
  );
}
