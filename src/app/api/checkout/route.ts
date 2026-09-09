import { parseCheckoutInput } from "@/server/checkout/checkout-input";
import { startTestCheckout } from "@/server/checkout/checkout-service";
import { isTestCheckoutEnabled } from "@/server/checkout/stripe";
import { readBoundedBody } from "@/server/security/bounded-body";
import { getRequestClientKey, requireSameOriginRequest } from "@/server/security/request-guards";
import { enforcePersistentRequestLimit } from "@/server/requests/request-rate-limit";
export const runtime = "nodejs";
export const maxDuration = 60;
export async function POST(request: Request) {
  try { requireSameOriginRequest(request); } catch { return Response.json({ error: "Requête refusée." }, { status: 403 }); }
  if (!isTestCheckoutEnabled()) return Response.json({ error: "Le paiement de test n’est pas encore disponible. Contactez l’atelier." }, { status: 503 });
  try {
    const input = parseCheckoutInput(JSON.parse((await readBoundedBody(request, 16384)).toString("utf8")));
    await enforcePersistentRequestLimit(getRequestClientKey(request, "checkout"), 10, 15 * 60 * 1000);
    return Response.json(await startTestCheckout(input), { headers: { "Cache-Control": "no-store" } });
  } catch { return Response.json({ error: "Le paiement n’a pas pu être ouvert. Vérifiez les articles, le stock, vos coordonnées et le mode de réception, puis réessayez la même tentative." }, { status: 400 }); }
}
