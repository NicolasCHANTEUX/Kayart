const validationOrigin = "https://redirect.kayart.invalid";

/** Only internal, unambiguous URLs are accepted after authentication. */
export function sanitizeRedirectPath(value?: string): string {
  if (!value || !value.startsWith("/") || value.startsWith("//")) return "";
  try {
    // Check encoded separators too; the returned URL is never decoded.
    let decoded = value;
    for (let depth = 0; depth < 4; depth += 1) {
      if (/[^\S ]|[\\\u0000-\u001f\u007f]/u.test(decoded) || decoded.startsWith("//")) return "";
      const next = decodeURIComponent(decoded);
      if (next === decoded) break;
      decoded = next;
    }
    const url = new URL(value, validationOrigin);
    if (url.origin !== validationOrigin) return "";
    return `${url.pathname}${url.search}${url.hash}`;
  } catch {
    return "";
  }
}
