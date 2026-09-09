import Link from "next/link";
import { requireAdminSession } from "@/server/auth/session";
import { getPrismaClient } from "@/server/db/prisma";
import { getLegalConfig } from "@/config/legal";
import { isTestCheckoutEnabled } from "@/server/checkout/stripe";
import { saveShippingZoneAction } from "./actions";
export const metadata = { title: "Admin — Livraison et lancement" };
export default async function ShippingPage({ searchParams }: { searchParams?: Promise<{ error?: string; updated?: string }> }) {
  await requireAdminSession();
  const params = searchParams ? await searchParams : {};
  const canPersist = process.env.KAYART_DATA_SOURCE === "prisma";
  const zones = canPersist ? await getPrismaClient().shippingZone.findMany({ orderBy: { name: "asc" } }) : [];
  const legal = getLegalConfig();
  return <section className="section admin-page"><div className="container"><div className="section__header"><h1 className="page-title">Livraison et lancement</h1><Link href="/admin">Retour admin</Link></div>
    <div className="feature-card"><h2>Retrait atelier</h2><p>Gratuit, sur rendez-vous. Les transports particuliers restent sur devis ou retrait. Aucune livraison payante n’est proposée sans zone active et tarif renseigné.</p><p>Chaque produit doit être marqué « Expédiable » dans sa fiche pour utiliser ces tarifs.</p></div>
    {params.error ? <p className="form-notice form-notice--error">Vérifiez les codes pays, préfixes et prix. Un tarif positif est obligatoire pour activer une zone.</p> : null}
    {params.updated ? <p className="form-notice form-notice--success">Zone enregistrée.</p> : null}
    <div className="request-list">{[...zones, null].map(zone => <form action={saveShippingZoneAction} className="feature-card customer-request-form" key={zone?.id ?? "new"}><h2>{zone?.name ?? "Ajouter une zone"}</h2><fieldset disabled={!canPersist}><legend>Règles de livraison</legend>
      <input type="hidden" name="id" value={zone?.id ?? ""} /><label>Nom<input name="name" required maxLength={120} defaultValue={zone?.name ?? ""} /></label>
      <label>Codes pays ISO, séparés par des virgules<input name="countryCodes" required defaultValue={zone?.countryCodes.join(", ") ?? ""} placeholder="FR, BE, LU, MC, CH" /></label>
      <label>Préfixes postaux inclus (vide = tous)<input name="postalPrefixes" defaultValue={zone?.postalPrefixes.join(", ") ?? ""} /></label>
      <label>Préfixes postaux exclus<input name="excludedPostalPrefixes" defaultValue={zone?.excludedPostalPrefixes.join(", ") ?? ""} /></label>
      <label>Frais TTC en euros (vide = aucun tarif défini)<input name="price" inputMode="decimal" defaultValue={zone?.priceCents ? (zone.priceCents / 100).toFixed(2) : ""} /></label>
      <label className="request-consent"><input name="enabled" type="checkbox" defaultChecked={zone?.enabled ?? false} />Tarif validé : activer cette zone</label><button className="button button--primary">Enregistrer</button>
    </fieldset></form>)}</div>
    <div className="feature-card"><h2>État du lancement</h2><p>Checkout Stripe : {isTestCheckoutEnabled() ? "test activé" : "désactivé — configuration de test attendue"}. Les paiements réels sont refusés.</p><p>Pages légales : {legal.approved ? "informations validées" : "publication bloquée"}.</p>{!legal.approved ? <p>Configuration à compléter : {legal.missing.join(", ") || "validation explicite KAYART_LEGAL_APPROVED"}. Les données doivent être fournies et validées par l’entreprise.</p> : null}</div>
  </div></section>;
}
