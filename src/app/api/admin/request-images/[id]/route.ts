import { getCurrentAuthSession } from "@/server/auth/session";
import { getPrismaClient } from "@/server/db/prisma";
import { requestStorageConfig } from "@/server/requests/private-images";
export const runtime = "nodejs";
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getCurrentAuthSession();
  if (session?.role !== "admin") return new Response("Connexion administrateur requise.", { status: 401 });
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) return new Response(null, { status: 404 });
  const image = await getPrismaClient().mediaAsset.findFirst({ where: { id, visibility: "private", bucket: "request-images", requestMedia: { some: {} } } });
  if (!image || !/^requests\/[0-9a-f-]{36}\.webp$/.test(image.path)) return new Response(null, { status: 404 });
  const config = requestStorageConfig();
  const response = await fetch(`${config.url}/storage/v1/object/authenticated/${config.bucket}/${image.path}`, { headers: config.headers, cache: "no-store" });
  if (!response.ok) return new Response(null, { status: 502 });
  return new Response(response.body, { headers: { "Content-Type": "image/webp", "Cache-Control": "private, no-store", "X-Content-Type-Options": "nosniff", "Content-Disposition": "inline" } });
}
