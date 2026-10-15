"use server";

import { redirect } from "next/navigation";
import {
  AuthConfigurationError,
  AuthCredentialsError,
  signUpWithPassword
} from "@/server/auth/supabase-auth";
import {
  getActionClientKey,
  RateLimitError,
  requireSameOriginAction
} from "@/server/security/request-guards";
import { enforcePersistentAuthLimit } from "@/server/requests/request-rate-limit";

export async function signupAction(formData: FormData) {
  await requireSameOriginAction();

  let email = "";

  try {
    email = readRequiredField(formData, "email").toLowerCase();
    await enforcePersistentAuthLimit(
      await getActionClientKey("auth"),
      await getActionClientKey("signup", email),
      5,
      60 * 60 * 1000
    );

    const password = readRequiredField(formData, "password");
    const passwordConfirmation = readRequiredField(formData, "passwordConfirmation");

    if (password.length < 8) {
      throw new Error("Le mot de passe doit contenir au moins 8 caractères.");
    }

    if (password !== passwordConfirmation) {
      throw new Error("Les deux mots de passe ne correspondent pas.");
    }

    await signUpWithPassword(email, password);
  } catch (error) {
    const message = getSignupErrorMessage(error);
    redirect(`/inscription?error=${encodeURIComponent(message)}&email=${encodeURIComponent(email)}`);
  }

  redirect(`/connexion?created=1&email=${encodeURIComponent(email)}`);
}

function readRequiredField(formData: FormData, name: string) {
  const value = formData.get(name);

  if (typeof value !== "string" || !value.trim()) {
    throw new Error("Tous les champs sont obligatoires.");
  }

  return name.startsWith("password") ? value : value.trim();
}

function getSignupErrorMessage(error: unknown) {
  if (error instanceof RateLimitError) {
    return error.message;
  }

  if (error instanceof AuthConfigurationError || error instanceof AuthCredentialsError || error instanceof Error) {
    return error.message;
  }

  return "Impossible de créer le compte pour le moment.";
}
