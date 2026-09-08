export type ShippingRule = { id: string; name: string; countryCodes: string[]; postalPrefixes: string[]; excludedPostalPrefixes: string[]; priceCents: number | null; enabled: boolean };
export function normalizedPostalCode(value: string) { return value.toUpperCase().replace(/[\s-]/g, ""); }
export function availableShippingZones(zones: ShippingRule[], country: string, postalCode: string, allShippable: boolean) {
  if (!allShippable || !/^[A-Z]{2}$/.test(country) || !postalCode.trim()) return [];
  const postal = normalizedPostalCode(postalCode);
  if (country === "FR" && !/^\d{5}$/.test(postal)) return [];
  return zones.filter(zone => zone.enabled && Number.isInteger(zone.priceCents) && zone.priceCents! > 0 && zone.countryCodes.includes(country)
    && (!zone.postalPrefixes.length || zone.postalPrefixes.some(prefix => postal.startsWith(normalizedPostalCode(prefix))))
    && !zone.excludedPostalPrefixes.some(prefix => postal.startsWith(normalizedPostalCode(prefix))));
}
