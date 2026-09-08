"use server";
import type { RequestFormState } from "@/lib/customer-requests";
import { parseCustomerRequest, RequestValidationError } from "@/server/requests/request-input";
import { submitCustomerRequest } from "@/server/requests/request-service";
import { enforcePersistentRequestLimit } from "@/server/requests/request-rate-limit";
import { getActionClientKey, RateLimitError, requireSameOriginAction } from "@/server/security/request-guards";

export async function submitRequestAction(_previous: RequestFormState, form: FormData): Promise<RequestFormState> {
  const values: Record<string, string> = {};
  for (const key of ["name", "email", "phone", "subject", "message", "productType", "discipline", "practiceLevel", "constraints", "budgetHint"]) {
    const value = form.get(key); if (typeof value === "string") values[key] = value.slice(0, 5000);
  }
  try {
    await requireSameOriginAction();
    if (process.env.KAYART_DATA_SOURCE !== "prisma") throw new Error("Persistence not configured");
    // Honeypot: reject without storing or echoing a false success.
    if (form.get("website")) return { status: "error", message: "Envoi refusé. Contactez l’atelier par email." };
    const input = parseCustomerRequest(form);
    await enforcePersistentRequestLimit(await getActionClientKey("customer-requests"), 5, 15 * 60 * 1000);
    await enforcePersistentRequestLimit(`customer-requests-email:${input.email}`, 5, 60 * 60 * 1000);
    await enforcePersistentRequestLimit("customer-requests-global", 500, 60 * 60 * 1000);
    await submitCustomerRequest(input);
    return { status: "success", message: "Votre demande a bien été enregistrée. L’atelier vous répondra aux coordonnées indiquées." };
  } catch (error) {
    if (error instanceof RequestValidationError) return { status: "error", message: error.message, errors: error.issues, values };
    if (error instanceof RateLimitError) return { status: "error", message: error.message, values };
    return { status: "error", message: "L’envoi n’a pas pu être confirmé. Réessayez ou contactez l’atelier par email. Les photos doivent être des images fixes JPG, PNG, WebP ou GIF de 1 Mo maximum chacune.", values };
  }
}
