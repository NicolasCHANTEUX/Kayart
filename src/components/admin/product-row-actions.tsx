"use client";

import Link from "next/link";
import { useEffect, useRef, useState, type CSSProperties } from "react";
import { createPortal } from "react-dom";
import {
  deleteProductAction,
  hideProductAction,
  showProductAction,
  updateProductStockAction
} from "@/app/admin/produits/actions";
import type { Product } from "@/types/catalog";

type ProductRowActionsProps = {
  canPersist: boolean;
  product: Product;
};

export function ProductRowActions({ canPersist, product }: ProductRowActionsProps) {
  const actionsRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [menuStyle, setMenuStyle] = useState<CSSProperties>({});
  const [isStockOpen, setIsStockOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [stockQuantity, setStockQuantity] = useState(String(product.stockQuantity ?? 0));
  const canEditStock = canPersist && product.condition !== "service";
  const canShowProduct = product.availability === "draft" || product.availability === "unavailable";
  const maxStockQuantity = product.condition === "imperfect" ? 1 : Number.POSITIVE_INFINITY;
  const canUsePortal = typeof document !== "undefined";

  useEffect(() => {
    if (!isMenuOpen) {
      return;
    }

    function handlePointerDown(event: PointerEvent) {
      const target = event.target as Node;

      if (actionsRef.current?.contains(target) || menuRef.current?.contains(target)) {
        return;
      }

      setIsMenuOpen(false);
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsMenuOpen(false);
      }
    }

    function closeMenu() {
      setIsMenuOpen(false);
    }

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    window.addEventListener("resize", closeMenu);
    window.addEventListener("scroll", closeMenu, true);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("resize", closeMenu);
      window.removeEventListener("scroll", closeMenu, true);
    };
  }, [isMenuOpen]);

  function adjustStock(delta: number) {
    setStockQuantity((value) =>
      String(Math.min(Math.max(Number(value || 0) + delta, 0), maxStockQuantity))
    );
  }

  function toggleMenu() {
    if (isMenuOpen) {
      setIsMenuOpen(false);
      return;
    }

    const triggerRect = triggerRef.current?.getBoundingClientRect();
    const menuWidth = 176;
    const menuHeight = 218;
    const viewportPadding = 12;

    if (triggerRect) {
      const left = Math.min(
        Math.max(triggerRect.right - menuWidth, viewportPadding),
        window.innerWidth - menuWidth - viewportPadding
      );
      const availableBelow = window.innerHeight - triggerRect.bottom - viewportPadding;
      const top =
        availableBelow >= menuHeight
          ? triggerRect.bottom + 8
          : Math.max(viewportPadding, triggerRect.top - menuHeight - 8);

      setMenuStyle({
        left,
        top,
        width: menuWidth
      });
    }

    setIsMenuOpen(true);
  }

  const menu =
    isMenuOpen && canUsePortal
      ? createPortal(
          <div className="row-actions__menu" ref={menuRef} style={menuStyle}>
            <Link
              className="row-actions__item"
              href={`/admin/produits/${product.id}/modifier`}
              onClick={() => setIsMenuOpen(false)}
            >
              Modifier
            </Link>
            <button
              className="row-actions__item"
              disabled={!canEditStock}
              onClick={() => {
                setIsMenuOpen(false);
                setIsStockOpen(true);
              }}
              type="button"
            >
              Stock
            </button>
            {canShowProduct ? (
              <form action={canPersist ? showProductAction : undefined} onSubmit={() => setIsMenuOpen(false)}>
                <input name="id" type="hidden" value={product.id} />
                <button
                  className="row-actions__item"
                  disabled={!canPersist}
                  type={canPersist ? "submit" : "button"}
                >
                  Afficher
                </button>
              </form>
            ) : product.availability === "archived" ? (
              <span className="row-actions__item row-actions__item--disabled">Déjà archivé</span>
            ) : (
              <form action={canPersist ? hideProductAction : undefined} onSubmit={() => setIsMenuOpen(false)}>
                <input name="id" type="hidden" value={product.id} />
                <button
                  className="row-actions__item"
                  disabled={!canPersist}
                  type={canPersist ? "submit" : "button"}
                >
                  Masquer
                </button>
              </form>
            )}
            <button
              className="row-actions__item row-actions__item--danger"
              disabled={!canPersist}
              onClick={() => {
                setIsMenuOpen(false);
                setIsDeleteOpen(true);
              }}
              type="button"
            >
              Supprimer
            </button>
          </div>,
          document.body
        )
      : null;

  const stockModal =
    isStockOpen && canUsePortal
      ? createPortal(
          <div className="modal-backdrop" role="presentation">
            <div aria-modal="true" className="admin-modal" role="dialog">
              <div>
                <span className="modal-eyebrow">Stock</span>
                <h2>{product.name}</h2>
              </div>
              <form action={updateProductStockAction} className="modal-form">
                <input name="id" type="hidden" value={product.id} />
                <label>
                  Quantité
                  <div className="stock-adjuster">
                    <button onClick={() => adjustStock(-1)} type="button">
                      -1
                    </button>
                    <input
                      max={Number.isFinite(maxStockQuantity) ? maxStockQuantity : undefined}
                      min="0"
                      name="stockQuantity"
                      onChange={(event) => {
                        const nextValue = Number(event.currentTarget.value.replace(/\D/g, "") || 0);
                        setStockQuantity(String(Math.min(nextValue, maxStockQuantity)));
                      }}
                      step="1"
                      type="number"
                      value={stockQuantity}
                    />
                    <button onClick={() => adjustStock(1)} type="button">
                      +1
                    </button>
                  </div>
                </label>
                <div className="modal-actions">
                  <button className="button button--ghost" onClick={() => setIsStockOpen(false)} type="button">
                    Annuler
                  </button>
                  <button className="button button--primary" type="submit">
                    Enregistrer
                  </button>
                </div>
              </form>
            </div>
          </div>,
          document.body
        )
      : null;

  const deleteModal =
    isDeleteOpen && canUsePortal
      ? createPortal(
          <div className="modal-backdrop" role="presentation">
            <div aria-modal="true" className="admin-modal admin-modal--danger" role="dialog">
              <div>
                <span className="modal-eyebrow">Suppression définitive</span>
                <h2>{product.name}</h2>
                <p>Ce produit sera supprimé de la base de données. Cette action ne peut pas être annulée.</p>
              </div>
              <form action={deleteProductAction} className="modal-form">
                <input name="id" type="hidden" value={product.id} />
                <div className="modal-actions">
                  <button className="button button--ghost" onClick={() => setIsDeleteOpen(false)} type="button">
                    Annuler
                  </button>
                  <button className="button button--primary" type="submit">
                    Supprimer
                  </button>
                </div>
              </form>
            </div>
          </div>,
          document.body
        )
      : null;

  return (
    <>
      <div className={isMenuOpen ? "row-actions row-actions--open" : "row-actions"} ref={actionsRef}>
        <button
          aria-expanded={isMenuOpen}
          aria-label={`Actions pour ${product.name}`}
          className="row-actions__trigger"
          onClick={toggleMenu}
          ref={triggerRef}
          type="button"
        >
          ...
        </button>
      </div>
      {menu}
      {stockModal}
      {deleteModal}
    </>
  );
}
