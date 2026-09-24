import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { getCurrentAuthSession } from "@/server/auth/session";
import { rotateExistingProductImage } from "@/server/catalog/product-image-rotation";
import { enforceRateLimit, RateLimitError, requireSameOriginRequest } from "@/server/security/request-guards";

export const runtime = "nodejs";

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/iu;

export async function POST(request: Request) {
  try { requireSameOriginRequest(request); }
  catch { return NextResponse.json({ error: "Requête refusée." }, { status: 403 }); }

  const session = await getCurrentAuthSession();
  if (session?.role !== "admin") return NextResponse.json({ error: "Connexion administrateur requise." }, { status: 401 });

  try {
    enforceRateLimit({ key: `image-rotation:${session.user.id}`, limit: 60, windowMs: 10 * 60 * 1000 });
    const body: unknown = await request.json();
    const productId = typeof body === "object" && body !== null && "productId" in body ? body.productId : null;
    const imageId = typeof body === "object" && body !== null && "imageId" in body ? body.imageId : null;
    if (typeof productId !== "string" || !uuidPattern.test(productId) || typeof imageId !== "string" || !uuidPattern.test(imageId)) {
      return NextResponse.json({ error: "Image invalide." }, { status: 400 });
    }
    const rotated = await rotateExistingProductImage({ productId, imageId });
    revalidatePath("/");
    revalidatePath("/boutique");
    revalidatePath(`/boutique/${rotated.slug}`);
    return NextResponse.json({ url: rotated.url });
  } catch (error) {
    const rateLimited = error instanceof RateLimitError;
    return NextResponse.json({ error: rateLimited ? "Trop de rotations. Réessayez plus tard." : error instanceof Error ? error.message : "Rotation impossible." }, { status: rateLimited ? 429 : 400 });
  }
}
