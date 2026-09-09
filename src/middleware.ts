import { getLegalConfig } from "@/config/legal";
import type { NextRequest } from "next/server";
import { refreshRequestSession } from "@/server/auth/refresh-middleware";

// Reject before React streaming starts, so unpublished legal pages really return 404.
export async function middleware(request: NextRequest) {
  if (["/mentions-legales", "/cgv", "/confidentialite"].includes(request.nextUrl.pathname) && !getLegalConfig().approved) return new Response("Cette page n’est pas encore publiée. Contact : contact.kayart@gmail.com", {
    status: 404,
    headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-store", "X-Robots-Tag": "noindex, nofollow" }
  });
  return refreshRequestSession(request);
}
export const config = { matcher: ["/((?!_next/|favicon.ico|robots.txt|sitemap.xml|manifest.webmanifest|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|woff2?)$).*)"] };
