import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "KayArt",
    short_name: "KayArt",
    description: "Pièces carbone artisanales, réparation et sur-mesure.",
    start_url: "/",
    display: "standalone",
    background_color: "#101312",
    theme_color: "#101312",
    icons: [
      {
        src: "/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "any"
      }
    ]
  };
}
