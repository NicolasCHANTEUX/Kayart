import Link from "next/link";
import { passwordRecoveryAction } from "@/app/mot-de-passe-oublie/actions";
import { AuthSubmitButton } from "@/components/auth/auth-submit-button";

export const metadata = {
  title: "Mot de passe oublié"
};

type PasswordRecoveryPageProps = {
  searchParams?: Promise<PasswordRecoverySearchParams>;
};

type PasswordRecoverySearchParams = {
  email?: string;
  error?: string;
  sent?: string;
};

export default async function PasswordRecoveryPage({ searchParams }: PasswordRecoveryPageProps) {
  const params = searchParams ? await searchParams : {};

  return (
    <section className="section auth-page">
      <div className="container auth-layout">
        <div>
          <div className="eyebrow">Récupération</div>
          <h1 className="page-title">Mot de passe oublié</h1>
          <p className="lead">
            Entrez l'adresse mail du compte. Si elle existe, Supabase enverra un lien pour définir un nouveau mot de passe.
          </p>
        </div>

        <div className="auth-panel">
          <div className="auth-panel__header">
            <strong>Réinitialisation</strong>
            <p>Le lien envoyé par email ouvrira une page KayArt pour choisir un nouveau mot de passe.</p>
          </div>

          {params.error ? <p className="form-notice form-notice--error">{params.error}</p> : null}
          {params.sent ? (
            <p className="form-notice form-notice--success">
              Si un compte existe avec cette adresse, un email de réinitialisation vient d'être envoyé.
            </p>
          ) : null}

          <form action={passwordRecoveryAction} className="auth-form">
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
            <AuthSubmitButton idleLabel="Envoyer le lien" pendingLabel="Envoi..." />
            <div className="auth-links">
              <Link href="/connexion">Retour à la connexion</Link>
            </div>
          </form>
        </div>
      </div>
    </section>
  );
}
