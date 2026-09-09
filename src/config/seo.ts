// Explicit activation avoids indexing fixtures, previews, or a guessed domain.
export function getIndexableOrigin(): string | null {
  if (process.env.KAYART_INDEXING_ENABLED !== "true" || process.env.KAYART_DATA_SOURCE !== "prisma") return null;
  if (process.env.VERCEL_ENV && process.env.VERCEL_ENV !== "production") return null;
  try {
    const url = new URL(process.env.NEXT_PUBLIC_SITE_URL || "");
    if (url.protocol !== "https:" || url.username || url.password || url.port || url.pathname !== "/" || url.search || url.hash) return null;
    if (!url.hostname.includes(".") || /^[\d.]+$/.test(url.hostname) || /(?:^|\.)(?:localhost|local|internal|test|invalid|example)$/.test(url.hostname)) return null;
    return url.origin;
  } catch {
    return null;
  }
}
