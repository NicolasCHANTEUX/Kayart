"use client";

import { useMemo, useState } from "react";
import { useFormStatus } from "react-dom";
import { createAdminOrderAction } from "@/app/admin/commandes/actions";
import { formatMoneyCents, formatStock } from "@/lib/format";
import type { Product } from "@/types/catalog";

type AdminOrderCreatorProps = {
  canPersist: boolean;
  products: Product[];
};

type OrderRow = {
  id: string;
  productId: string;
  quantity: number;
};

export function AdminOrderCreator({ canPersist, products }: AdminOrderCreatorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [nextRowIndex, setNextRowIndex] = useState(2);
  const [rows, setRows] = useState<OrderRow[]>([{ id: "row-1", productId: "", quantity: 1 }]);
  const productsById = useMemo(() => new Map(products.map((product) => [product.id, product])), [products]);
  const selectedItems = rows
    .map((row) => ({
      product: productsById.get(row.productId),
      quantity: row.quantity
    }))
    .filter((item): item is { product: Product; quantity: number } => Boolean(item.product));
  const subtotalCents = selectedItems.reduce(
    (total, item) => total + (item.product.priceCents ?? 0) * item.quantity,
    0
  );
  const canSubmit = canPersist && selectedItems.length > 0;

  function addRow() {
    setRows((currentRows) => [
      ...currentRows,
      {
        id: `row-${nextRowIndex}`,
        productId: "",
        quantity: 1
      }
    ]);
    setNextRowIndex((currentIndex) => currentIndex + 1);
  }

  function removeRow(rowId: string) {
    setRows((currentRows) => {
      if (currentRows.length === 1) {
        return [{ ...currentRows[0], productId: "", quantity: 1 }];
      }

      return currentRows.filter((row) => row.id !== rowId);
    });
  }

  function updateRowProduct(rowId: string, productId: string) {
    setRows((currentRows) =>
      currentRows.map((row) =>
        row.id === rowId
          ? {
              ...row,
              productId
            }
          : row
      )
    );
  }

  function updateRowQuantity(rowId: string, quantity: number) {
    setRows((currentRows) =>
      currentRows.map((row) =>
        row.id === rowId
          ? {
              ...row,
              quantity: Math.max(1, quantity)
            }
          : row
      )
    );
  }

  return (
    <>
      <button
        className="button button--primary"
        disabled={!canPersist || products.length === 0}
        onClick={() => setIsOpen(true)}
        type="button"
      >
        Créer une commande
      </button>

      {isOpen ? (
        <div className="modal-backdrop" role="presentation">
          <div aria-modal="true" className="admin-modal admin-modal--wide order-modal" role="dialog">
            <div className="modal-header-row">
              <div>
                <span className="modal-eyebrow">Commande factice</span>
                <h2>Créer une commande</h2>
                <p>Créez une commande de test sans modifier le stock des produits.</p>
              </div>
              <button className="modal-close-button" onClick={() => setIsOpen(false)} type="button">
                {"\u00d7"}
                <span>Fermer</span>
              </button>
            </div>

            <form action={canPersist ? createAdminOrderAction : undefined} className="modal-form order-form">
              <div className="order-form-grid">
                <label>
                  Email client
                  <input
                    defaultValue="commande-factice@kayart.local"
                    name="guestEmail"
                    placeholder="client@example.com"
                    type="email"
                  />
                </label>
                <label>
                  Note interne
                  <input name="customerNote" placeholder="Essai admin, démonstration, brouillon..." type="text" />
                </label>
              </div>

              <div className="order-lines" aria-label="Produits de la commande">
                {rows.map((row) => {
                  const product = productsById.get(row.productId);
                  const selectedInOtherRows = new Set(
                    rows.filter((otherRow) => otherRow.id !== row.id).map((otherRow) => otherRow.productId)
                  );

                  return (
                    <div className="order-line" key={row.id}>
                      <label>
                        Produit
                        <select
                          name="productId"
                          onChange={(event) => updateRowProduct(row.id, event.currentTarget.value)}
                          value={row.productId}
                        >
                          <option value="">Choisir un produit</option>
                          {products.map((option) => (
                            <option
                              disabled={selectedInOtherRows.has(option.id) && option.id !== row.productId}
                              key={option.id}
                              value={option.id}
                            >
                              {option.name} - {option.sku || "sans SKU"} - {formatStock(option)}
                            </option>
                          ))}
                        </select>
                      </label>
                      <label>
                        Quantité
                        <input
                          min="1"
                          name="quantity"
                          onChange={(event) =>
                            updateRowQuantity(row.id, Number(event.currentTarget.value.replace(/\D/g, "") || 1))
                          }
                          step="1"
                          type="number"
                          value={row.quantity}
                        />
                      </label>
                      <button
                        aria-label="Retirer cette ligne"
                        className="button button--ghost order-line__remove"
                        onClick={() => removeRow(row.id)}
                        type="button"
                      >
                        ×
                      </button>
                      {product ? (
                        <div className="order-line__meta">
                          <span>
                            Prix unitaire :{" "}
                            {product.priceCents === null ? "à définir" : formatMoneyCents(product.priceCents)}
                          </span>
                        </div>
                      ) : null}
                    </div>
                  );
                })}
              </div>

              <button className="button button--ghost order-add-line" onClick={addRow} type="button">
                Ajouter un produit
              </button>

              <div className="order-total">
                <span>Total commande</span>
                <strong>{formatMoneyCents(subtotalCents)}</strong>
              </div>

              <div className="modal-actions">
                <button className="button button--ghost" onClick={() => setIsOpen(false)} type="button">
                  Annuler
                </button>
                <CreateOrderButton disabled={!canSubmit} />
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </>
  );
}

function CreateOrderButton({ disabled }: { disabled: boolean }) {
  const { pending } = useFormStatus();

  return (
    <button className="button button--primary" disabled={disabled || pending} type="submit">
      {pending ? (
        <>
          <span className="loading-spinner" aria-hidden="true" />
          Enregistrement...
        </>
      ) : (
        "Créer la commande"
      )}
    </button>
  );
}
