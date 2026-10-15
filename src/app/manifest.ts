import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "KayArt",
    short_name: "KayArt",
    description: "Pièces carbone artisanales, réparation et sur-mesure.",
    id: "/",
    scope: "/",
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#ffffff",
    categories: ["shopping", "sports"],
    prefer_related_applications: false,
    icons: [
      {
        src: "/icons/kayart-rounded-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any"
      },
      {
        src: "/icons/kayart-rounded-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any"
      }
    ]
  };
}
