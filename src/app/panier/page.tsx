export const metadata = {
  title: "Panier",
  description: "Panier KayArt."
};

export default function CartPage() {
  return (
    <section className="section section--light">
      <div className="container">
        <div className="eyebrow">Checkout invité</div>
        <h1 className="page-title">Panier</h1>
        <p className="lead">
          Le panier sera développé après le catalogue et le schéma produit. La V1 gardera l'achat
          invité obligatoire, sans création de compte imposée.
        </p>
      </div>
    </section>
  );
}
