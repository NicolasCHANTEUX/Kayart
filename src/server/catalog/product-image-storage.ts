import { randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import { extname, join } from "node:path";
import type { ProductImageUploadInput, ProductStoredImageInput } from "@/server/catalog/catalog.input";

const localPublicBucket = "local-public";
const defaultSupabaseBucket = "product-images";

export async function storeProductImages(
  productName: string,
  uploads: ProductImageUploadInput[]
): Promise<ProductStoredImageInput[]> {
  if (uploads.length === 0) {
    return [];
  }

  if (shouldUseSupabaseStorage()) {
    return storeProductImagesInSupabase(productName, uploads);
  }

  return storeProductImagesLocally(productName, uploads);
}

async function storeProductImagesLocally(productName: string, uploads: ProductImageUploadInput[]) {
  const imageSetId = randomUUID();
  const directory = join(process.cwd(), "public", "uploads", "products", imageSetId);
  await mkdir(directory, { recursive: true });

  return Promise.all(
    uploads.map(async (upload, index) => {
      const extension = getFileExtension(upload.file);
      const fileName = `${randomUUID()}${extension}`;
      const filePath = join(directory, fileName);
      const buffer = Buffer.from(await upload.file.arrayBuffer());

      await writeFile(filePath, buffer);

      return {
        bucket: localPublicBucket,
        path: `/uploads/products/${imageSetId}/${fileName}`,
        originalFilename: upload.file.name,
        altText: productName,
        mimeType: upload.file.type || "application/octet-stream",
        sizeBytes: upload.file.size,
        isPrimary: upload.isPrimary || (index === 0 && !uploads.some((item) => item.isPrimary)),
        position: upload.position
      };
    })
  );
}

async function storeProductImagesInSupabase(
  productName: string,
  uploads: ProductImageUploadInput[]
): Promise<ProductStoredImageInput[]> {
  const { apiKey, bucket, projectUrl } = getSupabaseStorageConfig();
  const imageSetId = randomUUID();

  return Promise.all(
    uploads.map(async (upload, index) => {
      const extension = getFileExtension(upload.file);
      const fileName = `${randomUUID()}${extension}`;
      const objectPath = `products/${imageSetId}/${fileName}`;
      const buffer = Buffer.from(await upload.file.arrayBuffer());
      const response = await fetch(buildStorageObjectUrl(projectUrl, bucket, objectPath), {
        body: buffer,
        cache: "no-store",
        headers: {
          apikey: apiKey,
          Authorization: `Bearer ${apiKey}`,
          "cache-control": "31536000",
          "Content-Type": upload.file.type || "application/octet-stream",
          "x-upsert": "false"
        },
        method: "POST"
      });

      if (!response.ok) {
        const details = await response.text().catch(() => "");
        throw new Error(
          `Impossible d'envoyer l'image dans Supabase Storage. Verifiez le bucket "${bucket}". ${details}`.trim()
        );
      }

      return {
        bucket,
        path: buildStoragePublicUrl(projectUrl, bucket, objectPath),
        originalFilename: upload.file.name,
        altText: productName,
        mimeType: upload.file.type || "application/octet-stream",
        sizeBytes: upload.file.size,
        isPrimary: upload.isPrimary || (index === 0 && !uploads.some((item) => item.isPrimary)),
        position: upload.position
      };
    })
  );
}

function shouldUseSupabaseStorage() {
  if (process.env.KAYART_IMAGE_STORAGE === "local") {
    return false;
  }

  return (
    process.env.KAYART_IMAGE_STORAGE === "supabase" ||
    process.env.VERCEL === "1" ||
    Boolean(process.env.SUPABASE_STORAGE_BUCKET)
  );
}

function getSupabaseStorageConfig() {
  const apiKey = process.env.SUPABASE_SECRET_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY;
  const projectUrl = cleanSupabaseUrl(process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL ?? "");
  const bucket = process.env.SUPABASE_STORAGE_BUCKET ?? defaultSupabaseBucket;

  if (!apiKey || !projectUrl) {
    throw new Error(
      "Le stockage Supabase des images n'est pas configuré. Ajoutez SUPABASE_URL, SUPABASE_SECRET_KEY et SUPABASE_STORAGE_BUCKET dans Vercel."
    );
  }

  return {
    apiKey,
    bucket,
    projectUrl
  };
}

function cleanSupabaseUrl(value: string) {
  return value.replace(/\/rest\/v1\/?$/u, "").replace(/\/+$/u, "");
}

function buildStorageObjectUrl(projectUrl: string, bucket: string, objectPath: string) {
  return `${projectUrl}/storage/v1/object/${encodeURIComponent(bucket)}/${encodeStoragePath(objectPath)}`;
}

function buildStoragePublicUrl(projectUrl: string, bucket: string, objectPath: string) {
  return `${projectUrl}/storage/v1/object/public/${encodeURIComponent(bucket)}/${encodeStoragePath(objectPath)}`;
}

function encodeStoragePath(path: string) {
  return path.split("/").map(encodeURIComponent).join("/");
}

function getFileExtension(file: File) {
  const fromName = extname(file.name).toLowerCase();

  if ([".jpg", ".jpeg", ".png", ".webp", ".gif"].includes(fromName)) {
    return fromName;
  }

  if (file.type === "image/png") {
    return ".png";
  }

  if (file.type === "image/webp") {
    return ".webp";
  }

  if (file.type === "image/gif") {
    return ".gif";
  }

  return ".jpg";
}
