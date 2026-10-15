"use server";

import { redirect } from "next/navigation";
import { requireSameOriginAction } from "@/server/security/request-guards";
import { updateAccountProfile } from "@/server/account/account-service";

export async function saveAccountProfile(form: FormData) {
  await requireSameOriginAction();
  try {
    const firstName = readProfileField(form, "firstName", 80);
    const lastName = readProfileField(form, "lastName", 80);
    const phone = readProfileField(form, "phone", 30);
    if (phone && !/^[+\d() .-]+$/.test(phone)) throw new Error("Téléphone invalide.");
    await updateAccountProfile({ firstName, lastName, phone });
  } catch {
    redirect("/compte/profil?error=1");
  }
  redirect("/compte/profil?saved=1");
}

function readProfileField(form: FormData, name: string, maxLength: number) {
  const value = form.get(name);
  if (typeof value !== "string") throw new Error("Champ invalide.");
  const trimmed = value.trim();
  if (trimmed.length > maxLength || /[\u0000-\u001f\u007f]/.test(trimmed)) throw new Error("Champ invalide.");
  return trimmed;
}
