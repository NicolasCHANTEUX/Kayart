import { NextResponse } from "next/server";
import { getCurrentAuthSession } from "@/server/auth/session";
import { maxImageSizeBytes, signProductImageReceipt, storeProductImages } from "@/server/catalog/product-image-storage";
import { enforceRateLimit, RateLimitError, requireSameOriginRequest } from "@/server/security/request-guards";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try { requireSameOriginRequest(request); }
  catch { return NextResponse.json({ error: "Requête refusée." }, { status: 403 }); }
  const session = await getCurrentAuthSession();
  if (session?.role !== "admin") return NextResponse.json({ error: "Connexion administrateur requise." }, { status: 401 });
  try {
    enforceRateLimit({ key: `image-upload:${session.user.id}`, limit: 60, windowMs: 10 * 60 * 1000 });
    const maxBody = maxImageSizeBytes + 64 * 1024;
    if (!request.body || Number(request.headers.get("content-length")) > maxBody) return NextResponse.json({ error: "Image trop volumineuse." }, { status: 413 });
    const reader = request.body.getReader();
    const chunks: Uint8Array[] = [];
    let size = 0;
    for (;;) {
      const next = await reader.read();
      if (next.done) break;
      size += next.value.byteLength;
      if (size > maxBody) { await reader.cancel(); return NextResponse.json({ error: "Image trop volumineuse." }, { status: 413 }); }
      chunks.push(next.value);
    }
    const form = await new Response(Buffer.concat(chunks), { headers: { "Content-Type": request.headers.get("content-type") ?? "" } }).formData();
    const file = form.get("image");
    if (!(file instanceof File) || form.getAll("image").length !== 1) return NextResponse.json({ error: "Une image est requise." }, { status: 400 });
    const position = Number(form.get("position"));
    if (!Number.isInteger(position) || position < 0 || position > 5) return NextResponse.json({ error: "Position invalide." }, { status: 400 });
    const [image] = await storeProductImages("", [{ file, position, isPrimary: form.get("isPrimary") === "true" }]);
    return NextResponse.json({ receipt: signProductImageReceipt(image, session.user.id) });
  } catch (error) {
    return NextResponse.json({ error: error instanceof RateLimitError ? "Trop d'envois. Réessayez plus tard." : "Envoi impossible. Utilisez une image fixe JPG, PNG, WebP ou GIF valide de 4 Mo maximum." }, { status: error instanceof RateLimitError ? 429 : 400 });
  }
}
