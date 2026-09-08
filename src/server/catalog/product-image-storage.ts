import { createHmac, randomBytes, randomUUID, timingSafeEqual } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import { extname, join } from "node:path";
import sharp from "sharp";
import type { ProductImageUploadInput, ProductStoredImageInput } from "@/server/catalog/catalog.input";

export const maxImageSizeBytes = 4 * 1024 * 1024;
const localReceiptKey = randomBytes(32);
const allowedFormats = new Set(["jpeg", "png", "webp", "gif"]);

export function isAllowedProductImageType(name: string, type: string) {
  return ["image/jpeg", "image/png", "image/webp", "image/gif"].includes(type)
    && [".jpg", ".jpeg", ".png", ".webp", ".gif"].includes(extname(name).toLowerCase());
}

export async function normalizeProductImage(file: File): Promise<Buffer> {
  if (!file.size || file.size > maxImageSizeBytes || !isAllowedProductImageType(file.name, file.type)) {
    throw new Error("Image invalide : JPG, PNG, WebP ou GIF, 4 Mo maximum.");
  }
  const source = Buffer.from(await file.arrayBuffer());
  const decoder = sharp(source, { failOn: "warning", limitInputPixels: 24_000_000 });
  const metadata = await decoder.metadata();
  if (!metadata.format || !allowedFormats.has(metadata.format) || (metadata.pages ?? 1) > 1) {
    throw new Error("Utilisez une image fixe JPG, PNG, WebP ou GIF valide.");
  }
  // Decode pixels and discard metadata and trailing content before publication.
  const normalized = await decoder.rotate().resize({ width: 2400, height: 2400, fit: "inside", withoutEnlargement: true }).webp({ quality: 88 }).toBuffer();
  if (normalized.length > maxImageSizeBytes) throw new Error("Image convertie trop volumineuse.");
  return normalized;
}

export async function storeProductImages(productName: string, uploads: ProductImageUploadInput[]): Promise<ProductStoredImageInput[]> {
  if (uploads.length > 6) throw new Error("Six images maximum.");
  const results: ProductStoredImageInput[] = [];
  // Sequential decoding bounds peak memory use.
  for (const upload of uploads) {
    const buffer = await normalizeProductImage(upload.file);
    const objectPath = `products/${randomUUID()}/${randomUUID()}.webp`;
    let bucket = "local-public";
    let publicPath = `/uploads/${objectPath}`;
    const useSupabase = process.env.KAYART_IMAGE_STORAGE !== "local" && (process.env.KAYART_IMAGE_STORAGE === "supabase" || process.env.VERCEL === "1" || Boolean(process.env.SUPABASE_STORAGE_BUCKET));
    if (useSupabase) {
      const apiKey = process.env.SUPABASE_SECRET_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY;
      const projectUrl = (process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL ?? "").replace(/\/rest\/v1\/?$/u, "").replace(/\/+$/u, "");
      bucket = process.env.SUPABASE_STORAGE_BUCKET ?? "product-images";
      if (!apiKey || !projectUrl.startsWith("https://")) throw new Error("Stockage images non configuré.");
      const response = await fetch(`${projectUrl}/storage/v1/object/${encodeURIComponent(bucket)}/${objectPath}`, {
        method: "POST", cache: "no-store", body: new Uint8Array(buffer),
        headers: { apikey: apiKey, Authorization: `Bearer ${apiKey}`, "Content-Type": "image/webp", "x-upsert": "false", "Cache-Control": "max-age=31536000" }
      });
      if (!response.ok) throw new Error("Impossible d'enregistrer l'image dans le stockage.");
      publicPath = `${projectUrl}/storage/v1/object/public/${encodeURIComponent(bucket)}/${objectPath}`;
    } else {
      if (process.env.NODE_ENV === "production") throw new Error("Le stockage Supabase est requis en production.");
      const directory = join(process.cwd(), "public", "uploads", objectPath.substring(0, objectPath.lastIndexOf("/")));
      await mkdir(directory, { recursive: true });
      await writeFile(join(process.cwd(), "public", "uploads", objectPath), buffer, { flag: "wx" });
    }
    results.push({ bucket, path: publicPath, originalFilename: upload.file.name.slice(0, 255), altText: productName, mimeType: "image/webp", sizeBytes: buffer.length, isPrimary: upload.isPrimary, position: upload.position });
  }
  return results;
}

function receiptKey() {
  const key = process.env.PRODUCT_IMAGE_RECEIPT_SECRET || process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key && process.env.NODE_ENV === "production") throw new Error("Signature des images non configurée.");
  return key ?? localReceiptKey;
}

export function signProductImageReceipt(image: ProductStoredImageInput, userId: string): string {
  const payload = Buffer.from(JSON.stringify({ image, userId, expiresAt: Date.now() + 60 * 60 * 1000 })).toString("base64url");
  const signature = createHmac("sha256", receiptKey()).update(`product-image-v1:${payload}`).digest("base64url");
  return `${payload}.${signature}`;
}

export function verifyProductImageReceipt(value: string, userId: string): ProductStoredImageInput | null {
  try {
    if (value.length > 8192 || !userId) return null;
    const parts = value.split(".");
    if (parts.length !== 2) return null;
    const expected = createHmac("sha256", receiptKey()).update(`product-image-v1:${parts[0]}`).digest();
    const signature = Buffer.from(parts[1], "base64url");
    if (signature.length !== expected.length || !timingSafeEqual(signature, expected)) return null;
    const payload = JSON.parse(Buffer.from(parts[0], "base64url").toString("utf8"));
    if (payload.userId !== userId || !Number.isFinite(payload.expiresAt) || payload.expiresAt <= Date.now()) return null;
    return payload.image as ProductStoredImageInput;
  } catch { return null; }
}
