import { PasswordResetForm } from "@/app/nouveau-mot-de-passe/password-reset-form";

export const metadata = {
  title: "Nouveau mot de passe"
};

export default function NewPasswordPage() {
  const supabaseUrl = cleanSupabaseUrl(process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL ?? "");
  const supabasePublishableKey =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
    process.env.SUPABASE_ANON_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
    "";

  return (
    <section className="section auth-page">
      <div className="container auth-layout">
        <div>
          <div className="eyebrow">Sécurité</div>
          <h1 className="page-title">Nouveau mot de passe</h1>
          <p className="lead">
            Choisissez un nouveau mot de passe depuis le lien de récupération reçu par email.
          </p>
        </div>

        <div className="auth-panel">
          <div className="auth-panel__header">
            <strong>Réinitialisation</strong>
            <p>Le lien de récupération est temporaire. Si la page refuse la modification, demandez un nouveau lien.</p>
          </div>

          <PasswordResetForm supabasePublishableKey={supabasePublishableKey} supabaseUrl={supabaseUrl} />
        </div>
      </div>
    </section>
  );
}

function cleanSupabaseUrl(url: string) {
  return url.replace(/\/rest\/v1\/?$/u, "").replace(/\/+$/u, "");
}
