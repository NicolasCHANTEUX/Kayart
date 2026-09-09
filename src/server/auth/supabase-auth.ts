import type { AuthenticatedUser } from "@/types/auth";
import { normalizeSiteUrl } from "@/config/site";

type SupabasePasswordSession = {
  accessToken: string;
  expiresIn: number;
  refreshToken: string;
  user: AuthenticatedUser;
};

type SupabaseAuthUserResponse = {
  id?: string;
  email?: string;
};

type SupabasePasswordResponse = {
  access_token?: string;
  expires_in?: number;
  refresh_token?: string;
  user?: SupabaseAuthUserResponse;
};

type SupabaseSignupResponse = SupabasePasswordResponse & SupabaseAuthUserResponse & {
  session?: SupabasePasswordResponse | null;
};

type SupabaseErrorResponse = {
  error?: string;
  error_description?: string;
  message?: string;
};

export class AuthConfigurationError extends Error {}
export class AuthCredentialsError extends Error {}

export async function refreshPasswordSession(refreshToken: string): Promise<SupabasePasswordSession | null> {
  const { apiKey, authUrl } = getSupabaseAuthConfig();
  const response = await fetch(`${authUrl}/token?grant_type=refresh_token`, {
    method: "POST", cache: "no-store", redirect: "error", signal: AbortSignal.timeout(5000),
    headers: { apikey: apiKey, "Content-Type": "application/json" },
    body: JSON.stringify({ refresh_token: refreshToken })
  });
  const payload = await response.json().catch(() => null) as (SupabasePasswordResponse & { error_code?: string }) | null;
  // Only explicit credential failures discard cookies; outages/rate limits must remain retryable.
  if ([400, 401, 403].includes(response.status) && ["refresh_token_not_found", "refresh_token_already_used", "session_not_found", "session_expired", "user_not_found", "user_banned"].includes(payload?.error_code ?? "")) return null;
  if (!response.ok || !payload || typeof payload.access_token !== "string" || !payload.access_token || typeof payload.refresh_token !== "string" || !payload.refresh_token ||
    !Number.isSafeInteger(payload.expires_in) || payload.expires_in! <= 0 || !payload.user?.id || !payload.user.email) {
    throw new Error("Session refresh unavailable.");
  }
  return { accessToken: payload.access_token, refreshToken: payload.refresh_token, expiresIn: payload.expires_in!, user: { id: payload.user.id, email: payload.user.email } };
}

export async function revokePasswordSession(accessToken: string) {
  const { apiKey, authUrl } = getSupabaseAuthConfig();
  const response = await fetch(`${authUrl}/logout?scope=local`, {
    method: "POST", cache: "no-store", signal: AbortSignal.timeout(5000),
    headers: { apikey: apiKey, Authorization: `Bearer ${accessToken}` }
  });
  if (!response.ok && response.status !== 401 && response.status !== 403) throw new Error("Session revocation unavailable.");
}

export async function signUpWithPassword(email: string, password: string): Promise<AuthenticatedUser> {
  const { apiKey, authUrl } = getSupabaseAuthConfig();
  const response = await fetch(`${authUrl}/signup`, {
    body: JSON.stringify({ email, password }),
    cache: "no-store",
    headers: {
      apikey: apiKey,
      "Content-Type": "application/json"
    },
    method: "POST"
  });

  const payload = (await response.json().catch(() => ({}))) as SupabaseSignupResponse & SupabaseErrorResponse;

  if (!response.ok) {
    throw new AuthCredentialsError(getSignupErrorMessage(payload));
  }

  const user = payload.user ?? payload.session?.user ?? payload;

  if (!user?.id) {
    throw new AuthCredentialsError("Le compte a été créé, mais Supabase n'a pas renvoyé son identifiant.");
  }

  return {
    id: user.id,
    email: user.email ?? email
  };
}

export async function signInWithPassword(email: string, password: string): Promise<SupabasePasswordSession> {
  const { apiKey, authUrl } = getSupabaseAuthConfig();
  const response = await fetch(`${authUrl}/token?grant_type=password`, {
    body: JSON.stringify({ email, password }),
    cache: "no-store",
    headers: {
      apikey: apiKey,
      "Content-Type": "application/json"
    },
    method: "POST"
  });

  const payload = (await response.json().catch(() => ({}))) as SupabasePasswordResponse & SupabaseErrorResponse;

  if (!response.ok) {
    throw new AuthCredentialsError(getAuthErrorMessage(payload));
  }

  if (
    !payload.access_token ||
    !payload.refresh_token ||
    !payload.user?.id
  ) {
    throw new AuthCredentialsError("La connexion a abouti, mais la session retournée est incomplète.");
  }

  return {
    accessToken: payload.access_token,
    expiresIn: payload.expires_in ?? 3600,
    refreshToken: payload.refresh_token,
    user: {
      id: payload.user.id,
      email: payload.user.email ?? email
    }
  };
}

export async function requestPasswordRecovery(email: string) {
  const { apiKey, authUrl } = getSupabaseAuthConfig();
  const redirectTo = `${getSiteUrl()}/nouveau-mot-de-passe`;
  const url = new URL(`${authUrl}/recover`);
  url.searchParams.set("redirect_to", redirectTo);

  const response = await fetch(url, {
    body: JSON.stringify({ email }),
    cache: "no-store",
    headers: {
      apikey: apiKey,
      "Content-Type": "application/json"
    },
    method: "POST"
  });

  const payload = (await response.json().catch(() => ({}))) as SupabaseErrorResponse;

  if (!response.ok) {
    throw new AuthCredentialsError(getRecoveryErrorMessage(payload));
  }
}

export async function getSupabaseAuthUser(accessToken: string): Promise<AuthenticatedUser | null> {
  const { apiKey, authUrl } = getSupabaseAuthConfig();
  const response = await fetch(`${authUrl}/user`, {
    cache: "no-store",
    signal: AbortSignal.timeout(5000),
    headers: {
      apikey: apiKey,
      Authorization: `Bearer ${accessToken}`
    }
  });

  if (!response.ok) {
    return null;
  }

  const payload = (await response.json().catch(() => ({}))) as SupabaseAuthUserResponse;

  if (!payload.id || !payload.email) {
    return null;
  }

  return {
    id: payload.id,
    email: payload.email
  };
}

function getSupabaseAuthConfig() {
  const apiKey =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
    process.env.SUPABASE_ANON_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const projectUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL;

  if (!apiKey || !projectUrl) {
    throw new AuthConfigurationError(
      "La connexion Supabase n'est pas configurée. Vérifiez NEXT_PUBLIC_SUPABASE_URL et NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY."
    );
  }

  const cleanProjectUrl = projectUrl.replace(/\/rest\/v1\/?$/u, "").replace(/\/+$/u, "");

  return {
    apiKey,
    authUrl: `${cleanProjectUrl}/auth/v1`
  };
}

function getAuthErrorMessage(payload: SupabaseErrorResponse) {
  const rawMessage = payload.error_description ?? payload.message ?? payload.error ?? "";
  const normalizedMessage = rawMessage.toLowerCase();

  if (normalizedMessage.includes("email not confirmed") || normalizedMessage.includes("not confirmed")) {
    return "Votre adresse mail n'est pas encore confirmée. Vérifiez votre boîte mail avant de vous connecter.";
  }

  if (normalizedMessage.includes("invalid") || normalizedMessage.includes("credentials")) {
    return "Adresse mail ou mot de passe incorrect.";
  }

  if (normalizedMessage.includes("too many") || normalizedMessage.includes("rate limit")) {
    return "Trop de tentatives de connexion. Patientez quelques minutes avant de réessayer.";
  }

  if (normalizedMessage.includes("disabled")) {
    return "La connexion par email et mot de passe n'est pas active dans Supabase.";
  }

  return "Impossible de se connecter pour le moment.";
}

function getSignupErrorMessage(payload: SupabaseErrorResponse) {
  const rawMessage = payload.error_description ?? payload.message ?? payload.error ?? "";
  const normalizedMessage = rawMessage.toLowerCase();

  if (normalizedMessage.includes("already") || normalizedMessage.includes("registered")) {
    return "Un compte existe déjà avec cette adresse mail.";
  }

  if (normalizedMessage.includes("password")) {
    return "Le mot de passe ne respecte pas les règles de sécurité attendues.";
  }

  return "Impossible de créer le compte pour le moment.";
}

function getRecoveryErrorMessage(payload: SupabaseErrorResponse) {
  const rawMessage = payload.error_description ?? payload.message ?? payload.error ?? "";
  const normalizedMessage = rawMessage.toLowerCase();

  if (normalizedMessage.includes("email")) {
    return "Impossible d'envoyer l'email de réinitialisation à cette adresse.";
  }

  return "Impossible d'envoyer l'email de réinitialisation pour le moment.";
}

function getSiteUrl() {
  return normalizeSiteUrl(process.env.NEXT_PUBLIC_SITE_URL ?? process.env.VERCEL_URL ?? "http://localhost:3000");
}
