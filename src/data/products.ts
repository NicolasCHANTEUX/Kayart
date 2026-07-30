import type { Category, Product } from "@/types/catalog";

export const categories: Category[] = [
  {
    id: "cat-paddles",
    slug: "pagaies",
    name: "Pagaies",
    description: "Pièces carbone orientées performance, contrôle et adaptation au pratiquant.",
    position: 1,
    isActive: true
  },
  {
    id: "cat-imperfect",
    slug: "imparfaits",
    name: "Imparfaits",
    description: "Pièces neuves avec défaut visuel documenté, proposées en exemplaire unique.",
    position: 2,
    isActive: true
  },
  {
    id: "cat-repair",
    slug: "reparation",
    name: "Réparation",
    description: "Diagnostics, réparations et rénovations de pièces carbone.",
    position: 3,
    isActive: true
  }
];

const signaturePaddleBase = {
  id: "signature-paddle",
  slug: "pagaie-carbone-signature",
  sku: "KAY-PAG-SIGNATURE",
  name: "Pagaie carbone signature",
  categoryName: "Pagaies",
  priceCents: null,
  compareAtPriceCents: null,
  currency: "EUR" as const,
  shortDescription: "Pagaie carbone technique fabriquée à la demande.",
  description:
    "Une pagaie technique pensée pour la rigidité, le contrôle et l'adaptation au pratiquant.",
  attributes: [
    { label: "Matière", value: "Carbone" },
    { label: "Poids", value: "Optimisé" },
    { label: "Rigidité", value: "Ajustable" },
    { label: "Fabrication", value: "Atelier" }
  ],
  images: []
};

export const products: Product[] = [
  {
    ...signaturePaddleBase,
    categoryId: "cat-paddles",
    condition: "new",
    availability: "made-to-order",
    stockQuantity: null,
    images: [],
    isFeatured: true,
    isReservable: false,
    isCustomizable: true,
    publishedAt: "2026-07-14T00:00:00.000Z"
  },
  {
    id: "imperfect-paddle",
    slug: "pagaie-carbone-signature-imparfaite",
    sku: "KAY-PAG-IMP-001",
    name: "Pagaie carbone signature - Imparfait",
    categoryId: "cat-imperfect",
    categoryName: "Imparfaits",
    condition: "imperfect",
    availability: "available",
    priceCents: 8500,
    compareAtPriceCents: 10000,
    currency: "EUR",
    stockQuantity: 1,
    shortDescription: "Pièce unique neuve avec défaut visuel documenté.",
    description:
      "Produit neuf issu de l'atelier, proposé avec une remise car un défaut visuel est présent sans impact fonctionnel.",
    baseProductId: "signature-paddle",
    baseProduct: signaturePaddleBase,
    defectDescription: "Petite bulle visible dans la résine sur une zone non structurelle.",
    attributes: [
      { label: "Type", value: "Pièce unique" },
      { label: "État", value: "Neuf imparfait" },
      { label: "Défaut", value: "Visuel uniquement" },
      { label: "Photos", value: "Détaillées" }
    ],
    images: [],
    isFeatured: false,
    isReservable: true,
    isCustomizable: false,
    publishedAt: "2026-07-14T00:00:00.000Z"
  },
  {
    id: "repair-diagnostic",
    slug: "diagnostic-reparation-carbone",
    sku: "KAY-SRV-REPAIR",
    name: "Diagnostic réparation carbone",
    categoryId: "cat-repair",
    categoryName: "Réparation",
    condition: "service",
    availability: "available",
    priceCents: null,
    compareAtPriceCents: null,
    currency: "EUR",
    stockQuantity: null,
    shortDescription: "Demande de diagnostic avec photos.",
    description:
      "Analyse d'un dommage avec photos pour évaluer une réparation, rénovation ou amélioration.",
    attributes: [
      { label: "Entrée", value: "Photos" },
      { label: "Traitement", value: "Diagnostic" },
      { label: "Réponse", value: "Atelier" },
      { label: "Objectif", value: "Solution adaptée" }
    ],
    images: [],
    isFeatured: false,
    isReservable: false,
    isCustomizable: false,
    publishedAt: "2026-07-14T00:00:00.000Z"
  }
];

export const featuredProducts = products.filter((product) => product.isFeatured || product.condition !== "new");
