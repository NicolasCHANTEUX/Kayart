/** New Supabase secret keys are API keys, while legacy service-role keys are JWTs. */
export function supabaseServiceHeaders(key: string) {
  const headers: Record<string, string> = { apikey: key };
  if (!key.startsWith("sb_secret_")) headers.Authorization = `Bearer ${key}`;
  return headers;
}
