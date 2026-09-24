"use client";

import { useId, useState } from "react";
import { productConditionLabels } from "@/lib/catalog";

type ShopFiltersProps = {
  filters: { q: string; category: string; condition: string; sort: string; stock: string };
  categories: { id: string; slug: string; name: string }[];
};

export function ShopFilters({ filters, categories }: ShopFiltersProps) {
  const [expanded, setExpanded] = useState(false);
  const panelId = useId();
  const count = [filters.category, filters.condition, filters.stock, filters.sort !== "recent"].filter(Boolean).length;

  return (
    <form className="shop-filters" action="/boutique" role="search" aria-label="Rechercher dans le catalogue">
      <div className="shop-filters__search">
        <label htmlFor={`${panelId}-search`}>Rechercher</label>
        <span className="shop-filters__search-field">
          <input id={`${panelId}-search`} type="search" name="q" maxLength={120} defaultValue={filters.q} placeholder="Produit, description, catégorie…" />
          <button type="submit" aria-label="Rechercher les produits">
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true"><circle cx="10.5" cy="10.5" r="6.5" /><path d="m16 16 5 5" /></svg>
          </button>
        </span>
      </div>
      <button type="button" className="shop-filters__toggle" aria-expanded={expanded} aria-controls={panelId} onClick={() => setExpanded(!expanded)}>
        <svg viewBox="0 0 20 20" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true"><path d="M2 6h16M2 14h16M7 3v6m6 2v6" /></svg>
        Filtrer et trier {count > 0 ? <span className="shop-filters__count">{count}<span className="sr-only"> {count > 1 ? "critères actifs" : "critère actif"}</span></span> : null}
        <span className="shop-filters__chevron" aria-hidden="true">{expanded ? "−" : "+"}</span>
      </button>
      <div className="shop-filters__options" id={panelId} data-expanded={expanded}>
        <label>Catégorie<select name="category" defaultValue={filters.category}><option value="">Toutes</option>{categories.map(category => <option key={category.id} value={category.slug}>{category.name}</option>)}</select></label>
        <label>Type<select name="condition" defaultValue={filters.condition}><option value="">Tous</option>{Object.entries(productConditionLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
        <label>Trier<select name="sort" defaultValue={filters.sort}><option value="recent">Nouveautés</option><option value="price-asc">Prix croissant</option><option value="price-desc">Prix décroissant</option><option value="name">Nom</option></select></label>
        <label className="shop-filters__stock"><input type="checkbox" name="stock" value="1" defaultChecked={filters.stock === "1"} />En stock uniquement</label>
        <button type="submit" className="button button--primary">Appliquer</button>
      </div>
      <noscript><style>{".shop-filters__options[data-expanded=false]{display:grid}.shop-filters__toggle{display:none}"}</style></noscript>
    </form>
  );
}
