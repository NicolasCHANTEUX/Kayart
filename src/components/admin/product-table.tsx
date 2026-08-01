"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ProductPrice } from "@/components/catalog/product-price";
import { productAvailabilityLabels, productConditionLabels } from "@/lib/catalog";
import { formatStock } from "@/lib/format";
import type { Product } from "@/types/catalog";
import { ProductRowActions } from "./product-row-actions";

const PAGE_SIZE = 10;
const LOAD_MORE_DELAY_MS = 180;

type ProductTableProps = {
  canPersist: boolean;
  products: Product[];
};

export function ProductTable({ canPersist, products }: ProductTableProps) {
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const timeoutRef = useRef<number | null>(null);
  const productsKey = useMemo(() => products.map((product) => product.id).join("|"), [products]);
  const visibleProducts = products.slice(0, visibleCount);
  const visibleTotal = Math.min(visibleCount, products.length);
  const hasMoreProducts = visibleTotal < products.length;

  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
    setIsLoadingMore(false);

    if (timeoutRef.current) {
      window.clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, [productsKey]);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        window.clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  function handleLoadMore() {
    setIsLoadingMore(true);

    timeoutRef.current = window.setTimeout(() => {
      setVisibleCount((currentCount) => Math.min(currentCount + PAGE_SIZE, products.length));
      setIsLoadingMore(false);
      timeoutRef.current = null;
    }, LOAD_MORE_DELAY_MS);
  }

  return (
    <>
      <div className="table-wrap">
        <table className="data-table">
          <thead>
            <tr>
              <th>Produit</th>
              <th>Catégorie</th>
              <th>Type</th>
              <th>Statut</th>
              <th>Prix</th>
              <th>Stock</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {visibleProducts.map((product) => {
              const isHidden = product.availability === "unavailable" || product.availability === "archived";

              return (
                <tr
                  className={isHidden ? "data-table__row--muted data-table__row--paged" : "data-table__row--paged"}
                  key={product.id}
                >
                  <td data-label="Produit">
                    <div className="admin-product-cell">
                      <div className="admin-product-thumb">
                        {product.primaryImageUrl ? <img alt="" src={product.primaryImageUrl} /> : <span>Sans image</span>}
                      </div>
                      <div>
                        <strong>{product.name}</strong>
                        <span>{product.sku}</span>
                      </div>
                    </div>
                  </td>
                  <td data-label="Catégorie">{product.categoryName}</td>
                  <td data-label="Type">
                    <span className={`table-badge table-badge--condition-${product.condition}`}>
                      {productConditionLabels[product.condition]}
                    </span>
                  </td>
                  <td data-label="Statut">
                    <span className={`table-badge table-badge--availability-${product.availability}`}>
                      {productAvailabilityLabels[product.availability]}
                    </span>
                  </td>
                  <td data-label="Prix">
                    <ProductPrice compact product={product} />
                  </td>
                  <td data-label="Stock">
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

      {products.length > PAGE_SIZE ? (
        <div className="product-pagination" aria-live="polite">
          <span>
            {visibleTotal} sur {products.length} produits affichés
          </span>
          {hasMoreProducts ? (
            <button className="button button--ghost product-pagination__button" disabled={isLoadingMore} onClick={handleLoadMore} type="button">
              {isLoadingMore ? (
                <>
                  <span className="loading-spinner" aria-hidden="true" />
                  Chargement...
                </>
              ) : (
                "Afficher 10 de plus"
              )}
            </button>
          ) : null}
        </div>
      ) : null}
    </>
  );
}

function getStockTone(product: Product) {
  const filter = getStockFilter(product);

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

function getStockFilter(product: Product) {
  if (product.condition === "service") {
    return "service";
  }

  if (product.availability === "made-to-order" || product.stockQuantity === null) {
    return "made-to-order";
  }

  if (product.stockQuantity === 0) {
    return "out";
  }

  if (product.stockQuantity <= 5) {
    return "low";
  }

  return "available";
}
