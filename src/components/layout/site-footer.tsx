import Link from "next/link";
import { siteConfig } from "@/config/site";
import { getLegalConfig } from "@/config/legal";
import { KayartBrand } from "./kayart-brand";
export function SiteFooter() {
  return <footer className="site-footer"><div className="container">
    <div className="footer-top"><div><div className="eyebrow">À bientôt à l’atelier.</div><h2>Une idée en tête ?<br/><Link href="/contact">Parlons-en. <span aria-hidden="true">↗</span></Link></h2></div><div className="footer-contact"><a href={`mailto:${siteConfig.email}`}>{siteConfig.email}</a><a href={`tel:${siteConfig.phone.replace(/\s/g, "")}`}>{siteConfig.phone}</a><p>Retrait à l’atelier sur rendez-vous.</p></div></div>
    <div className="footer-bottom"><Link className="footer-wordmark" href="/" aria-label="KayArt — accueil"><KayartBrand /></Link><nav aria-label="Liens de pied de page"><Link href="/boutique">Boutique</Link><Link href="/savoir-faire">L’atelier</Link><Link href="/journal">Journal</Link>{getLegalConfig().approved ? <><Link href="/mentions-legales">Mentions légales</Link><Link href="/confidentialite">Confidentialité</Link><Link href="/cgv">CGV</Link></> : null}</nav></div>
  </div></footer>;
}
