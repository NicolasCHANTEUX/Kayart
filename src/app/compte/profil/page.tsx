import Link from "next/link";
import { getAccountProfile } from "@/server/account/account-service";
import { saveAccountProfile } from "./actions";

export const metadata = { title: "Mes informations" };

export default async function ProfilePage({ searchParams }: { searchParams?: Promise<{ saved?: string; error?: string }> }) {
  const [profile, params] = await Promise.all([getAccountProfile(), searchParams ?? Promise.resolve({} as { saved?: string; error?: string })]);
  return <div className="account-page account-page--narrow">
    <div className="account-page__intro"><div className="account-kicker">Mon compte / Profil</div><h1>Mes informations</h1><p>Les informations dont nous avons besoin pour échanger avec vous.</p></div>
    <section className="account-panel account-profile-card" aria-label="Modifier mes informations">
      {params.saved === "1" ? <p className="form-notice form-notice--success" role="status">Vos informations ont été enregistrées.</p> : null}
      {params.error === "1" ? <p className="form-notice form-notice--error" role="alert">Enregistrement impossible. Vérifiez les champs et réessayez.</p> : null}
      <form action={saveAccountProfile} className="account-profile-form">
        <div className="account-form-grid"><label>Prénom<input autoComplete="given-name" defaultValue={profile.firstName} maxLength={80} name="firstName" /></label><label>Nom<input autoComplete="family-name" defaultValue={profile.lastName} maxLength={80} name="lastName" /></label></div>
        <label>Téléphone<input autoComplete="tel" defaultValue={profile.phone} maxLength={30} name="phone" type="tel" /></label>
        <div className="account-profile-form__readonly"><span>Adresse email du compte</span><strong>{profile.email}</strong><small>Cette adresse est liée à votre connexion et ne se modifie pas ici.</small></div>
        <div className="account-profile-form__actions"><button className="button button--primary" type="submit">Enregistrer les modifications</button><Link href="/compte">Retour à mon compte</Link></div>
      </form>
    </section>
  </div>;
}
