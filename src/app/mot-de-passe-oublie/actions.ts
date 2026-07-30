"use server";

import { redirect } from "next/navigation";
import {
  AuthConfigurationError,
  AuthCredentialsError,
  requestPasswordRecovery
} from "@/server/auth/supabase-auth";

export async function passwordRecoveryAction(formData: FormData) {
  let email = "";

  try {
    email = readRequiredField(formData, "email").toLowerCase();
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
  if (error instanceof AuthConfigurationError || error instanceof AuthCredentialsError || error instanceof Error) {
    return error.message;
  }

  return "Impossible d'envoyer l'email de réinitialisation pour le moment.";
}
