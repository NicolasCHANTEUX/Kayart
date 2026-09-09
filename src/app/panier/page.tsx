import Link from "next/link";
import { CartPage as Cart } from "@/components/cart/cart-page";
export const metadata = {
  robots: { index: false, follow: false },
  title: "Panier",
  description: "Panier KayArt."
};

export default async function CartPage({ searchParams }: { searchParams?: Promise<{ checkout?: string }> }) {
  const params = searchParams ? await searchParams : {};
  const pendingCheckout = typeof params.checkout === "string" && /^[0-9a-f-]{36}$/i.test(params.checkout) ? params.checkout : undefined;
  return (
    <section className="section section--light">
      <div className="container">
        <div className="eyebrow">Commandes</div>
        <h1 className="page-title">Votre panier</h1>
        <p className="lead">
          Retrait gratuit à l’atelier sur rendez-vous. La livraison est proposée uniquement lorsque
          le produit est expédiable et qu’un tarif est disponible pour votre destination.
        </p>
        <Cart pendingCheckout={pendingCheckout} />
        <Link className="button button--ghost" href="/contact">Une demande réelle ? Contacter l’atelier</Link>
      </div>
    </section>
  );
}
