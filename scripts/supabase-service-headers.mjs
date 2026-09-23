// New secret keys belong in apikey; legacy service-role JWTs also need Authorization.
export function supabaseServiceHeaders(key) {
  return key.startsWith('sb_secret_')
    ? { apikey: key }
    : { apikey: key, Authorization: `Bearer ${key}` };
}
