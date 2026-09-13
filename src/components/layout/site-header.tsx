import Link from "next/link";
import { logoutAction } from "@/app/connexion/actions";
import { getCurrentAuthSession } from "@/server/auth/session";
import { MainNavigation, CartLink, AdminQuickAccess } from "./navigation";
import { KayartBrand } from "./kayart-brand";
export async function SiteHeader() {
  const session = await getCurrentAuthSession();
  return <header className="site-header"><div className="container site-header__inner">
    <Link className="brand" href="/" aria-label="KayArt — accueil"><KayartBrand /></Link>
    <MainNavigation/>
    <div className="header-actions">
      {session ? <form action={logoutAction} className="header-actions__form"><button className="account-link" type="submit">Déconnexion</button></form> : <Link className="account-link" href="/connexion" aria-label="Connexion"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true"><circle cx="12" cy="7" r="3.5" stroke="currentColor" strokeWidth="1.5"/><path d="M4 21v-2a8 8 0 0 1 16 0v2" stroke="currentColor" strokeWidth="1.5"/></svg><span className="sr-only">Connexion</span></Link>}
      <CartLink/>
    </div>
  </div>{session?.role === "admin" ? <AdminQuickAccess/> : null}</header>;
}
