"use client";
import { useActionState } from "react";
import { submitRequestAction } from "@/app/contact/actions";
import type { RequestFormState, RequestKind } from "@/lib/customer-requests";

export function CustomerRequestForm({ kind, submissionKey, subject = "", enabled }: { kind: RequestKind; submissionKey: string; subject?: string; enabled: boolean }) {
  const [state, action, pending] = useActionState(submitRequestAction, { status: "idle", message: "" } as RequestFormState);
  if (state.status === "success") return <div className="form-notice form-notice--success" role="status"><p>{state.message}</p><a href={kind === "repair" ? "/reparation" : kind === "custom" ? "/sur-mesure" : "/contact"}>Faire une autre demande</a></div>;
  function field(name: string, label: string, options: { required?: boolean; max?: number; type?: string; multiline?: boolean; initial?: string } = {}) {
    const error = state.errors?.[name];
    const common = { name, id: `request-${name}`, required: options.required, maxLength: options.max ?? 200, defaultValue: state.values?.[name] ?? options.initial ?? "", "aria-invalid": Boolean(error), "aria-describedby": error ? `error-${name}` : undefined };
    return <label htmlFor={common.id}>{label}{options.multiline ? <textarea {...common} rows={6} /> : <input {...common} type={options.type ?? "text"} autoComplete={name === "name" ? "name" : name === "email" ? "email" : name === "phone" ? "tel" : "off"} />}{error ? <span id={`error-${name}`} className="field-error">{error}</span> : null}</label>;
  }
  return <form action={action} className="customer-request-form">
    <h2>{kind === "repair" ? "Décrire la réparation" : kind === "custom" ? "Présenter votre projet" : "Envoyer un message"}</h2>
    {!enabled ? <p className="form-notice">Le formulaire est indisponible sur cet environnement. Vous pouvez joindre l’atelier par email.</p> : null}
    {state.message ? <p className="form-notice form-notice--error" role="alert">{state.message}</p> : null}
    <input type="hidden" name="kind" value={kind} /><input type="hidden" name="submissionKey" value={submissionKey} />
    <div className="request-honeypot" aria-hidden="true"><label>Site web<input name="website" tabIndex={-1} autoComplete="off" /></label></div>
    <fieldset disabled={pending || !enabled}>
      <legend>Vos coordonnées</legend>
      <div className="form-grid">{field("name", "Nom *", { required: true, max: 120 })}{field("email", "Email *", { required: true, type: "email", max: 254 })}</div>
      {field("phone", "Téléphone (facultatif)", { type: "tel", max: 40 })}
    </fieldset>
    <fieldset disabled={pending || !enabled}>
      <legend>Votre demande</legend>
      {kind === "contact" ? field("subject", "Objet *", { required: true, initial: subject }) : null}
      {kind === "repair" ? field("productType", "Pièce à réparer *", { required: true }) : null}
      {kind === "custom" ? <div className="form-grid">{field("discipline", "Discipline / usage")}{field("practiceLevel", "Niveau de pratique")}</div> : null}
      {field("message", kind === "repair" ? "Dommages constatés et contexte *" : kind === "custom" ? "Votre projet *" : "Message *", { required: true, multiline: true, max: 5000 })}
      <p className="form-hint">Décrivez votre besoin en au moins 20 caractères.</p>
      {kind === "custom" ? <>{field("constraints", "Dimensions, contraintes et délai souhaité", { multiline: true, max: 2000 })}{field("budgetHint", "Budget indicatif (facultatif)")}</> : null}
      {kind === "repair" ? <label htmlFor="request-photos">Photos (facultatives)<input id="request-photos" name="photos" type="file" accept="image/jpeg,image/png,image/webp,image/gif" multiple /><small>Jusqu’à 3 images fixes de 1 Mo chacune. Les photos restent privées et accessibles à l’atelier.</small>{state.errors?.photos ? <span className="field-error">{state.errors.photos}</span> : null}</label> : null}
      <p className="form-hint">Les coordonnées et informations transmises servent à traiter votre demande et à vous répondre. Les champs marqués * sont nécessaires à ce traitement. Les photos restent privées. Pour toute question sur vos données, contactez contact.kayart@gmail.com. N’envoyez aucune donnée bancaire.</p>
      <label className="request-consent"><input name="privacyAcknowledged" type="checkbox" required />J’ai pris connaissance de l’information sur l’utilisation de mes données. *</label>
      {state.errors?.privacyAcknowledged ? <p className="field-error">{state.errors.privacyAcknowledged}</p> : null}
      <button className="button button--primary" type="submit">{pending ? "Envoi en cours…" : "Envoyer ma demande"}</button>
    </fieldset>
  </form>;
}
