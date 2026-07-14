import Link from "next/link";
import { productConditionLabels } from "@/lib/catalog";
import { formatPrice } from "@/lib/format";
import type { Product } from "@/types/catalog";

type ProductCardProps = {
  product: Product;
};

export function ProductCard({ product }: ProductCardProps) {
  return (
    <article className="product-card">
      <div className="product-card__visual" aria-hidden="true" />

      <div>
        <div className="meta">
          {product.categoryName} / {productConditionLabels[product.condition]} / {formatPrice(product)}
        </div>
        <h3>{product.name}</h3>
      </div>

      <p>{product.shortDescription}</p>

      <ul className="spec-list" aria-label="Caracteristiques principales">
        {product.attributes.map((attribute) => (
          <li key={`${attribute.label}-${attribute.value}`}>{attribute.value}</li>
        ))}
      </ul>

      <Link className="button button--ghost" href={`/boutique/${product.slug}`}>
        Voir les details
      </Link>
    </article>
  );
}
