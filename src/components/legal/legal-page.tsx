import { notFound } from "next/navigation";
import { getLegalConfig } from "@/config/legal";
export function LegalPage({ kind }: { kind: "notice" | "terms" | "privacy" }) {
  const config = getLegalConfig();
  if (!config.approved) notFound();
  const title = kind === "notice" ? "Mentions légales" : kind === "terms" ? "Conditions générales de vente" : "Confidentialité";
  return <section className="section"><div className="container"><h1 className="page-title">{title}</h1><p>Version {config.version}</p>
    <h2>{config.commercialName}</h2><p>{config.legalName} — {config.legalForm}</p><p>{config.legalAddress}</p><p>{config.registration}</p><p>{config.taxStatement}</p><p><a href={`mailto:${config.email}`}>{config.email}</a> — {config.phone}</p>
    {kind === "notice" ? <><h2>Publication et hébergement</h2><p>{config.publicationDirector}</p><p>{config.hostingStatement}</p></> : null}
    {kind === "terms" ? <><h2>Produits standards</h2><p className="request-message">{config.standardTerms}</p><h2>Produits réellement personnalisés et sur mesure</h2><p className="request-message">{config.customTerms}</p><h2>Médiation de la consommation</h2><p>{config.mediator}</p></> : null}
    {kind === "privacy" ? <><h2>Utilisation des données</h2><p>Les coordonnées et informations transmises à l’atelier servent à traiter les demandes, préparer les commandes et répondre aux clients.</p><p>{config.privacyBasis}</p><h2>Destinataires et conservation</h2><p>{config.privacyRecipients}</p><p>{config.privacyRetention}</p><h2>Vos droits</h2><p>Pour accéder à vos données, les rectifier ou demander leur suppression, contactez l’atelier à l’adresse indiquée ci-dessus. Vous pouvez également consulter les informations et recours auprès de la CNIL.</p><a href="https://www.cnil.fr/fr/les-droits-pour-maitriser-vos-donnees-personnelles">Informations de la CNIL</a></> : null}
  </div></section>;
}
