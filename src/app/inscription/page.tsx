import Link from "next/link";
import { redirect } from "next/navigation";
import { signupAction } from "@/app/inscription/actions";
import { AuthSubmitButton } from "@/components/auth/auth-submit-button";
import { getCurrentAuthSession } from "@/server/auth/session";

export const metadata = {
  title: "Création de compte"
};

type SignupPageProps = {
  searchParams?: Promise<SignupSearchParams>;
};

type SignupSearchParams = {
  email?: string;
  error?: string;
};

export default async function SignupPage({ searchParams }: SignupPageProps) {
  const [params, session] = await Promise.all([
    searchParams ?? Promise.resolve({} as SignupSearchParams),
    getCurrentAuthSession()
  ]);

  if (session?.role === "admin") {
    redirect("/admin");
  }

  if (session) {
    redirect("/");
  }

  return (
    <section className="section auth-page">
      <div className="container auth-layout">
        <div>
          <div className="eyebrow">Compte KayArt</div>
          <h1 className="page-title">Créer un compte</h1>
          <p className="lead">
            Créez un accès client avec une adresse mail et un mot de passe. Les droits administrateur restent attribués séparément.
          </p>
        </div>

        <div className="auth-panel">
          <div className="auth-panel__header">
            <strong>Nouvel accès</strong>
            <p>Un compte créé ici reste un compte client classique par défaut.</p>
          </div>

          {params.error ? <p className="form-notice form-notice--error">{params.error}</p> : null}

          <form action={signupAction} className="auth-form">
            <label>
              Adresse mail
              <input
                autoComplete="email"
                defaultValue={params.email ?? ""}
                inputMode="email"
                name="email"
                placeholder="vous@example.com"
                required
                type="email"
              />
            </label>
            <label>
              Mot de passe
              <input
                autoComplete="new-password"
                minLength={8}
                name="password"
                placeholder="8 caractères minimum"
                required
                type="password"
              />
            </label>
            <label>
              Confirmer le mot de passe
              <input
                autoComplete="new-password"
                minLength={8}
                name="passwordConfirmation"
                placeholder="Retapez le mot de passe"
                required
                type="password"
              />
            </label>
            <AuthSubmitButton idleLabel="Créer le compte" pendingLabel="Création..." />
            <div className="auth-links">
              <Link href="/connexion">J'ai déjà un compte</Link>
            </div>
          </form>
        </div>
      </div>
    </section>
  );
}
