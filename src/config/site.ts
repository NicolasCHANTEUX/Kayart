const configuredSiteUrl =
  process.env.NEXT_PUBLIC_SITE_URL || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "");

export const siteConfig = {
  name: "KayArt",
  tagline: "Carbon in Motion",
  description:
    "Pièces techniques en carbone façonnées à la main pour la performance, la précision et la durée.",
  url: normalizeSiteUrl(configuredSiteUrl || "http://localhost:3000"),
  email: "contact.kayart@gmail.com",
  phone: "+33 6 64 63 15 43",
  nav: [
    { label: "Boutique", href: "/boutique" },
    { label: "Sur mesure", href: "/sur-mesure" },
    { label: "Réparation", href: "/reparation" },
    { label: "Savoir-faire", href: "/savoir-faire" },
    { label: "Journal", href: "/journal" },
    { label: "Contact", href: "/contact" }
  ]
} as const;

export function normalizeSiteUrl(value: string) {
  const trimmedValue = value.trim().replace(/\/+$/u, "");

  if (!trimmedValue) {
    return "http://localhost:3000";
  }

  if (/^https?:\/\//iu.test(trimmedValue)) {
    return trimmedValue;
  }

  if (trimmedValue.startsWith("//")) {
    return `https:${trimmedValue}`;
  }

  if (/^(localhost|127\.0\.0\.1)(:\d+)?$/iu.test(trimmedValue)) {
    return `http://${trimmedValue}`;
  }

  return `https://${trimmedValue}`;
}
