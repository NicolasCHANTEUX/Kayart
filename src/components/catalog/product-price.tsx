import { formatMoneyCents, formatPrice, getDiscountPercent } from "@/lib/format";
import type { Product } from "@/types/catalog";

type ProductPriceProps = {
  compact?: boolean;
  product: Product;
};

export function ProductPrice({ compact = false, product }: ProductPriceProps) {
  const discountPercent = getDiscountPercent(product);

  if (product.priceCents === null || !discountPercent || !product.compareAtPriceCents) {
    return (
      <div className={compact ? "catalog-price catalog-price--compact" : "catalog-price"}>
        <span className="catalog-price__main">{formatPrice(product)}</span>
      </div>
    );
  }

  return (
    <div className={compact ? "catalog-price catalog-price--compact" : "catalog-price"}>
      <span className="catalog-price__main">{formatMoneyCents(product.priceCents, product.currency)}</span>
      <s>{formatMoneyCents(product.compareAtPriceCents, product.currency)}</s>
      <span className="discount-badge">-{discountPercent}%</span>
    </div>
  );
}
