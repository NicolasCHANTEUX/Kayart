"use client";

import { ProductImageView } from "@/components/catalog/product-image";
import { useActionState, useEffect, useMemo, useRef, useState, type FormEvent, type KeyboardEvent } from "react";
import { useFormStatus } from "react-dom";
import { ProductImageUploader } from "@/components/admin/product-image-uploader";
import { productAvailabilityLabels } from "@/lib/catalog";
import { formatMoneyCents } from "@/lib/format";
import { formatEuroInput, sanitizeMoneyInput } from "@/lib/money";
import {
  initialProductFormActionState,
  type ProductFormActionState
} from "@/server/catalog/product-form-draft";
import type { Product } from "@/types/catalog";

type ImperfectProductFormProps = {
  action?: (
    previousState: ProductFormActionState,
    formData: FormData
  ) => Promise<ProductFormActionState>;
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
  const formRef = useRef<HTMLFormElement>(null);
  const [actionState, formAction] = useActionState(
    action ?? unavailableProductAction,
    initialProductFormActionState
  );
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
  const isSubmittingRef = useRef(false);

  useEffect(() => {
    if (actionState.status !== "error") {
      return;
    }

    isSubmittingRef.current = false;
    const firstInvalidField = Object.keys(actionState.errors ?? {})[0];
    const control = firstInvalidField
      ? formRef.current?.elements.namedItem(firstInvalidField)
      : null;

    if (control instanceof HTMLElement) {
      control.focus();
      control.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [actionState]);

  function handleModelChange(productId: string) {
    const product = baseProducts.find((candidate) => candidate.id === productId);

    setSelectedProductId(productId);
    setBasePrice(getModelPriceValue(product));
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    if (isSubmittingRef.current) {
      event.preventDefault();
      return;
    }

    isSubmittingRef.current = true;
  }

  return (
    <form
      action={action ? formAction : undefined}
      className="admin-form imperfect-form"
      onSubmit={handleSubmit}
      ref={formRef}
    >
      {actionState.status === "error" ? (
        <div className="form-notice form-notice--error" role="alert">
          <p>{actionState.message}</p>
          {Object.keys(actionState.errors ?? {}).length > 1 ? (
            <ul>
              {Object.entries(actionState.errors ?? {}).map(([field, message]) => (
                <li key={field}>{message}</li>
              ))}
            </ul>
          ) : null}
        </div>
      ) : errorMessage ? (
        <p className="form-notice form-notice--error" role="alert">{errorMessage}</p>
      ) : null}

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
                <ProductImageView alt="" src={selectedProduct.primaryImageUrl} />
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
              inputMode="decimal"
              name="basePrice"
              onChange={(event) => setBasePrice(sanitizeMoneyInput(event.currentTarget.value))}
              placeholder="100"
              required
              type="text"
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
        <ImperfectProductSubmitButton canPersist={canPersist} canSubmit={canSubmit} />
      </div>
    </form>
  );
}

async function unavailableProductAction(
  previousState: ProductFormActionState,
  formData: FormData
) {
  void formData;
  return previousState;
}

function ImperfectProductSubmitButton({ canPersist, canSubmit }: { canPersist: boolean; canSubmit: boolean }) {
  const { pending } = useFormStatus();

  return (
    <button
      className="button button--primary form-actions__submit"
      disabled={!canSubmit || pending}
      type={canSubmit ? "submit" : "button"}
    >
      {pending ? (
        <>
          <span className="loading-spinner" aria-hidden="true" />
          Enregistrement...
        </>
      ) : canPersist ? (
        "Créer le produit imparfait"
      ) : (
        "Base non connectée"
      )}
    </button>
  );
}

function getModelPriceValue(product?: Product) {
  const priceCents = product?.compareAtPriceCents ?? product?.priceCents;
  return priceCents ? formatEuroInput(priceCents) : "";
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
