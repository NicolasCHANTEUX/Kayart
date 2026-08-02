import { randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import { extname, join } from "node:path";
import type { ProductImageUploadInput, ProductStoredImageInput } from "@/server/catalog/catalog.input";

const localPublicBucket = "local-public";
const defaultSupabaseBucket = "product-images";
const allowedImageMimeTypes = new Set([
  "image/gif",
  "image/jpeg",
  "image/png",
  "image/webp"
]);
const allowedImageExtensions = new Set([".gif", ".jpeg", ".jpg", ".png", ".webp"]);

export type ProductImageUploadTargetInput = {
  name: string;
  type: string;
  size: number;
  isPrimary: boolean;
  position: number;
};

export type ProductImageUploadTarget = {
  bucket: string;
  signedUrl: string;
  path: string;
  publicUrl: string;
  originalFilename: string;
  mimeType: string;
  sizeBytes: number;
  isPrimary: boolean;
  position: number;
};

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
  const targets = await createProductImageUploadTargets(
    uploads.map((upload) => ({
      name: upload.file.name,
      type: upload.file.type,
      size: upload.file.size,
      isPrimary: upload.isPrimary,
      position: upload.position
    }))
  );

  return Promise.all(
    uploads.map(async (upload, index) => {
      const target = targets[index];

      if (!target) {
        throw new Error("Impossible de préparer l'envoi de l'image.");
      }

      const buffer = Buffer.from(await upload.file.arrayBuffer());
      const body = new FormData();

      body.append("cacheControl", "31536000");
      body.append("", new Blob([buffer], { type: upload.file.type || "application/octet-stream" }), upload.file.name);

      const response = await fetch(target.signedUrl, {
        body,
        cache: "no-store",
        headers: {
          "x-upsert": "false"
        },
        method: "PUT"
      });

      if (!response.ok) {
        const details = await response.text().catch(() => "");
        throw new Error(
          `Impossible d'envoyer l'image dans Supabase Storage. Verifiez le bucket "${target.bucket}". ${details}`.trim()
        );
      }

      return {
        bucket: target.bucket,
        path: target.publicUrl,
        originalFilename: upload.file.name,
        altText: productName,
        mimeType: upload.file.type || "application/octet-stream",
        sizeBytes: upload.file.size,
        isPrimary: target.isPrimary || (index === 0 && !uploads.some((item) => item.isPrimary)),
        position: upload.position
      };
    })
  );
}

export async function createProductImageUploadTargets(
  files: ProductImageUploadTargetInput[]
): Promise<ProductImageUploadTarget[]> {
  const { apiKey, bucket, projectUrl } = getSupabaseStorageConfig();
  const imageSetId = randomUUID();

  return Promise.all(
    files.map(async (file, index) => {
      const extension = getFileExtensionFromNameOrType(file.name, file.type);
      const fileName = `${randomUUID()}${extension}`;
      const objectPath = `products/${imageSetId}/${fileName}`;
      const signedUrl = await createSupabaseSignedUploadUrl(projectUrl, apiKey, bucket, objectPath);

      return {
        bucket,
        signedUrl,
        path: objectPath,
        publicUrl: buildStoragePublicUrl(projectUrl, bucket, objectPath),
        originalFilename: file.name,
        mimeType: file.type || "application/octet-stream",
        sizeBytes: file.size,
        isPrimary: file.isPrimary || (index === 0 && !files.some((item) => item.isPrimary)),
        position: file.position
      };
    })
  );
}

export function isAllowedProductImageType(name: string, type: string) {
  const normalizedType = type.trim().toLowerCase();
  const extension = extname(name).toLowerCase();

  return allowedImageMimeTypes.has(normalizedType) && allowedImageExtensions.has(extension);
}

export function isTrustedStoredProductImageReference(image: {
  bucket: string;
  mimeType: string;
  path: string;
}) {
  if (!allowedImageMimeTypes.has(image.mimeType.trim().toLowerCase())) {
    return false;
  }

  if (image.bucket === localPublicBucket) {
    return /^\/uploads\/products\/[0-9a-f-]{36}\/[0-9a-f-]{36}\.(gif|jpe?g|png|webp)$/iu.test(image.path);
  }

  const projectUrl = cleanSupabaseUrl(process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL ?? "");
  const bucket = process.env.SUPABASE_STORAGE_BUCKET ?? defaultSupabaseBucket;

  if (!projectUrl || image.bucket !== bucket) {
    return false;
  }

  const publicPrefix = `${projectUrl}/storage/v1/object/public/${encodeURIComponent(bucket)}/products/`;

  return image.path.startsWith(publicPrefix) && /^https:\/\//iu.test(image.path);
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

async function createSupabaseSignedUploadUrl(
  projectUrl: string,
  apiKey: string,
  bucket: string,
  objectPath: string
) {
  const response = await fetch(buildStorageSignedUploadUrl(projectUrl, bucket, objectPath), {
    body: "{}",
    cache: "no-store",
    headers: {
      apikey: apiKey,
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "x-upsert": "false"
    },
    method: "POST"
  });

  const payload = (await response.json().catch(() => ({}))) as {
    signedUrl?: string;
    signedURL?: string;
    token?: string;
    url?: string;
  };

  if (!response.ok) {
    throw new Error("Impossible de préparer l'envoi direct vers Supabase Storage.");
  }

  const rawSignedUrl = payload.signedUrl ?? payload.signedURL ?? payload.url;

  if (!rawSignedUrl) {
    throw new Error("Supabase n'a pas renvoyé d'URL d'envoi.");
  }

  const signedUrl = rawSignedUrl.startsWith("http")
    ? rawSignedUrl
    : `${projectUrl}/storage/v1${rawSignedUrl}`;
  const token = payload.token ?? new URL(signedUrl).searchParams.get("token");

  if (!token) {
    throw new Error("Supabase n'a pas renvoyé de jeton d'envoi.");
  }

  return signedUrl;
}

function buildStorageSignedUploadUrl(projectUrl: string, bucket: string, objectPath: string) {
  return `${projectUrl}/storage/v1/object/upload/sign/${encodeURIComponent(bucket)}/${encodeStoragePath(objectPath)}`;
}

function buildStoragePublicUrl(projectUrl: string, bucket: string, objectPath: string) {
  return `${projectUrl}/storage/v1/object/public/${encodeURIComponent(bucket)}/${encodeStoragePath(objectPath)}`;
}

function encodeStoragePath(path: string) {
  return path.split("/").map(encodeURIComponent).join("/");
}

function getFileExtension(file: File) {
  return getFileExtensionFromNameOrType(file.name, file.type);
}

function getFileExtensionFromNameOrType(name: string, type: string) {
  const fromName = extname(name).toLowerCase();

  if (allowedImageExtensions.has(fromName)) {
    return fromName;
  }

  if (type === "image/png") {
    return ".png";
  }

  if (type === "image/webp") {
    return ".webp";
  }

  if (type === "image/gif") {
    return ".gif";
  }

  return ".jpg";
}
