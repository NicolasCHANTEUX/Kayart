import type { Category, Product } from "@/types/catalog";

export const categories: Category[] = [
  {
    id: "cat-paddles",
    slug: "pagaies",
    name: "Pagaies",
    description: "Pieces carbone orientees performance, controle et adaptation au pratiquant.",
    position: 1,
    isActive: true
  },
  {
    id: "cat-used",
    slug: "occasion",
    name: "Occasion",
    description: "Materiel unique, controle et decrit avant reservation.",
    position: 2,
    isActive: true
  },
  {
    id: "cat-repair",
    slug: "reparation",
    name: "Reparation",
    description: "Diagnostics, reparations et renovations de pieces carbone.",
    position: 3,
    isActive: true
  }
];

export const products: Product[] = [
  {
    id: "signature-paddle",
    slug: "pagaie-carbone-signature",
    sku: "KAY-PAG-SIGNATURE",
    name: "Pagaie carbone signature",
    categoryId: "cat-paddles",
    categoryName: "Pagaies",
    condition: "new",
    availability: "made-to-order",
    priceCents: null,
    compareAtPriceCents: null,
    currency: "EUR",
    stockQuantity: null,
    shortDescription: "Pagaie carbone technique fabriquee a la demande.",
    description:
      "Une pagaie technique pensee pour la rigidite, le controle et l'adaptation au pratiquant.",
    attributes: [
      { label: "Matiere", value: "Carbone" },
      { label: "Poids", value: "Optimise" },
      { label: "Rigidite", value: "Ajustable" },
      { label: "Fabrication", value: "Atelier" }
    ],
    isFeatured: true,
    isReservable: false,
    isCustomizable: true,
    publishedAt: "2026-07-14T00:00:00.000Z"
  },
  {
    id: "used-kayak",
    slug: "kayak-occasion-controle",
    sku: "KAY-OCC-001",
    name: "Kayak d'occasion controle",
    categoryId: "cat-used",
    categoryName: "Occasion",
    condition: "used",
    availability: "available",
    priceCents: null,
    compareAtPriceCents: null,
    currency: "EUR",
    stockQuantity: 1,
    shortDescription: "Produit unique controle avant reservation.",
    description:
      "Materiel d'occasion photographie, verifie et decrit avec precision avant reservation.",
    attributes: [
      { label: "Type", value: "Piece unique" },
      { label: "Etat", value: "Documente" },
      { label: "Parcours", value: "Reservation" },
      { label: "Photos", value: "Detaillees" }
    ],
    isFeatured: false,
    isReservable: true,
    isCustomizable: false,
    publishedAt: "2026-07-14T00:00:00.000Z"
  },
  {
    id: "repair-diagnostic",
    slug: "diagnostic-reparation-carbone",
    sku: "KAY-SRV-REPAIR",
    name: "Diagnostic reparation carbone",
    categoryId: "cat-repair",
    categoryName: "Reparation",
    condition: "service",
    availability: "available",
    priceCents: null,
    compareAtPriceCents: null,
    currency: "EUR",
    stockQuantity: null,
    shortDescription: "Demande de diagnostic avec photos.",
    description:
      "Analyse d'un dommage avec photos pour evaluer une reparation, renovation ou amelioration.",
    attributes: [
      { label: "Entree", value: "Photos" },
      { label: "Traitement", value: "Diagnostic" },
      { label: "Retour", value: "Reponse atelier" },
      { label: "Objectif", value: "Solution adaptee" }
    ],
    isFeatured: false,
    isReservable: false,
    isCustomizable: false,
    publishedAt: "2026-07-14T00:00:00.000Z"
  }
];

export const featuredProducts = products.filter((product) => product.isFeatured || product.condition !== "new");
