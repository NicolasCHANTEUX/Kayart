"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";

type PasswordResetFormProps = {
  supabasePublishableKey: string;
  supabaseUrl: string;
};

export function PasswordResetForm({ supabasePublishableKey, supabaseUrl }: PasswordResetFormProps) {
  const [accessToken, setAccessToken] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isPending, setIsPending] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.hash.replace(/^#/u, "") || window.location.search);
    const urlError = params.get("error_description") ?? params.get("error");
    const token = params.get("access_token") ?? "";

    if (urlError) {
      setErrorMessage(urlError);
      return;
    }

    if (!token) {
      setErrorMessage("Le lien de réinitialisation est invalide ou a expiré.");
      return;
    }

    setAccessToken(token);
  }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const formData = new FormData(event.currentTarget);
    const password = String(formData.get("password") ?? "");
    const passwordConfirmation = String(formData.get("passwordConfirmation") ?? "");

    setErrorMessage("");

    if (!accessToken) {
      setErrorMessage("Le lien de réinitialisation est invalide ou a expiré.");
      return;
    }

    if (password.length < 8) {
      setErrorMessage("Le mot de passe doit contenir au moins 8 caractères.");
      return;
    }

    if (password !== passwordConfirmation) {
      setErrorMessage("Les deux mots de passe ne correspondent pas.");
      return;
    }

    setIsPending(true);

    try {
      const response = await fetch(`${supabaseUrl}/auth/v1/user`, {
        body: JSON.stringify({ password }),
        headers: {
          apikey: supabasePublishableKey,
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json"
        },
        method: "PUT"
      });

      if (!response.ok) {
        setErrorMessage("Impossible de modifier le mot de passe. Le lien a peut-être expiré.");
        return;
      }

      setIsSuccess(true);
      window.history.replaceState({}, document.title, "/nouveau-mot-de-passe");
    } catch (error) {
      setErrorMessage("Impossible de modifier le mot de passe pour le moment.");
    } finally {
      setIsPending(false);
    }
  }

  if (!supabaseUrl || !supabasePublishableKey) {
    return (
      <p className="form-notice form-notice--error">
        La réinitialisation Supabase n'est pas configurée pour le moment.
      </p>
    );
  }

  if (isSuccess) {
    return (
      <div className="auth-form">
        <p className="form-notice form-notice--success">
          Votre mot de passe a été modifié. Vous pouvez maintenant vous connecter.
        </p>
        <Link className="button button--primary auth-form__submit" href="/connexion">
          Aller à la connexion
        </Link>
      </div>
    );
  }

  return (
    <form className="auth-form" onSubmit={handleSubmit}>
      {errorMessage ? <p className="form-notice form-notice--error">{errorMessage}</p> : null}
      <label>
        Nouveau mot de passe
        <input
          autoComplete="new-password"
          disabled={!accessToken || isPending}
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
          disabled={!accessToken || isPending}
          minLength={8}
          name="passwordConfirmation"
          placeholder="Retapez le mot de passe"
          required
          type="password"
        />
      </label>
      <button className="button button--primary auth-form__submit" disabled={!accessToken || isPending} type="submit">
        {isPending ? (
          <>
            <span className="loading-spinner" aria-hidden="true" />
            Modification...
          </>
        ) : (
          "Modifier le mot de passe"
        )}
      </button>
      <div className="auth-links">
        <Link href="/mot-de-passe-oublie">Demander un nouveau lien</Link>
      </div>
    </form>
  );
}
