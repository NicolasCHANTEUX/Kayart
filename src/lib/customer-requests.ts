export const requestKinds = ["contact", "repair", "custom"] as const;
export type RequestKind = (typeof requestKinds)[number];
export const requestKindLabels = { contact: "Contact", repair: "Réparation", custom: "Sur mesure" };
export const requestStatuses = ["new", "inProgress", "answered", "closed"] as const;
export type CustomerRequestStatus = (typeof requestStatuses)[number];
export const requestStatusLabels = { new: "Nouvelle", inProgress: "En cours", answered: "Réponse envoyée", closed: "Clôturée" };
export type RequestFormState = {
  status: "idle" | "error" | "success";
  message: string;
  errors?: Record<string, string>;
  values?: Record<string, string>;
};
