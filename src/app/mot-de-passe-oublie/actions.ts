"use server";

import { redirect } from "next/navigation";
import {
  AuthConfigurationError,
  AuthCredentialsError,
  requestPasswordRecovery
} from "@/server/auth/supabase-auth";
import {
  getActionClientKey,
  RateLimitError,
  requireSameOriginAction
} from "@/server/security/request-guards";
import { enforcePersistentAuthLimit } from "@/server/requests/request-rate-limit";

export async function passwordRecoveryAction(formData: FormData) {
  await requireSameOriginAction();

  let email = "";

  try {
    email = readRequiredField(formData, "email").toLowerCase();
    await enforcePersistentAuthLimit(
      await getActionClientKey("auth"),
      await getActionClientKey("password-recovery", email),
      5,
      60 * 60 * 1000
    );

    await requestPasswordRecovery(email);
  } catch (error) {
    const message = getRecoveryErrorMessage(error);
    redirect(`/mot-de-passe-oublie?error=${encodeURIComponent(message)}&email=${encodeURIComponent(email)}`);
  }

  redirect(`/mot-de-passe-oublie?sent=1&email=${encodeURIComponent(email)}`);
}

function readRequiredField(formData: FormData, name: string) {
  const value = formData.get(name);

  if (typeof value !== "string" || !value.trim()) {
    throw new Error("L'adresse mail est obligatoire.");
  }

  return value.trim();
}

function getRecoveryErrorMessage(error: unknown) {
  if (error instanceof RateLimitError) {
    return error.message;
  }

  if (error instanceof AuthConfigurationError || error instanceof AuthCredentialsError || error instanceof Error) {
    return error.message;
  }

  return "Impossible d'envoyer l'email de réinitialisation pour le moment.";
}
