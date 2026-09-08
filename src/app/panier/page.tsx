import Link from "next/link";
export const metadata = {
  title: "Panier",
  description: "Panier KayArt."
};

export default function CartPage() {
  return (
    <section className="section section--light">
      <div className="container">
        <div className="eyebrow">Commandes</div>
        <h1 className="page-title">Commander auprès de l’atelier</h1>
        <p className="lead">
          Le paiement en ligne n’est pas encore disponible. Contactez l’atelier pour confirmer
          votre commande, sa disponibilité et les modalités de livraison.
        </p>
        <Link className="button button--primary" href="/contact">Contacter l’atelier</Link>
      </div>
    </section>
  );
}
