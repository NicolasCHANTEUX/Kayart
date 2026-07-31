"use client";

import { useEffect, useRef, useState, type FormEvent, type KeyboardEvent } from "react";
import { ProductImageUploader } from "@/components/admin/product-image-uploader";
import {
  productAvailabilityLabels,
  productAvailabilityValues,
  productConditionLabels,
  productConditionValues
} from "@/lib/catalog";
import { skuFromName, slugify } from "@/lib/slug";
import type { ProductFormDraft } from "@/server/catalog/product-form-draft";
import type { Category, ProductCondition, ProductImage } from "@/types/catalog";

type ProductFormProps = {
  action?: (formData: FormData) => Promise<void>;
  canPersist: boolean;
  categories: Category[];
  conditionOptions?: ProductCondition[];
  defaultValues?: ProductFormDraft;
  errorMessage?: string;
  existingImages?: ProductImage[];
  productId?: string;
  submitLabel?: string;
};

const steps = [
  { id: "identity", label: "1. Identité" },
  { id: "sale", label: "2. Vente" },
  { id: "stock", label: "3. Stock" },
  { id: "presentation", label: "4. Présentation" },
  { id: "options", label: "5. Options" },
  { id: "images", label: "6. Images" }
];

export function ProductForm({
  action,
  canPersist,
  categories,
  conditionOptions = productConditionValues,
  defaultValues,
  errorMessage,
  existingImages = [],
  productId,
  submitLabel = "Enregistrer"
}: ProductFormProps) {
  const formRef = useRef<HTMLFormElement>(null);
  const [name, setName] = useState(defaultValues?.name ?? "");
  const [slug, setSlug] = useState(defaultValues?.slug ?? "");
  const [sku, setSku] = useState(defaultValues?.sku ?? "");
  const [basePrice, setBasePrice] = useState(defaultValues?.basePrice ?? "");
  const [discountPercent, setDiscountPercent] = useState(defaultValues?.discountPercent ?? "");
  const [autoSlug, setAutoSlug] = useState(
    !defaultValues?.slug || defaultValues.slug === slugify(defaultValues.name ?? "")
  );
  const [autoSku, setAutoSku] = useState(
    !defaultValues?.sku || defaultValues.sku === skuFromName(defaultValues.name ?? "")
  );
  const [deletedImageIds, setDeletedImageIds] = useState<string[]>([]);
  const [unlockedStep, setUnlockedStep] = useState(0);
  const [stepError, setStepError] = useState<string | null>(null);
  const isReadyToSubmit = canPersist && unlockedStep === steps.length - 1;
  const salePreview = getSalePreview(basePrice, discountPercent);
  const visibleExistingImages = existingImages.filter((image) => !deletedImageIds.includes(image.id));

  useEffect(() => {
    refreshUnlockState();
  }, [name, slug, sku, basePrice, discountPercent]);

  function refreshUnlockState(form = formRef.current) {
    if (!form) {
      return 0;
    }

    const formData = new FormData(form);
    const nextUnlockedStep = getUnlockedStep(formData);
    setUnlockedStep(nextUnlockedStep);

    if (nextUnlockedStep === steps.length - 1) {
      setStepError(null);
    }

    return nextUnlockedStep;
  }

  function handleNameChange(value: string) {
    setName(value);

    if (autoSlug) {
      setSlug(slugify(value));
    }

    if (autoSku) {
      setSku(skuFromName(value));
    }
  }

  function handleSlugChange(value: string) {
    const nextSlug = slugify(value);
    setSlug(nextSlug);
    setAutoSlug(nextSlug === slugify(name));
  }

  function handleSkuChange(value: string) {
    const nextSku = value.toUpperCase();
    setSku(nextSku);
    setAutoSku(nextSku === skuFromName(name));
  }

  function handleFormInput(form: HTMLFormElement) {
    refreshUnlockState(form);
    setStepError(null);
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    const formData = new FormData(event.currentTarget);
    const nextUnlockedStep = getUnlockedStep(formData);

    setUnlockedStep(nextUnlockedStep);

    if (nextUnlockedStep < steps.length - 1) {
      event.preventDefault();
      setStepError(getBlockingError(formData) ?? "Complétez les sections encore verrouillées avant d'enregistrer.");
    }
  }

  function scrollToStep(stepId: string) {
    document.getElementById(`product-step-${stepId}`)?.scrollIntoView({
      behavior: "smooth",
      block: "start"
    });
  }

  function isStepLocked(index: number) {
    return index > unlockedStep;
  }

  function removeExistingImage(imageId: string) {
    setDeletedImageIds((currentIds) => (
      currentIds.includes(imageId) ? currentIds : [...currentIds, imageId]
    ));
  }

  function stageClassName(index: number) {
    return isStepLocked(index) ? "form-stage form-stage--locked" : "form-stage";
  }

  return (
    <form
      action={action}
      className="admin-form"
      onChange={(event) => handleFormInput(event.currentTarget)}
      onInput={(event) => handleFormInput(event.currentTarget)}
      onSubmit={handleSubmit}
      ref={formRef}
    >
      {errorMessage ? <p className="form-notice form-notice--error">{errorMessage}</p> : null}
      {stepError ? <p className="form-notice form-notice--error">{stepError}</p> : null}
      {productId ? <input name="id" type="hidden" value={productId} /> : null}
      {deletedImageIds.map((imageId) => (
        <input key={imageId} name="deletedImageId" type="hidden" value={imageId} />
      ))}

      <div className="form-steps" aria-label="Progression du formulaire produit">
        {steps.map((step, index) => {
          const state = index < unlockedStep ? "done" : index === unlockedStep ? "current" : "locked";

          return (
            <button
              aria-current={index === unlockedStep ? "step" : undefined}
              className="form-step"
              data-state={state}
              disabled={isStepLocked(index)}
              key={step.id}
              onClick={() => scrollToStep(step.id)}
              type="button"
            >
              {step.label}
            </button>
          );
        })}
      </div>

      <fieldset className={stageClassName(0)} id="product-step-identity" inert={isStepLocked(0)}>
        <legend>Identité produit</legend>
        <div className="form-grid">
          <label>
            Nom
            <input
              minLength={3}
              name="name"
              onChange={(event) => handleNameChange(event.currentTarget.value)}
              placeholder="Pagaie carbone signature"
              required
              type="text"
              value={name}
            />
          </label>
          <label>
            Slug
            <input
              name="slug"
              onChange={(event) => handleSlugChange(event.currentTarget.value)}
              placeholder="pagaie-carbone-signature"
              type="text"
              value={slug}
            />
          </label>
          <label>
            Référence / SKU
            <input
              name="sku"
              onChange={(event) => handleSkuChange(event.currentTarget.value)}
              pattern="[A-Za-z0-9_-]+"
              placeholder="PAG-CAR-SIG"
              required
              type="text"
              value={sku}
            />
          </label>
          <label>
            Catégorie
            <select name="categoryId" defaultValue={defaultValues?.categoryId ?? ""} required>
              <option value="">
                Choisir une catégorie
              </option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </label>
        </div>
      </fieldset>

      <fieldset className={stageClassName(1)} id="product-step-sale" inert={isStepLocked(1)}>
        <legend>Vente et disponibilité</legend>
        <div className="form-grid">
          <label>
            Type
            <select name="condition" defaultValue={defaultValues?.condition ?? ""} required>
              <option value="">
                Choisir un type
              </option>
              {conditionOptions.map((value) => (
                <option key={value} value={value}>
                  {productConditionLabels[value]}
                </option>
              ))}
            </select>
          </label>
          <label>
            Statut
            <select name="availability" defaultValue={defaultValues?.availability ?? ""} required>
              <option value="">
                Choisir un statut
              </option>
              {Object.entries(productAvailabilityLabels).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </label>
          <label>
            Prix de base TTC en euros
            <input
              inputMode="numeric"
              min="0"
              name="basePrice"
              onChange={(event) => setBasePrice(sanitizeIntegerInput(event.currentTarget.value))}
              onInput={(event) => sanitizeNumericInput(event.currentTarget, "integer")}
              onKeyDown={(event) => blockInvalidNumericKey(event, "integer")}
              placeholder="100"
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
              min="0"
              name="discountPercent"
              onChange={(event) => setDiscountPercent(sanitizePercentInput(event.currentTarget.value))}
              onInput={(event) => sanitizeNumericInput(event.currentTarget, "percent")}
              onKeyDown={(event) => blockInvalidNumericKey(event, "integer")}
              placeholder="15"
              step="1"
              type="number"
              value={discountPercent}
            />
          </label>
          <div className="price-preview">
            <span>Prix final TTC</span>
            <strong>{salePreview ? formatEuros(salePreview.finalPrice) : "À calculer"}</strong>
            <small>
              {salePreview
                ? salePreview.discountPercent > 0
                  ? `Remise de ${salePreview.discountPercent}% appliquée sur ${formatEuros(salePreview.basePrice)}.`
                  : "Aucune réduction appliquée."
                : "Renseignez un prix de base pour calculer le prix affiché au client."}
            </small>
          </div>
        </div>
      </fieldset>

      <fieldset className={stageClassName(2)} id="product-step-stock" inert={isStepLocked(2)}>
        <legend>Stock et caractéristiques</legend>
        <div className="form-grid">
          <label>
            Stock
            <input
              inputMode="numeric"
              min="0"
              name="stockQuantity"
              defaultValue={defaultValues?.stockQuantity ?? ""}
              onInput={(event) => sanitizeNumericInput(event.currentTarget, "integer")}
              onKeyDown={(event) => blockInvalidNumericKey(event, "integer")}
              placeholder="1"
              step="1"
              type="number"
            />
          </label>
          <label>
            Poids en kg
            <input
              inputMode="decimal"
              min="0"
              name="weight"
              defaultValue={defaultValues?.weight ?? ""}
              onInput={(event) => sanitizeNumericInput(event.currentTarget, "decimal")}
              onKeyDown={(event) => blockInvalidNumericKey(event, "decimal")}
              placeholder="0.650"
              step="0.001"
              type="number"
            />
          </label>
          <label>
            Dimensions
            <input
              defaultValue={defaultValues?.dimensions ?? ""}
              maxLength={50}
              name="dimensions"
              placeholder="210 cm x 18 cm"
              type="text"
            />
          </label>
        </div>
      </fieldset>

      <fieldset className={stageClassName(3)} id="product-step-presentation" inert={isStepLocked(3)}>
        <legend>Présentation</legend>
        <label>
          Description courte
          <input
            defaultValue={defaultValues?.shortDescription ?? ""}
            name="shortDescription"
            placeholder="Une phrase claire pour les cartes catalogue."
            type="text"
          />
        </label>
        <label>
          Description complète
          <textarea
            defaultValue={defaultValues?.description ?? ""}
            minLength={10}
            name="description"
            placeholder="Détails techniques, usage, fabrication, et informations importantes."
            required
            rows={8}
          />
        </label>
      </fieldset>

      <fieldset className={stageClassName(4)} id="product-step-options" inert={isStepLocked(4)}>
        <legend>Options V1</legend>
        <div className="check-grid">
          <label>
            <input defaultChecked={defaultValues?.isFeatured} name="isFeatured" type="checkbox" />
            Mettre en avant
          </label>
          <label>
            <input defaultChecked={defaultValues?.isReservable} name="isReservable" type="checkbox" />
            Réservable
          </label>
          <label>
            <input defaultChecked={defaultValues?.isCustomizable} name="isCustomizable" type="checkbox" />
            Personnalisable
          </label>
        </div>
      </fieldset>

      <fieldset className={stageClassName(5)} id="product-step-images" inert={isStepLocked(5)}>
        <legend>Images produit</legend>
        {visibleExistingImages.length > 0 ? (
          <div className="existing-images" aria-label="Images actuelles du produit">
            {visibleExistingImages.map((image) => (
              <figure className={image.isPrimary ? "existing-image existing-image--primary" : "existing-image"} key={image.id}>
                <button
                  aria-label="Supprimer cette image"
                  className="existing-image__remove"
                  onClick={() => removeExistingImage(image.id)}
                  type="button"
                >
                  {"\u00d7"}
                </button>
                <img alt={image.altText ?? ""} src={image.url} />
                <figcaption>{image.isPrimary ? "Couverture actuelle" : "Image existante"}</figcaption>
              </figure>
            ))}
          </div>
        ) : null}
        <ProductImageUploader disabled={isStepLocked(5)} />
      </fieldset>

      <div className="form-actions">
        <button className="button button--primary" disabled={!isReadyToSubmit} type={isReadyToSubmit ? "submit" : "button"}>
          {canPersist ? submitLabel : "Base non connectée"}
        </button>
      </div>
    </form>
  );
}

function getUnlockedStep(formData: FormData) {
  for (let step = 0; step < steps.length - 1; step += 1) {
    if (validateStep(step, formData)) {
      return step;
    }
  }

  return steps.length - 1;
}

function getBlockingError(formData: FormData) {
  for (let step = 0; step < steps.length - 1; step += 1) {
    const error = validateStep(step, formData);

    if (error) {
      return error;
    }
  }

  return null;
}

function validateStep(step: number, formData: FormData) {
  if (step === 0) {
    const name = readText(formData, "name");
    const sku = readText(formData, "sku");
    const categoryId = readText(formData, "categoryId");

    if (name.length < 3) {
      return "Le nom du produit doit contenir au moins 3 caractères.";
    }

    if (!sku) {
      return "La référence SKU est obligatoire.";
    }

    if (!/^[a-z0-9_-]+$/i.test(sku)) {
      return "La référence SKU ne doit contenir que lettres, chiffres, tirets ou underscores.";
    }

    if (!categoryId) {
      return "La catégorie est obligatoire.";
    }
  }

  if (step === 1) {
    const condition = readText(formData, "condition");
    const availability = readText(formData, "availability");
    const basePrice = parsePrice(readText(formData, "basePrice"));
    const discountPercent = parseDiscountPercent(readText(formData, "discountPercent"));

    if (!isKnownValue(condition, productConditionValues)) {
      return "Le type de produit est obligatoire.";
    }

    if (!isKnownValue(availability, productAvailabilityValues)) {
      return "Le statut du produit est obligatoire.";
    }

    if (condition !== "service" && availability !== "made-to-order" && basePrice === null) {
      return "Le prix de base TTC est obligatoire pour un produit vendable directement.";
    }

    if (basePrice !== null && basePrice <= 0) {
      return "Le prix de base doit être supérieur à zéro.";
    }

    if (discountPercent === -1) {
      return "La réduction doit être comprise entre 0 et 99%.";
    }

    if (discountPercent > 0 && basePrice === null) {
      return "Renseignez un prix de base avant d'appliquer une réduction.";
    }
  }

  if (step === 2) {
    const condition = readText(formData, "condition");
    const availability = readText(formData, "availability");
    const stock = readText(formData, "stockQuantity");
    const weight = readText(formData, "weight");
    const dimensions = readText(formData, "dimensions");

    if (condition !== "service" && availability !== "made-to-order" && stock === "") {
      return "Le stock est obligatoire pour un produit physique.";
    }

    if (stock !== "" && (!Number.isInteger(Number(stock)) || Number(stock) < 0)) {
      return "Le stock doit être un nombre entier positif.";
    }

    if (condition !== "service" && availability === "available" && Number(stock) <= 0) {
      return "Un produit disponible doit avoir un stock supérieur à zéro.";
    }

    if (condition === "imperfect" && Number(stock) > 1) {
      return "Un produit imparfait doit représenter une pièce unique.";
    }

    if (condition !== "service" && weight === "") {
      return "Le poids est obligatoire pour un produit physique.";
    }

    if (weight !== "" && (!Number.isFinite(Number(weight.replace(",", "."))) || Number(weight.replace(",", ".")) <= 0)) {
      return "Le poids doit être supérieur à zéro.";
    }

    if (condition !== "service" && dimensions.length < 3) {
      return "Les dimensions sont obligatoires pour un produit physique.";
    }
  }

  if (step === 3) {
    const description = readText(formData, "description");

    if (description.length < 10) {
      return "La description complète doit contenir au moins 10 caractères.";
    }
  }

  return null;
}

function readText(formData: FormData, name: string) {
  const value = formData.get(name);
  return typeof value === "string" ? value.trim() : "";
}

function parsePrice(value: string) {
  if (!value) {
    return null;
  }

  const price = Number(value.replace(",", "."));
  return Number.isFinite(price) ? price : -1;
}

function parseDiscountPercent(value: string) {
  if (!value) {
    return 0;
  }

  const discountPercent = Number(value);

  if (!Number.isFinite(discountPercent) || discountPercent < 0 || discountPercent > 99) {
    return -1;
  }

  return discountPercent;
}

function isKnownValue<T extends string>(value: string, allowedValues: readonly T[]): value is T {
  return allowedValues.includes(value as T);
}

type NumericMode = "integer" | "decimal" | "percent";

function blockInvalidNumericKey(event: KeyboardEvent<HTMLInputElement>, mode: NumericMode) {
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

  if (mode === "decimal" && (event.key === "." || event.key === ",")) {
    const value = event.currentTarget.value;

    if (!value.includes(".") && !value.includes(",")) {
      return;
    }
  }

  event.preventDefault();
}

function sanitizeNumericInput(input: HTMLInputElement, mode: NumericMode) {
  const nextValue =
    mode === "decimal"
      ? sanitizeDecimalInput(input.value)
      : mode === "percent"
        ? sanitizePercentInput(input.value)
        : sanitizeIntegerInput(input.value);

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

function sanitizeDecimalInput(value: string) {
  const normalizedValue = value.replace(",", ".").replace(/[^0-9.]/g, "");
  const [integerPart = "", ...decimalParts] = normalizedValue.split(".");

  if (decimalParts.length === 0) {
    return integerPart;
  }

  return `${integerPart}.${decimalParts.join("").slice(0, 3)}`;
}

function getSalePreview(basePriceValue: string, discountPercentValue: string) {
  const basePrice = parsePrice(basePriceValue);
  const discountPercent = parseDiscountPercent(discountPercentValue);

  if (basePrice === null || basePrice <= 0 || discountPercent < 0) {
    return null;
  }

  return {
    basePrice,
    discountPercent,
    finalPrice: Math.round(basePrice * (100 - discountPercent)) / 100
  };
}

function formatEuros(value: number) {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR"
  }).format(value);
}
