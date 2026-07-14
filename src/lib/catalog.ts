import type { ProductAvailability, ProductCondition } from "@/types/catalog";

export const productConditionValues: ProductCondition[] = ["new", "used", "service"];

export const productAvailabilityValues: ProductAvailability[] = [
  "draft",
  "available",
  "reserved",
  "made-to-order",
  "unavailable",
  "archived"
];

export const productConditionLabels: Record<ProductCondition, string> = {
  new: "Neuf",
  used: "Occasion",
  service: "Service"
};

export const productAvailabilityLabels: Record<ProductAvailability, string> = {
  draft: "Brouillon",
  available: "Disponible",
  reserved: "Reserve",
  "made-to-order": "Sur commande",
  unavailable: "Indisponible",
  archived: "Archive"
};
