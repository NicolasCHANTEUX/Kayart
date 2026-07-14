import Link from "next/link";
import { siteConfig } from "@/config/site";

export function SiteHeader() {
  return (
    <header className="site-header">
      <div className="container site-header__inner">
        <Link className="brand" href="/" aria-label="Retour a l'accueil KayArt">
          <span className="brand__name">{siteConfig.name}</span>
          <span className="brand__tagline">{siteConfig.tagline}</span>
        </Link>

        <nav className="nav" aria-label="Navigation principale">
          {siteConfig.nav.map((item) => (
            <Link key={item.href} href={item.href}>
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="header-actions">
          <Link className="icon-link" href="/panier" aria-label="Voir le panier">
            Panier
          </Link>
        </div>
      </div>
    </header>
  );
}
