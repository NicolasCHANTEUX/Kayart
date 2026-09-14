import { quoteCart } from "@/server/checkout/quote";
import { readBoundedBody } from "@/server/security/bounded-body";
import { enforceRateLimit, getRequestClientKey, requireSameOriginRequest } from "@/server/security/request-guards";
export async function POST(request: Request) {
  try {
    requireSameOriginRequest(request);
    enforceRateLimit({ key: getRequestClientKey(request, "cart-quote"), limit: 90, windowMs: 60000 });
    const input = JSON.parse((await readBoundedBody(request, 8192)).toString("utf8"));
    const quote = await quoteCart(input.items, typeof input.country === "string" ? input.country.toUpperCase().slice(0, 2) : "FR", typeof input.postalCode === "string" ? input.postalCode.slice(0, 20) : "");
    return Response.json(quote, { headers: { "Cache-Control": "no-store" } });
  } catch { return Response.json({ error: "Le panier n’a pas pu être actualisé. Réessayez dans un instant ; aucun paiement n’a été lancé." }, { status: 400 }); }
}
