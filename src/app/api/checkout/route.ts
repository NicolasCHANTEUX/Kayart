import { parseCheckoutInput } from "@/server/checkout/checkout-input";
import { startTestCheckout } from "@/server/checkout/checkout-service";
import { isTestCheckoutEnabled } from "@/server/checkout/stripe";
import { readBoundedBody } from "@/server/security/bounded-body";
import { getRequestClientKey, requireSameOriginRequest } from "@/server/security/request-guards";
import { enforcePersistentRequestLimit } from "@/server/requests/request-rate-limit";
import { getCurrentAuthSession } from "@/server/auth/session";
import { checkoutEmailMatchesAccount } from "@/server/account/account-service";
import { accessTokenCookieName, refreshTokenCookieName } from "@/server/auth/session-cookies";
export const runtime = "nodejs";
export const maxDuration = 60;
export async function POST(request: Request) {
  try { requireSameOriginRequest(request); } catch { return Response.json({ error: "Requête refusée." }, { status: 403 }); }
  if (!isTestCheckoutEnabled()) return Response.json({ error: "Le paiement de test n’est pas encore disponible. Contactez l’atelier." }, { status: 503 });
  try {
    const input = parseCheckoutInput(JSON.parse((await readBoundedBody(request, 16384)).toString("utf8")));
    await enforcePersistentRequestLimit(getRequestClientKey(request, "checkout"), 10, 15 * 60 * 1000);
    const session = await getCurrentAuthSession();
    const hasAuthCookie = (request.headers.get("cookie") ?? "").split(";").some(part => {
      const name = part.trim().split("=", 1)[0];
      return name === accessTokenCookieName || name === refreshTokenCookieName;
    });
    if (hasAuthCookie && !session) {
      return Response.json({ error: "Votre session a expiré. Reconnectez-vous avant de poursuivre." }, { status: 401 });
    }
    if (!checkoutEmailMatchesAccount(input.email, session?.user ?? null)) {
      return Response.json({ error: "Utilisez l’adresse email de votre compte pour cette commande." }, { status: 400 });
    }
    return Response.json(await startTestCheckout(input, session?.user ?? null), { headers: { "Cache-Control": "no-store" } });
  } catch { return Response.json({ error: "Le paiement n’a pas pu être ouvert. Vérifiez les articles, le stock, vos coordonnées et le mode de réception, puis réessayez la même tentative." }, { status: 400 }); }
}
