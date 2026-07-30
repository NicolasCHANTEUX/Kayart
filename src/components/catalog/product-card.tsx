import Link from "next/link";
import { ProductPrice } from "@/components/catalog/product-price";
import { productConditionLabels } from "@/lib/catalog";
import type { Product } from "@/types/catalog";

type ProductCardProps = {
  product: Product;
};

export function ProductCard({ product }: ProductCardProps) {
  const imageUrl =
    product.condition === "imperfect"
      ? product.baseProduct?.primaryImageUrl ?? product.primaryImageUrl
      : product.primaryImageUrl;

  return (
    <article className={`product-card product-card--${product.condition}`}>
      <div className="product-card__visual">
        {imageUrl ? <img alt={product.name} src={imageUrl} /> : null}
      </div>

      <div>
        <div className="meta">
          {product.categoryName} / {productConditionLabels[product.condition]}
        </div>
        <h3>{product.name}</h3>
      </div>

      <ProductPrice compact product={product} />

      <p>{product.shortDescription}</p>

      <ul className="spec-list" aria-label="Caractéristiques principales">
        {product.attributes.map((attribute) => (
          <li key={`${attribute.label}-${attribute.value}`}>{attribute.value}</li>
        ))}
      </ul>

      <Link className="button button--ghost" href={`/boutique/${product.slug}`}>
        Voir les détails
      </Link>
    </article>
  );
}
