import { parseEuroCents } from "@/lib/money";
export function parseShippingZone(form: FormData) {
  const name = String(form.get("name") || "").trim();
  const countryCodes = String(form.get("countryCodes") || "").toUpperCase().split(/[\s,;]+/).filter(Boolean);
  const prefixes = (key: string) => String(form.get(key) || "").toUpperCase().split(/[,;]+/).map(value => value.trim().replace(/[\s-]/g, "")).filter(Boolean);
  const postalPrefixes = prefixes("postalPrefixes"), excludedPostalPrefixes = prefixes("excludedPostalPrefixes");
  const price = String(form.get("price") || "").trim();
  const priceCents = price ? parseEuroCents(price) : null;
  const enabled = form.get("enabled") === "on";
  if (name.length < 2 || name.length > 120 || !countryCodes.length || countryCodes.length > 40 || countryCodes.some(country => !/^[A-Z]{2}$/.test(country))) throw new Error("Nom ou codes pays invalides.");
  if ([...postalPrefixes, ...excludedPostalPrefixes].length > 100 || [...postalPrefixes, ...excludedPostalPrefixes].some(prefix => !/^[A-Z0-9]{1,12}$/.test(prefix))) throw new Error("Préfixes postaux invalides.");
  if ((price && priceCents === null) || (enabled && priceCents === null)) throw new Error("Renseignez un tarif positif validé avant d’activer la livraison.");
  return { name, countryCodes: [...new Set(countryCodes)], postalPrefixes, excludedPostalPrefixes, priceCents, enabled };
}
