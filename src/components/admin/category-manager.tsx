"use client";

import { useState } from "react";
import {
  createCategoryAction,
  deleteCategoryAction,
  updateCategoryAction
} from "@/app/admin/produits/actions";
import { slugify } from "@/lib/slug";
import type { Category } from "@/types/catalog";

type CategoryManagerProps = {
  canPersist: boolean;
  categories: Category[];
};

export function CategoryManager({ canPersist, categories }: CategoryManagerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [autoSlug, setAutoSlug] = useState(true);
  const [categoryToDelete, setCategoryToDelete] = useState<Category | null>(null);

  function handleNameChange(value: string) {
    setName(value);

    if (autoSlug) {
      setSlug(slugify(value));
    }
  }

  function handleSlugChange(value: string) {
    const nextSlug = slugify(value);
    setSlug(nextSlug);
    setAutoSlug(nextSlug === slugify(name));
  }

  return (
    <>
      <button className="button button--ghost" onClick={() => setIsOpen(true)} type="button">
        Catégories
      </button>

      {isOpen ? (
        <div className="modal-backdrop" role="presentation">
          <div aria-modal="true" className="admin-modal admin-modal--wide category-modal" role="dialog">
            <div className="modal-header-row">
              <div>
                <span className="modal-eyebrow">Catalogue</span>
                <h2>Gestion des catégories</h2>
              </div>
              <button className="modal-close-button" onClick={() => setIsOpen(false)} type="button">
                {"\u00d7"}
                <span>Fermer</span>
              </button>
            </div>

            <form action={canPersist ? createCategoryAction : undefined} className="category-create-form">
              <label>
                Nom
                <input
                  name="name"
                  onChange={(event) => handleNameChange(event.currentTarget.value)}
                  placeholder="Pagaies"
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
                  placeholder="pagaies"
                  type="text"
                  value={slug}
                />
              </label>
              <label>
                Position
                <input defaultValue="0" min="0" name="position" step="1" type="number" />
              </label>
              <label className="category-toggle">
                <input defaultChecked name="isActive" type="checkbox" />
                Active
              </label>
              <label className="category-description-field">
                Description
                <input name="description" placeholder="Description courte pour l'administration." type="text" />
              </label>
              <button className="button button--primary" disabled={!canPersist} type={canPersist ? "submit" : "button"}>
                Créer
              </button>
            </form>

            <div className="category-list" aria-label="Catégories existantes">
              {categories.map((category) => (
                <div className="category-row" key={category.id}>
                  <form action={canPersist ? updateCategoryAction : undefined} className="category-row__form">
                    <input name="id" type="hidden" value={category.id} />
                    <label>
                      Nom
                      <input defaultValue={category.name} name="name" required type="text" />
                    </label>
                    <label>
                      Slug
                      <input defaultValue={category.slug} name="slug" type="text" />
                    </label>
                    <label>
                      Position
                      <input defaultValue={category.position} min="0" name="position" step="1" type="number" />
                    </label>
                    <label className="category-toggle">
                      <input defaultChecked={category.isActive} name="isActive" type="checkbox" />
                      Active
                    </label>
                    <label className="category-description-field">
                      Description
                      <input defaultValue={category.description ?? ""} name="description" type="text" />
                    </label>
                    <button className="button button--ghost" disabled={!canPersist} type={canPersist ? "submit" : "button"}>
                      Enregistrer
                    </button>
                  </form>
                  <button
                    className="button button--danger"
                    disabled={!canPersist}
                    onClick={() => setCategoryToDelete(category)}
                    type="button"
                  >
                    Supprimer
                  </button>
                </div>
              ))}

              {categories.length === 0 ? <p className="form-hint">Aucune catégorie enregistrée.</p> : null}
            </div>
          </div>
        </div>
      ) : null}

      {categoryToDelete ? (
        <div className="modal-backdrop modal-backdrop--stacked" role="presentation">
          <div aria-modal="true" className="admin-modal admin-modal--danger" role="dialog">
            <div>
              <span className="modal-eyebrow">Suppression</span>
              <h2>{categoryToDelete.name}</h2>
              <p>
                Les produits associés ne seront pas supprimés, mais ils n'auront plus de catégorie.
              </p>
            </div>
            <form action={canPersist ? deleteCategoryAction : undefined} className="modal-form">
              <input name="id" type="hidden" value={categoryToDelete.id} />
              <div className="modal-actions">
                <button className="button button--ghost" onClick={() => setCategoryToDelete(null)} type="button">
                  Annuler
                </button>
                <button className="button button--primary" type={canPersist ? "submit" : "button"}>
                  Supprimer
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </>
  );
}
