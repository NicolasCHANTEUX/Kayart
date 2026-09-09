import type { MetadataRoute } from "next";
import { getIndexableOrigin } from "@/config/seo";

export const dynamic = "force-dynamic";

export default function robots(): MetadataRoute.Robots {
  const origin = getIndexableOrigin();
  if (!origin) return { rules: { userAgent: "*", disallow: "/" } };
  return {
    rules: { userAgent: "*", allow: "/", disallow: ["/admin", "/api/", "/compte", "/connexion", "/inscription", "/mot-de-passe-oublie", "/nouveau-mot-de-passe", "/panier", "/commande"] },
    sitemap: `${origin}/sitemap.xml`
  };
}
