"use server";

import { redirect } from "next/navigation";
import {
  clearPasswordSession,
  persistPasswordSession,
  resolveAuthenticatedSession
} from "@/server/auth/session";
import {
  AuthConfigurationError,
  AuthCredentialsError,
  signInWithPassword
} from "@/server/auth/supabase-auth";
import {
  enforceRateLimit,
  getActionClientKey,
  RateLimitError,
  requireSameOriginAction
} from "@/server/security/request-guards";

export async function loginAction(formData: FormData) {
  await requireSameOriginAction();

  const requestedRedirect = sanitizeRedirectPath(readOptionalField(formData, "redirect"));
  let email = "";
  let redirectPath = "/";

  try {
    email = readRequiredField(formData, "email").toLowerCase();
    enforceRateLimit({
      key: await getActionClientKey("login", email),
      limit: 8,
      windowMs: 15 * 60 * 1000
    });

    const password = readRequiredField(formData, "password");
    const passwordSession = await signInWithPassword(email, password);
    await persistPasswordSession(passwordSession);

    const session = await resolveAuthenticatedSession(passwordSession.user);
    redirectPath = getPostLoginRedirectPath(session.role, requestedRedirect);
  } catch (error) {
    const message = getLoginErrorMessage(error);
    redirect(`/connexion?error=${encodeURIComponent(message)}&email=${encodeURIComponent(email)}`);
  }

  redirect(redirectPath);
}

export async function logoutAction() {
  await clearPasswordSession();
  redirect("/");
}

function readRequiredField(formData: FormData, name: string) {
  const value = formData.get(name);

  if (typeof value !== "string" || !value.trim()) {
    throw new Error("Champ manquant.");
  }

  return value.trim();
}

function readOptionalField(formData: FormData, name: string) {
  const value = formData.get(name);
  return typeof value === "string" ? value : "";
}

function sanitizeRedirectPath(path: string) {
  if (!path || !path.startsWith("/") || path.startsWith("//")) {
    return "";
  }

  return path;
}

function getPostLoginRedirectPath(role: string, requestedRedirect: string) {
  if (role === "admin") {
    return requestedRedirect || "/admin";
  }

  if (requestedRedirect.startsWith("/admin")) {
    return "/";
  }

  return requestedRedirect || "/";
}

function getLoginErrorMessage(error: unknown) {
  if (error instanceof RateLimitError) {
    return error.message;
  }

  if (error instanceof AuthConfigurationError || error instanceof AuthCredentialsError) {
    return error.message;
  }

  return "Impossible de se connecter pour le moment.";
}
