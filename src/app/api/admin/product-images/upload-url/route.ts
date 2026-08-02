import { NextResponse } from "next/server";
import { getCurrentAuthSession } from "@/server/auth/session";
import {
  createProductImageUploadTargets,
  isAllowedProductImageType,
  type ProductImageUploadTargetInput
} from "@/server/catalog/product-image-storage";
import {
  enforceRateLimit,
  getRequestClientKey,
  RateLimitError,
  requireSameOriginRequest
} from "@/server/security/request-guards";

const maxImageCount = 6;
const maxImageSizeBytes = 12 * 1024 * 1024;

type UploadUrlRequest = {
  files?: Array<{
    name?: unknown;
    type?: unknown;
    size?: unknown;
    isPrimary?: unknown;
    position?: unknown;
  }>;
};

export async function POST(request: Request) {
  try {
    requireSameOriginRequest(request);
    enforceRateLimit({
      key: getRequestClientKey(request, "image-upload-url"),
      limit: 30,
      windowMs: 10 * 60 * 1000
    });
  } catch (error) {
    const status = error instanceof RateLimitError ? 429 : 403;
    return NextResponse.json({ error: error instanceof Error ? error.message : "Requête refusée." }, { status });
  }

  const session = await getCurrentAuthSession();

  if (session?.role !== "admin") {
    return NextResponse.json({ error: "Connexion administrateur requise." }, { status: 401 });
  }

  const payload = (await request.json().catch(() => ({}))) as UploadUrlRequest;
  const files = normalizeFiles(payload.files ?? []);

  if (files.length === 0) {
    return NextResponse.json({ uploads: [] });
  }

  if (files.length > maxImageCount) {
    return NextResponse.json({ error: "Un produit peut recevoir 6 images maximum." }, { status: 400 });
  }

  const invalidFile = files.find((file) => !isAllowedProductImageType(file.name, file.type));

  if (invalidFile) {
    return NextResponse.json({ error: "Seuls les fichiers JPG, PNG, WebP ou GIF sont acceptés." }, { status: 400 });
  }

  const oversizedFile = files.find((file) => file.size > maxImageSizeBytes);

  if (oversizedFile) {
    return NextResponse.json({ error: "Chaque image doit faire 12 Mo maximum." }, { status: 400 });
  }

  try {
    const uploads = await createProductImageUploadTargets(files);
    return NextResponse.json({ uploads });
  } catch (error) {
    return NextResponse.json(
      { error: "Impossible de préparer l'envoi des images vers Supabase." },
      { status: 500 }
    );
  }
}

function normalizeFiles(files: NonNullable<UploadUrlRequest["files"]>): ProductImageUploadTargetInput[] {
  return files
    .map((file, index) => {
      const name = typeof file.name === "string" ? file.name.trim() : "";
      const type = typeof file.type === "string" ? file.type.trim().toLowerCase() : "";
      const size = typeof file.size === "number" ? file.size : Number(file.size);
      const position = typeof file.position === "number" ? file.position : index;

      if (!name || !Number.isFinite(size) || size < 0) {
        return null;
      }

      return {
        name,
        type,
        size,
        isPrimary: file.isPrimary === true,
        position
      };
    })
    .filter((file): file is ProductImageUploadTargetInput => Boolean(file));
}
