import Link from "next/link";
import { ProductPrice } from "@/components/catalog/product-price";
import { productAvailabilityLabels, productConditionLabels } from "@/lib/catalog";
import { formatStock } from "@/lib/format";
import type { Product } from "@/types/catalog";
import { ProductRowActions } from "./product-row-actions";

import { stockCategory } from "@/lib/product-stock";
import { ProductImageView } from "@/components/catalog/product-image";

type ProductTableProps = {
  canPersist: boolean;
  products: Product[];
};

export function ProductTable({ canPersist, products }: ProductTableProps) {
  return (
    <>
      <div className="table-wrap">
        <table className="data-table admin-products-table">
          <thead>
            <tr>
              <th scope="col">Produit</th>
              <th scope="col">Catégorie</th>
              <th scope="col">Type</th>
              <th scope="col">Statut</th>
              <th scope="col">Prix</th>
              <th scope="col">Stock</th>
              <th scope="col">Actions</th>
            </tr>
          </thead>
          <tbody>
            {products.map((product) => {
              const isHidden = !product.publishedAt || product.availability === "unavailable" || product.availability === "archived";

              return (
                <tr
                  className={isHidden ? "data-table__row--muted data-table__row--paged" : "data-table__row--paged"}
                  key={product.id}
                >
                  <td className="admin-product-heading" data-label="Produit">
                    <div className="admin-product-cell">
                      <div className="admin-product-thumb">
                        <ProductImageView thumbnail alt="" src={product.primaryImageUrl} />
                      </div>
                      <Link className="admin-product-identity" href={`/admin/produits/${product.id}/modifier`}>
                        <strong>{product.name}</strong>
                        <span>{product.sku}</span>
                      </Link>
                    </div>
                  </td>
                  <td className="admin-product-category" data-label="Catégorie">{product.categoryName}</td>
                  <td className="admin-product-condition" data-label="Type">
                    <span className={`table-badge table-badge--condition-${product.condition}`}>
                      {productConditionLabels[product.condition]}
                    </span>
                  </td>
                  <td className="admin-product-status" data-label="Statut">
                    <span className={`table-badge table-badge--availability-${product.availability}`}>
                      {productAvailabilityLabels[product.availability]}
                    </span>
                  </td>
                  <td className="admin-product-price" data-label="Prix">
                    <ProductPrice compact product={product} />
                  </td>
                  <td className="admin-product-stock" data-label="Stock">
                    <span className={`stock-badge stock-badge--${getStockTone(product)}`}>
                      {formatStock(product)}
                    </span>
                  </td>
                  <td className="actions-cell" data-label="Actions">
                    <ProductRowActions canPersist={canPersist} product={product} />
                  </td>
                </tr>
              );
            })}
            {products.length === 0 ? (
              <tr>
                <td colSpan={7}>Aucun produit ne correspond aux filtres.</td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>


    </>
  );
}

function getStockTone(product: Product) {
  const filter = stockCategory(product);

  if (filter === "out") {
    return "out";
  }

  if (filter === "low") {
    return "low";
  }

  if (filter === "available") {
    return "available";
  }

  return "neutral";
}
