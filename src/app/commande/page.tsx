import { CheckoutPage } from "@/components/cart/checkout-page";

export const metadata = {
  title: "Votre commande",
  description: "Réception et récapitulatif de votre commande KayArt.",
  robots: { index: false, follow: false }
};

export default function OrderPage() {
  return <section className="section section--light"><div className="container">
    <div className="eyebrow">Panier / Commande</div>
    <h1 className="page-title">Préparer votre commande</h1>
    <CheckoutPage />
  </div></section>;
}
