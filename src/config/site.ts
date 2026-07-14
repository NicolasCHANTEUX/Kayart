export const siteConfig = {
  name: "KayArt",
  tagline: "Carbon in Motion",
  description:
    "Pieces techniques en carbone faconnees a la main pour la performance, la precision et la duree.",
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
  email: "contact.kayart@gmail.com",
  phone: "+33 6 64 63 15 43",
  nav: [
    { label: "Boutique", href: "/boutique" },
    { label: "Sur mesure", href: "/sur-mesure" },
    { label: "Reparation", href: "/reparation" },
    { label: "Savoir-faire", href: "/savoir-faire" },
    { label: "Journal", href: "/journal" },
    { label: "Contact", href: "/contact" }
  ]
} as const;
