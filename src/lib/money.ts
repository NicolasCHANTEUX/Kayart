/** Strict decimal euros, stored as PostgreSQL integer cents (no floating point parsing). */
export function parseEuroCents(value: string): number | null {
  const normalized = value.trim().replace(",", ".");
  if (!/^\d+(?:\.\d{1,2})?$/.test(normalized)) return null;
  const [euros, decimals = ""] = normalized.split(".");
  const cents = Number(euros) * 100 + Number(decimals.padEnd(2, "0"));
  return Number.isSafeInteger(cents) && cents > 0 && cents <= 2147483647 ? cents : null;
}

export function formatEuroInput(cents: number): string {
  return (cents / 100).toFixed(2);
}

export function sanitizeMoneyInput(value: string): string {
  const [whole = "", ...fraction] = value.replace(",", ".").replace(/[^\d.]/g, "").split(".");
  return fraction.length ? `${whole}.${fraction.join("").slice(0, 2)}` : whole;
}
