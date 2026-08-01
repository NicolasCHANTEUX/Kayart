import { NextResponse } from "next/server";
import { getCurrentAuthSession } from "@/server/auth/session";
import {
  createProductImageUploadTargets,
  type ProductImageUploadTargetInput
} from "@/server/catalog/product-image-storage";

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

  const invalidFile = files.find((file) => !file.type.startsWith("image/"));

  if (invalidFile) {
    return NextResponse.json({ error: "Seuls les fichiers image sont acceptés." }, { status: 400 });
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
      const type = typeof file.type === "string" ? file.type.trim() : "";
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
