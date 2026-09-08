import Stripe from "stripe";
export function getTestStripe() {
  const key = process.env.STRIPE_SECRET_KEY || "";
  if (!/^(sk|rk)_test_/.test(key)) throw new Error("Stripe test configuration required; live keys are refused.");
  return new Stripe(key, { maxNetworkRetries: 2, timeout: 15000 });
}
export function isTestCheckoutEnabled() {
  return process.env.KAYART_CHECKOUT_MODE === "test" && /^(sk|rk)_test_/.test(process.env.STRIPE_SECRET_KEY || "") && Boolean(process.env.STRIPE_WEBHOOK_SECRET) && process.env.KAYART_DATA_SOURCE === "prisma";
}
