import Link from "next/link";
import { redirect } from "next/navigation";
import { sanitizeRedirectPath } from "@/lib/safe-redirect";
import { loginAction, logoutAction } from "@/app/connexion/actions";
import { AuthSubmitButton } from "@/components/auth/auth-submit-button";
import { getCurrentAuthSession } from "@/server/auth/session";

export const metadata = {
  robots: { index: false, follow: false },
  title: "Connexion"
};

type LoginPageProps = {
  searchParams?: Promise<LoginSearchParams>;
};

type LoginSearchParams = {
  created?: string;
  email?: string;
  error?: string;
  redirect?: string;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const [params, session] = await Promise.all([
    searchParams ?? Promise.resolve({} as LoginSearchParams),
    getCurrentAuthSession()
  ]);
  const redirectPath = sanitizeRedirectPath(params.redirect);

  if (session?.role === "admin") {
    redirect(redirectPath || "/admin");
  }

  if (session && redirectPath.startsWith("/admin")) {
    return <section className="section auth-page"><div className="container auth-layout">
      <div><div className="eyebrow">Administration</div><h1 className="page-title">Accès administrateur requis</h1><p className="lead">Vous êtes connecté, mais ce compte ne dispose pas des droits nécessaires pour gérer l’atelier.</p></div>
      <div className="auth-panel"><p>Compte connecté : <strong>{session.user.email}</strong></p><p>Si vous gérez KayArt, faites vérifier les droits associés à ce compte. Vous pouvez aussi vous déconnecter pour utiliser votre compte administrateur.</p>
        <form action={logoutAction}><button className="button button--primary" type="submit">Se déconnecter</button></form><Link className="text-link" href="/">Retour au site</Link>
      </div>
    </div></section>;
  }

  if (session) {
    redirect(redirectPath || "/");
  }

  return (
    <section className="section auth-page">
      <div className="container auth-layout">
        <div>
          <div className="eyebrow">Espace sécurisé</div>
          <h1 className="page-title">Connexion</h1>
          <p className="lead">
            Bienvenue. Connectez-vous avec les identifiants de votre compte KayArt.
          </p>
        </div>

        <div className="auth-panel">
          <div className="auth-panel__header">
            <strong>Vos identifiants</strong>
            <p>Utilisez l’adresse email avec laquelle vous avez créé votre compte.</p>
          </div>

          {params.error ? <p className="form-notice form-notice--error">{params.error}</p> : null}
          {params.created ? (
            <p className="form-notice form-notice--success">
              Compte créé. Si vous avez reçu un email de confirmation, validez-le avant de vous connecter.
            </p>
          ) : null}

          <form action={loginAction} className="auth-form">
            <input name="redirect" type="hidden" value={redirectPath} />
            <label>
              Adresse mail
              <input
                autoComplete="email"
                defaultValue={params.email ?? ""}
                inputMode="email"
                name="email"
                placeholder="vous@exemple.fr"
                required
                type="email"
              />
            </label>
            <label>
              Mot de passe
              <input
                autoComplete="current-password"
                name="password"
                placeholder="Votre mot de passe"
                required
                type="password"
              />
            </label>
            <AuthSubmitButton idleLabel="Se connecter" pendingLabel="Connexion..." />
            <div className="auth-links">
              <Link href="/inscription">Créer un compte</Link>
              <Link href="/mot-de-passe-oublie">Mot de passe oublié</Link>
            </div>
          </form>
        </div>
      </div>
    </section>
  );
}
