import Link from "next/link";
import { ProductPrice } from "@/components/catalog/product-price";
import { productConditionLabels } from "@/lib/catalog";
import type { Product } from "@/types/catalog";
import { ProductImageView } from "./product-image";
export function ProductCard({ product }: { product: Product }) {
  const imageUrl = product.primaryImageUrl ?? product.baseProduct?.primaryImageUrl;
  const availability = product.condition === "service" ? "Service atelier" : product.availability === "reserved" ? "Réservé" : product.availability === "made-to-order" || product.priceCents === null ? "Sur commande" : (product.stockQuantity ?? 0) > 0 ? "En stock" : "Sur demande";
  return <article className={`product-card product-card--${product.condition}`}>
    <Link className="product-card__visual" href={`/boutique/${product.slug}`} tabIndex={-1} aria-hidden="true">
      <ProductImageView alt="" src={imageUrl}/><span className="product-card__badge">{productConditionLabels[product.condition]}</span><span className="product-card__arrow">↗</span>
    </Link>
    <div className="product-card__body"><div className="product-card__meta"><span>{product.categoryName}</span><span className="product-card__availability">{availability}</span></div>
      <h3><Link href={`/boutique/${product.slug}`}>{product.name}</Link></h3>
      <p>{product.shortDescription}</p>
      <div className="product-card__bottom"><ProductPrice compact product={product}/><Link className="text-link" href={`/boutique/${product.slug}`} aria-label={`Découvrir ${product.name}`}>Découvrir ↗</Link></div>
    </div>
  </article>;
}
