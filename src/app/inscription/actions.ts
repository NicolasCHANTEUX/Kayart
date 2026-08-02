"use server";

import { redirect } from "next/navigation";
import { resolveAuthenticatedSession } from "@/server/auth/session";
import {
  AuthConfigurationError,
  AuthCredentialsError,
  signUpWithPassword
} from "@/server/auth/supabase-auth";
import {
  enforceRateLimit,
  getActionClientKey,
  RateLimitError,
  requireSameOriginAction
} from "@/server/security/request-guards";

export async function signupAction(formData: FormData) {
  await requireSameOriginAction();

  let email = "";

  try {
    email = readRequiredField(formData, "email").toLowerCase();
    enforceRateLimit({
      key: await getActionClientKey("signup", email),
      limit: 5,
      windowMs: 60 * 60 * 1000
    });

    const password = readRequiredField(formData, "password");
    const passwordConfirmation = readRequiredField(formData, "passwordConfirmation");

    if (password.length < 8) {
      throw new Error("Le mot de passe doit contenir au moins 8 caractères.");
    }

    if (password !== passwordConfirmation) {
      throw new Error("Les deux mots de passe ne correspondent pas.");
    }

    const user = await signUpWithPassword(email, password);
    await resolveAuthenticatedSession(user);
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

  return value.trim();
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
