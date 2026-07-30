export const siteConfig = {
  name: "KayArt",
  tagline: "Carbon in Motion",
  description:
    "Pièces techniques en carbone façonnées à la main pour la performance, la précision et la durée.",
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
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
