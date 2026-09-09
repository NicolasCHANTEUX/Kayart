import type { MetadataRoute } from "next";
import { getIndexableOrigin } from "@/config/seo";
import { getLegalConfig } from "@/config/legal";
import { getPrismaClient } from "@/server/db/prisma";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const origin = getIndexableOrigin();
  if (!origin) return [];
  const routes = ["", "/boutique", "/contact", "/reparation", "/sur-mesure"];
  if (getLegalConfig().approved) routes.push("/mentions-legales", "/cgv", "/confidentialite");
  // Only public identifiers and dates are needed, never the full product graph.
  const products = await getPrismaClient().product.findMany({
    where: { publishedAt: { not: null }, availability: { notIn: ["draft", "archived", "unavailable"] } },
    select: { slug: true, updatedAt: true }, orderBy: { id: "asc" },
    take: 49990
  });
  return [
    ...routes.map(path => ({ url: `${origin}${path || "/"}` })),
    ...products.map(product => ({ url: `${origin}/boutique/${encodeURIComponent(product.slug)}`, lastModified: product.updatedAt }))
  ];
}
