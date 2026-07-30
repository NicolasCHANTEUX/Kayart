import Link from "next/link";
import { logoutAction } from "@/app/connexion/actions";
import { siteConfig } from "@/config/site";
import { getCurrentAuthSession } from "@/server/auth/session";

export async function SiteHeader() {
  const session = await getCurrentAuthSession();
  const isAdmin = session?.role === "admin";

  return (
    <header className="site-header">
      <div className="container site-header__inner">
        <Link className="brand" href="/" aria-label="Retour à l'accueil KayArt">
          <span className="brand__name">{siteConfig.name}</span>
          <span className="brand__tagline">{siteConfig.tagline}</span>
        </Link>

        <nav className="nav" aria-label="Navigation principale">
          {siteConfig.nav.map((item) => (
            <Link key={item.href} href={item.href}>
              {item.label}
            </Link>
          ))}
          {isAdmin ? (
            <Link className="nav__admin-link" href="/admin">
              Admin
            </Link>
          ) : null}
        </nav>

        <div className="header-actions">
          {session ? (
            <form action={logoutAction} className="header-actions__form">
              <button className="icon-link icon-link--button" type="submit">
                Déconnexion
              </button>
            </form>
          ) : (
            <Link className="icon-link" href="/connexion">
              Connexion
            </Link>
          )}
          <Link className="icon-link" href="/panier" aria-label="Voir le panier">
            Panier
          </Link>
        </div>
      </div>
    </header>
  );
}
