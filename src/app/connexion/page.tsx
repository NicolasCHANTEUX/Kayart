import Link from "next/link";
import { redirect } from "next/navigation";
import { loginAction } from "@/app/connexion/actions";
import { AuthSubmitButton } from "@/components/auth/auth-submit-button";
import { getCurrentAuthSession } from "@/server/auth/session";

export const metadata = {
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
  const redirectPath = sanitizeRedirectParam(params.redirect);

  if (session?.role === "admin") {
    redirect(redirectPath || "/admin");
  }

  if (session) {
    redirect(redirectPath && !redirectPath.startsWith("/admin") ? redirectPath : "/");
  }

  return (
    <section className="section auth-page">
      <div className="container auth-layout">
        <div>
          <div className="eyebrow">Espace sécurisé</div>
          <h1 className="page-title">Connexion</h1>
          <p className="lead">
            Connectez-vous avec l'adresse mail et le mot de passe du compte administrateur KayArt.
          </p>
        </div>

        <div className="auth-panel">
          <div className="auth-panel__header">
            <strong>Accès administrateur</strong>
            <p>Les comptes non administrateurs restent sur l'expérience publique du site.</p>
          </div>

          {params.error ? <p className="form-notice form-notice--error">{params.error}</p> : null}
          {params.created ? (
            <p className="form-notice form-notice--success">
              Compte créé. Si Supabase vous a envoyé un email de confirmation, validez-le avant de vous connecter.
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
                placeholder="admin@kayart.fr"
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

function sanitizeRedirectParam(path?: string) {
  if (!path || !path.startsWith("/") || path.startsWith("//")) {
    return "";
  }

  return path;
}
