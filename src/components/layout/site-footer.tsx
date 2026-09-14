import Link from "next/link";
import { siteConfig } from "@/config/site";
import { getLegalConfig } from "@/config/legal";
import { KayartBrand } from "./kayart-brand";

const footerLinks = [
  { href: "/boutique", label: "Boutique" },
  { href: "/sur-mesure", label: "Sur mesure" },
  { href: "/reparation", label: "Réparation" },
  { href: "/savoir-faire", label: "L’atelier" },
  { href: "/journal", label: "Journal" }
];

export function SiteFooter() {
  const legalApproved = getLegalConfig().approved;

  return (
    <footer className="site-footer">
      <div className="footer-cta">
        <div className="container footer-cta__inner">
          <h2><span>Une idée en tête ?</span><Link href="/contact">Parlons-en. <span aria-hidden="true">↗</span></Link></h2>
          <div className="footer-cta__copy">
            <p>Une réparation, une pièce sur mesure ou une question ?</p>
            <Link className="footer-cta__link" href="/contact">Contacter l’atelier <span aria-hidden="true">↗</span></Link>
          </div>
        </div>
      </div>
      <div className="container">
        <div className="footer-main">
          <div className="footer-identity">
            <Link className="footer-wordmark" href="/" aria-label="KayArt - accueil"><KayartBrand /></Link>
            <p>Kayak · Art · Composite · Sport</p>
          </div>
          <nav className="footer-navigation" aria-labelledby="footer-navigation-title">
            <h3 id="footer-navigation-title">Navigation</h3>
            {footerLinks.map(({ href, label }) => <Link key={href} href={href}>{label}<span aria-hidden="true">↗</span></Link>)}
          </nav>
          <div className="footer-contact">
            <h3>L’atelier</h3>
            <address>
              <a href={`mailto:${siteConfig.email}`}>{siteConfig.email}</a>
              <a href={`tel:${siteConfig.phone.replace(/\s/g, "")}`}>{siteConfig.phone}</a>
            </address>
            <p>Retrait à l’atelier sur rendez-vous.</p>
          </div>
        </div>
        <div className="footer-legal">
          <small>© {new Date().getFullYear()} KayArt</small>
          {legalApproved ? (
            <nav aria-label="Informations légales">
              <Link href="/mentions-legales">Mentions légales</Link>
              <Link href="/cgv">CGV</Link>
              <Link href="/confidentialite">Politique de confidentialité</Link>
            </nav>
          ) : null}
        </div>
      </div>
    </footer>
  );
}
