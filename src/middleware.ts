import { getLegalConfig } from "@/config/legal";

// Reject before React streaming starts, so unpublished legal pages really return 404.
export function middleware() {
  if (!getLegalConfig().approved) return new Response("Cette page n’est pas encore publiée. Contact : contact.kayart@gmail.com", {
    status: 404,
    headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-store", "X-Robots-Tag": "noindex, nofollow" }
  });
}
export const config = { matcher: ["/mentions-legales", "/cgv", "/confidentialite"] };
