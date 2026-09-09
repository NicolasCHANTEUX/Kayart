import { reconcileCheckout } from "@/server/checkout/reconciliation";
import { readBoundedBody } from "@/server/security/bounded-body";
import { enforceRateLimit, getRequestClientKey, requireSameOriginRequest } from "@/server/security/request-guards";
export async function POST(request: Request) {
  try {
    requireSameOriginRequest(request);
    enforceRateLimit({ key: getRequestClientKey(request, "checkout-cancel"), limit: 20, windowMs: 60000 });
    const input = JSON.parse((await readBoundedBody(request, 512)).toString("utf8"));
    if (typeof input.checkoutKey !== "string" || !/^[0-9a-f-]{36}$/i.test(input.checkoutKey)) throw new Error("Invalid key");
    return Response.json(await reconcileCheckout(input.checkoutKey, true));
  } catch { return Response.json({ error: "Annulation non confirmée. Réessayez dans quelques instants ou contactez l’atelier." }, { status: 400 }); }
}
