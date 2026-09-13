import { randomUUID } from "node:crypto";
import { CustomerRequestForm } from "@/components/requests/customer-request-form";
import { siteConfig } from "@/config/site";
export const metadata = {
  title: "Réparation",
  description: "Demander un diagnostic de réparation carbone à l'atelier KayArt."
};

export default function RepairPage() {
  return (
    <section className="section">
      <div className="container split">
        <div>
          <div className="eyebrow">Réparation / Diagnostic</div>
          <h1 className="page-title">Une nouvelle vie<br/>pour votre matériel.</h1>
          <p className="lead">
            Décrivez la pièce et les dommages constatés. Vous pouvez joindre des photos pour aider
            l’atelier à évaluer la réparation. Un échange permettra de confirmer les possibilités et le devis.
          </p>
          <CustomerRequestForm kind="repair" submissionKey={randomUUID()} enabled={process.env.KAYART_DATA_SOURCE === "prisma"} />
        </div>
        <aside className="feature-card request-guide">
          <div className="meta">Atelier</div>
          <h3>Préparer le diagnostic</h3>
          <p>Précisez le type de pièce, son usage et les circonstances du dommage. Photographiez la pièce entière puis la zone concernée.</p>
          <ol className="request-steps"><li><span>01</span>Présentez votre besoin</li><li><span>02</span>Échangez avec l’atelier</li><li><span>03</span>Validez les prochaines étapes</li></ol>
          <p><a href={`mailto:${siteConfig.email}`}>{siteConfig.email}</a></p>
        </aside>
      </div>
    </section>
  );
}
