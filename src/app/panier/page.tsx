import { CartPage as Cart } from "@/components/cart/cart-page";
export const metadata = {
  robots: { index: false, follow: false },
  title: "Panier",
  description: "Vos pièces KayArt, quantités et estimation de réception."
};

export default async function CartPage({ searchParams }: { searchParams?: Promise<{ checkout?: string }> }) {
  const params = searchParams ? await searchParams : {};
  const pendingCheckout = typeof params.checkout === "string" && /^[0-9a-f-]{36}$/i.test(params.checkout) ? params.checkout : undefined;
  return <section className="section section--light"><div className="container">
    <div className="eyebrow">Votre sélection</div>
    <h1 className="page-title">Votre panier</h1>
    <p className="lead">Retrouvez vos pièces, ajustez les quantités et estimez la réception. Le retrait à l’atelier est gratuit, sur rendez-vous.</p>
    <Cart pendingCheckout={pendingCheckout} />
  </div></section>;
}
