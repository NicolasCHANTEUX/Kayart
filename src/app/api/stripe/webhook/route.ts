import type Stripe from "stripe";
import { getTestStripe } from "@/server/checkout/stripe";
import { settleVerifiedSession } from "@/server/checkout/settlement";
import { readBoundedBody } from "@/server/security/bounded-body";
export const runtime = "nodejs";
export const maxDuration = 60;
export async function POST(request: Request) {
  const signature = request.headers.get("stripe-signature"), secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!signature || !secret) return new Response("Webhook not configured or signature missing.", { status: 400 });
  let event: Stripe.Event;
  try { event = getTestStripe().webhooks.constructEvent(await readBoundedBody(request, 1024 * 1024), signature, secret); }
  catch { return new Response("Invalid signature or payload.", { status: 400 }); }
  if (event.livemode) return new Response("Live payments are disabled.", { status: 400 });
  try {
    if (event.type === "checkout.session.completed" || event.type === "checkout.session.async_payment_succeeded") await settleVerifiedSession(event.data.object, event.id, "paid");
    else if (event.type === "checkout.session.expired") await settleVerifiedSession(event.data.object, event.id, "expired");
    else if (event.type === "checkout.session.async_payment_failed") await settleVerifiedSession(event.data.object, event.id, "failed");
    return Response.json({ received: true });
  } catch { return new Response("Processing failed; retry required.", { status: 500 }); }
}
