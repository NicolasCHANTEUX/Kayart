"use client";

import { useMemo, useState, type KeyboardEvent } from "react";
import { ProductImageUploader } from "@/components/admin/product-image-uploader";
import { productAvailabilityLabels } from "@/lib/catalog";
import { formatMoneyCents } from "@/lib/format";
import type { Product } from "@/types/catalog";

type ImperfectProductFormProps = {
  action?: (formData: FormData) => Promise<void>;
  baseProducts: Product[];
  canPersist: boolean;
  errorMessage?: string;
};

const availabilityOptions = ["available", "draft"] as const;

export function ImperfectProductForm({
  action,
  baseProducts,
  canPersist,
  errorMessage
}: ImperfectProductFormProps) {
  const initialProduct = baseProducts[0];
  const [selectedProductId, setSelectedProductId] = useState(initialProduct?.id ?? "");
  const [basePrice, setBasePrice] = useState(getModelPriceValue(initialProduct));
  const [discountPercent, setDiscountPercent] = useState("15");
  const selectedProduct = useMemo(
    () => baseProducts.find((product) => product.id === selectedProductId) ?? null,
    [baseProducts, selectedProductId]
  );
  const preview = getSalePreview(basePrice, discountPercent);
  const canSubmit = canPersist && baseProducts.length > 0;

  function handleModelChange(productId: string) {
    const product = baseProducts.find((candidate) => candidate.id === productId);

    setSelectedProductId(productId);
    setBasePrice(getModelPriceValue(product));
  }

  return (
    <form action={action} className="admin-form imperfect-form">
      {errorMessage ? <p className="form-notice form-notice--error">{errorMessage}</p> : null}

      <fieldset className="form-stage">
        <legend>Modèle</legend>
        <div className="form-grid">
          <label>
            Modèle d'origine
            <select
              disabled={baseProducts.length === 0}
              name="baseProductId"
              onChange={(event) => handleModelChange(event.currentTarget.value)}
              required
              value={selectedProductId}
            >
              {baseProducts.length === 0 ? (
                <option value="">Aucun modèle disponible</option>
              ) : (
                baseProducts.map((product) => (
                  <option key={product.id} value={product.id}>
                    {product.name}
                  </option>
                ))
              )}
            </select>
          </label>
          <label>
            Statut
            <select name="availability" defaultValue="available" required>
              {availabilityOptions.map((availability) => (
                <option key={availability} value={availability}>
                  {productAvailabilityLabels[availability]}
                </option>
              ))}
            </select>
          </label>
        </div>
        {selectedProduct ? (
          <div className="model-preview">
            <div className="model-preview__image">
              {selectedProduct.primaryImageUrl ? (
                <img alt="" src={selectedProduct.primaryImageUrl} />
              ) : (
                <span>Sans image</span>
              )}
            </div>
            <div>
              <strong>{selectedProduct.name}</strong>
              <p>{selectedProduct.shortDescription || selectedProduct.categoryName}</p>
            </div>
          </div>
        ) : null}
      </fieldset>

      <fieldset className="form-stage">
        <legend>Prix</legend>
        <div className="form-grid">
          <label>
            Prix de base TTC en euros
            <input
              inputMode="numeric"
              min="1"
              name="basePrice"
              onChange={(event) => setBasePrice(sanitizeIntegerInput(event.currentTarget.value))}
              onInput={(event) => sanitizeNumericInput(event.currentTarget)}
              onKeyDown={blockInvalidNumericKey}
              placeholder="100"
              required
              step="1"
              type="number"
              value={basePrice}
            />
          </label>
          <label>
            Réduction en %
            <input
              inputMode="numeric"
              max="99"
              min="1"
              name="discountPercent"
              onChange={(event) => setDiscountPercent(sanitizePercentInput(event.currentTarget.value))}
              onInput={(event) => sanitizePercentInputElement(event.currentTarget)}
              onKeyDown={blockInvalidNumericKey}
              placeholder="15"
              required
              step="1"
              type="number"
              value={discountPercent}
            />
          </label>
          <div className="price-preview">
            <span>Prix final TTC</span>
            <strong>{preview ? formatMoneyCents(preview.finalPriceCents) : "À calculer"}</strong>
            <small>
              {preview
                ? `${discountPercent}% de réduction sur ${formatMoneyCents(preview.basePriceCents)}.`
                : "Renseignez un prix de base pour calculer le prix final."}
            </small>
          </div>
        </div>
      </fieldset>

      <fieldset className="form-stage">
        <legend>Défaut constaté</legend>
        <label>
          Description du défaut
          <textarea
            minLength={10}
            name="defectDescription"
            placeholder="Exemple : petite bulle visible dans la résine, sans impact fonctionnel."
            required
            rows={7}
          />
        </label>
      </fieldset>

      <fieldset className="form-stage">
        <legend>Photos des défauts</legend>
        <ProductImageUploader
          emptyHint="Aucune photo de défaut sélectionnée."
          hint="ou cliquer pour ajouter les photos du défaut, 12 Mo maximum chacune"
          title="Glisser les photos du défaut ici"
        />
      </fieldset>

      <div className="form-actions">
        <button className="button button--primary" disabled={!canSubmit} type={canSubmit ? "submit" : "button"}>
          {canPersist ? "Créer le produit imparfait" : "Base non connectée"}
        </button>
      </div>
    </form>
  );
}

function getModelPriceValue(product?: Product) {
  const priceCents = product?.compareAtPriceCents ?? product?.priceCents;
  return priceCents ? String(Math.round(priceCents / 100)) : "";
}

function getSalePreview(basePriceValue: string, discountPercentValue: string) {
  const basePrice = Number(basePriceValue);
  const discountPercent = Number(discountPercentValue);

  if (!Number.isFinite(basePrice) || basePrice <= 0 || !Number.isFinite(discountPercent)) {
    return null;
  }

  return {
    basePriceCents: Math.round(basePrice * 100),
    finalPriceCents: Math.round(basePrice * 100 * ((100 - discountPercent) / 100))
  };
}

function blockInvalidNumericKey(event: KeyboardEvent<HTMLInputElement>) {
  if (event.ctrlKey || event.metaKey || event.altKey) {
    return;
  }

  const allowedControlKeys = [
    "Backspace",
    "Delete",
    "Tab",
    "Escape",
    "Enter",
    "ArrowLeft",
    "ArrowRight",
    "ArrowUp",
    "ArrowDown",
    "Home",
    "End"
  ];

  if (allowedControlKeys.includes(event.key) || /^\d$/.test(event.key)) {
    return;
  }

  event.preventDefault();
}

function sanitizeNumericInput(input: HTMLInputElement) {
  const nextValue = sanitizeIntegerInput(input.value);

  if (input.value !== nextValue) {
    input.value = nextValue;
  }
}

function sanitizePercentInputElement(input: HTMLInputElement) {
  const nextValue = sanitizePercentInput(input.value);

  if (input.value !== nextValue) {
    input.value = nextValue;
  }
}

function sanitizeIntegerInput(value: string) {
  return value.split(/[,.]/)[0]?.replace(/\D/g, "") ?? "";
}

function sanitizePercentInput(value: string) {
  const integerValue = sanitizeIntegerInput(value);

  if (!integerValue) {
    return "";
  }

  return String(Math.min(Number(integerValue), 99));
}
