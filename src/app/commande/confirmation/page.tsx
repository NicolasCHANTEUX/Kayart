import Link from "next/link";
import { getPrismaClient } from "@/server/db/prisma";
import { ClearPaidCart } from "@/components/cart/clear-paid-cart";
export const dynamic = "force-dynamic";
export const metadata = { title: "Paiement de test", robots: { index: false, follow: false } };
export default async function ConfirmationPage({ searchParams }: { searchParams?: Promise<{ session_id?: string }> }) {
  const params = searchParams ? await searchParams : {};
  const sessionId = params.session_id ?? "";
  const order = /^cs_test_[a-zA-Z0-9_]{10,200}$/.test(sessionId) && process.env.KAYART_DATA_SOURCE === "prisma" ? await getPrismaClient().order.findUnique({ where: { stripeCheckoutSessionId: sessionId }, select: { paymentStatus: true, isTest: true, checkoutKey: true, items: { select: { productId: true, quantity: true } } } }) : null;
  // The return URL never marks an order paid; only verified Stripe processing does.
  return <section className="section"><div className="container"><h1 className="page-title">Paiement de test</h1><p className="lead">{order?.isTest && order.paymentStatus === "paid" ? "Le paiement de test a été confirmé. Il ne s’agit pas d’une commande réelle." : "La confirmation du paiement de test est en attente. Si vous venez de terminer sur Stripe, actualisez cette page dans quelques instants."}</p>{order?.isTest && order.paymentStatus === "paid" && order.checkoutKey ? <ClearPaidCart checkoutKey={order.checkoutKey} purchased={order.items.flatMap(item => item.productId ? [{ productId: item.productId, quantity: item.quantity }] : [])} /> : null}<Link className="button button--ghost" href="/boutique">Retour à la boutique</Link></div></section>;
}
