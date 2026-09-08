import { requestKinds, type RequestKind } from "@/lib/customer-requests";
export class RequestValidationError extends Error {
  constructor(public issues: Record<string, string>) { super("Vérifiez les champs indiqués."); }
}
export function parseCustomerRequest(form: FormData) {
  const issues: Record<string, string> = {};
  const text = (key: string, max: number, min = 0) => {
    const raw = form.get(key);
    const value = typeof raw === "string" ? raw.trim() : "";
    if (value.length < min || value.length > max) issues[key] = `Renseignez entre ${min} et ${max} caractères.`;
    return value;
  };
  const kind = text("kind", 12) as RequestKind;
  if (!requestKinds.includes(kind)) issues.kind = "Type de demande invalide.";
  const submissionKey = text("submissionKey", 36);
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(submissionKey)) issues.submissionKey = "Rechargez le formulaire.";
  const name = text("name", 120, 2);
  const email = text("email", 254, 3).toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) issues.email = "Renseignez une adresse email valide.";
  const phone = text("phone", 40) || null;
  const subject = kind === "contact" ? text("subject", 200, 3) : "";
  const message = text("message", 5000, 20);
  const productType = kind === "repair" ? text("productType", 200, 2) : "";
  const discipline = kind === "custom" ? text("discipline", 120) : "";
  const practiceLevel = kind === "custom" ? text("practiceLevel", 120) : "";
  const constraints = kind === "custom" ? text("constraints", 2000) : "";
  const budgetHint = kind === "custom" ? text("budgetHint", 200) : "";
  if (form.get("privacyAcknowledged") !== "on") issues.privacyAcknowledged = "Confirmez avoir lu l’information sur vos données.";
  const files = form.getAll("photos").filter((v): v is File => typeof v !== "string" && v.size > 0);
  if (files.length > 3 || files.some(f => f.size > 1024 * 1024) || (kind !== "repair" && files.length > 0)) issues.photos = "Trois photos maximum de 1 Mo chacune, pour les réparations uniquement.";
  if (Object.keys(issues).length) throw new RequestValidationError(issues);
  return { kind, submissionKey, name, email, phone, subject, message, productType, discipline, practiceLevel, constraints, budgetHint, files };
}
export type CustomerRequestInput = ReturnType<typeof parseCustomerRequest>;
