import { productAvailabilityLabels, productConditionLabels } from "@/lib/catalog";
import type { Category } from "@/types/catalog";

type ProductFormProps = {
  action?: (formData: FormData) => Promise<void>;
  canPersist: boolean;
  categories: Category[];
  errorMessage?: string;
};

export function ProductForm({ action, canPersist, categories, errorMessage }: ProductFormProps) {
  return (
    <form action={action} className="admin-form">
      {errorMessage ? <p className="form-notice form-notice--error">{errorMessage}</p> : null}

      <fieldset>
        <legend>Identite produit</legend>
        <div className="form-grid">
          <label>
            Nom
            <input name="name" placeholder="Pagaie carbone signature" required type="text" />
          </label>
          <label>
            Slug
            <input name="slug" placeholder="pagaie-carbone-signature" type="text" />
          </label>
          <label>
            Reference / SKU
            <input name="sku" placeholder="KAY-PAG-001" type="text" />
          </label>
          <label>
            Categorie
            <select name="categoryId" defaultValue="">
              <option value="">
                Choisir une categorie
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

      <fieldset>
        <legend>Vente et disponibilite</legend>
        <div className="form-grid">
          <label>
            Type
            <select name="condition" defaultValue="new">
              {Object.entries(productConditionLabels).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </label>
          <label>
            Statut
            <select name="availability" defaultValue="draft">
              {Object.entries(productAvailabilityLabels).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </label>
          <label>
            Prix TTC en euros
            <input inputMode="decimal" min="0" name="price" placeholder="249" step="0.01" type="number" />
          </label>
          <label>
            Stock
            <input min="0" name="stockQuantity" placeholder="1" step="1" type="number" />
          </label>
        </div>
      </fieldset>

      <fieldset>
        <legend>Presentation</legend>
        <label>
          Description courte
          <input
            name="shortDescription"
            placeholder="Une phrase claire pour les cartes catalogue."
            type="text"
          />
        </label>
        <label>
          Description complete
          <textarea
            name="description"
            placeholder="Details techniques, usage, fabrication, et informations importantes."
            rows={8}
          />
        </label>
      </fieldset>

      <fieldset>
        <legend>Options V1</legend>
        <div className="check-grid">
          <label>
            <input name="isFeatured" type="checkbox" />
            Mettre en avant
          </label>
          <label>
            <input name="isReservable" type="checkbox" />
            Reservable
          </label>
          <label>
            <input name="isCustomizable" type="checkbox" />
            Personnalisable
          </label>
        </div>
      </fieldset>

      <div className="form-actions">
        <button className="button button--primary" disabled={!canPersist} type={canPersist ? "submit" : "button"}>
          {canPersist ? "Enregistrer" : "Base non connectee"}
        </button>
        <p>
          {canPersist
            ? "Le produit sera cree dans le catalogue."
            : "La sauvegarde sera activee quand la base Supabase sera configuree."}
        </p>
      </div>
    </form>
  );
}
