export const metadata = {
  title: "Panier",
  description: "Panier KayArt."
};

export default function CartPage() {
  return (
    <section className="section section--light">
      <div className="container">
        <div className="eyebrow">Checkout invite</div>
        <h1 className="page-title">Panier</h1>
        <p className="lead">
          Le panier sera developpe apres le catalogue et le schema produit. La V1 gardera l'achat
          invite obligatoire, sans creation de compte imposee.
        </p>
      </div>
    </section>
  );
}
