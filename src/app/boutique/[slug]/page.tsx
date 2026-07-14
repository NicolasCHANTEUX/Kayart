import Link from "next/link";
import { notFound } from "next/navigation";
import { formatPrice } from "@/lib/format";
import { findProductBySlug, listStaticProductParams } from "@/server/catalog/catalog.service";

type ProductPageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateStaticParams() {
  return listStaticProductParams();
}

export async function generateMetadata({ params }: ProductPageProps) {
  const { slug } = await params;
  const product = await findProductBySlug(slug);

  if (!product) {
    return {};
  }

  return {
    title: product.name,
    description: product.description
  };
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { slug } = await params;
  const product = await findProductBySlug(slug);

  if (!product) {
    notFound();
  }

  return (
    <section className="section">
      <div className="container split">
        <div className="product-card__visual" aria-hidden="true" />
        <div>
          <div className="eyebrow">{product.categoryName} / {formatPrice(product)}</div>
          <h1 className="page-title">{product.name}</h1>
          <p className="lead">{product.description}</p>
          <ul className="spec-list" aria-label="Caracteristiques">
            {product.attributes.map((attribute) => (
              <li key={`${attribute.label}-${attribute.value}`}>
                {attribute.label}: {attribute.value}
                {attribute.unit ? ` ${attribute.unit}` : ""}
              </li>
            ))}
          </ul>
          <div className="actions-row">
            <Link className="button button--primary" href="/panier">
              Ajouter au panier
            </Link>
            <Link className="button button--ghost" href="/contact">
              Poser une question
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
