import type { ReactNode } from "react";
import Link from "next/link";
import { requireAccountSession } from "@/server/auth/session";
import { logoutAction } from "@/app/connexion/actions";
import "@/styles/atelier/account.css";

export const metadata = { robots: { index: false, follow: false } };

export default async function AccountLayout({ children }: { children: ReactNode }) {
  await requireAccountSession();
  return <div className="account-shell">
    <div className="container account-shell__inner">
      <nav className="account-nav" aria-label="Espace compte">
        <Link href="/compte">Vue d’ensemble</Link>
        <Link href="/compte/commandes">Mes commandes</Link>
        <Link href="/compte/profil">Mes informations</Link>
        <form action={logoutAction}><button type="submit">Déconnexion</button></form>
      </nav>
      {children}
    </div>
  </div>;
}
