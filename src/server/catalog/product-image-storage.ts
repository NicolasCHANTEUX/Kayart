import { createHmac, randomBytes, randomUUID, timingSafeEqual } from "node:crypto";
import { mkdir, readFile, stat, unlink, writeFile } from "node:fs/promises";
import { extname, join } from "node:path";
import sharp from "sharp";
import type { ProductImageUploadInput, ProductStoredImageInput } from "@/server/catalog/catalog.input";
import { supabaseServiceHeaders } from "@/server/supabase/service-headers";

export const maxImageSizeBytes = 4 * 1024 * 1024;
const localReceiptKey = randomBytes(32);
const allowedFormats = new Set(["jpeg", "png", "webp", "gif"]);
const productPathPattern = /^products\/[0-9a-f-]{36}\/[0-9a-f-]{36}\.webp$/u;

export function isAllowedProductImageType(name: string, type: string) {
  return ["image/jpeg", "image/png", "image/webp", "image/gif"].includes(type)
    && [".jpg", ".jpeg", ".png", ".webp", ".gif"].includes(extname(name).toLowerCase());
}

export async function normalizeProductImage(file: File, maxSizeBytes = maxImageSizeBytes, rotation: 0 | 90 | 180 | 270 = 0): Promise<Buffer> {
  if (!file.size || file.size > maxSizeBytes || !isAllowedProductImageType(file.name, file.type)) {
    throw new Error(`Image invalide : JPG, PNG, WebP ou GIF, ${maxSizeBytes / (1024 * 1024)} Mo maximum.`);
  }
  const source = Buffer.from(await file.arrayBuffer());
  const decoder = sharp(source, { failOn: "warning", limitInputPixels: 24_000_000 });
  const metadata = await decoder.metadata();
  if (!metadata.format || !allowedFormats.has(metadata.format) || (metadata.pages ?? 1) > 1) {
    throw new Error("Utilisez une image fixe JPG, PNG, WebP ou GIF valide.");
  }
  // Decode pixels and discard metadata and trailing content before publication.
  const pipeline = decoder.autoOrient();
  if (rotation) pipeline.rotate(rotation);
  const normalized = await pipeline.resize({ width: 2400, height: 2400, fit: "inside", withoutEnlargement: true }).webp({ quality: 88 }).toBuffer();
  if (normalized.length > maxSizeBytes) throw new Error("Image convertie trop volumineuse.");
  return normalized;
}

export async function storeProductImages(productName: string, uploads: ProductImageUploadInput[]): Promise<ProductStoredImageInput[]> {
  if (uploads.length > 6) throw new Error("Six images maximum.");
  const results: ProductStoredImageInput[] = [];
  // Sequential decoding bounds peak memory use.
  for (const upload of uploads) {
    const buffer = await normalizeProductImage(upload.file, maxImageSizeBytes, upload.rotation ?? 0);
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
        headers: { ...supabaseServiceHeaders(apiKey), "Content-Type": "image/webp", "x-upsert": "false", "Cache-Control": "max-age=31536000" }
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

export async function rotateStoredProductImage(image: { bucket: string; path: string }, productName: string): Promise<ProductStoredImageInput> {
  let source: Buffer;
  if (image.bucket === "local-public") {
    if (!image.path.startsWith("/uploads/")) throw new Error("Chemin d'image invalide.");
    const objectPath = image.path.slice("/uploads/".length);
    if (!productPathPattern.test(objectPath)) throw new Error("Chemin d'image invalide.");
    const filePath = join(process.cwd(), "public", "uploads", ...objectPath.split("/"));
    if ((await stat(filePath)).size > maxImageSizeBytes) throw new Error("Image trop volumineuse.");
    source = await readFile(filePath);
  } else {
    const apiKey = process.env.SUPABASE_SECRET_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY;
    const projectUrl = (process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL ?? "").replace(/\/rest\/v1\/?$/u, "").replace(/\/+$/u, "");
    if (!apiKey || !projectUrl.startsWith("https://")) throw new Error("Stockage images non configuré.");
    const publicPrefix = `${projectUrl}/storage/v1/object/public/${encodeURIComponent(image.bucket)}/`;
    if (!image.path.startsWith(publicPrefix)) throw new Error("Chemin d'image invalide.");
    const objectPath = image.path.slice(publicPrefix.length);
    if (!productPathPattern.test(objectPath)) throw new Error("Chemin d'image invalide.");
    const response = await fetch(`${projectUrl}/storage/v1/object/${encodeURIComponent(image.bucket)}/${objectPath}`, {
      headers: supabaseServiceHeaders(apiKey), cache: "no-store"
    });
    if (!response.ok || !response.body) throw new Error("Image introuvable dans le stockage.");
    const chunks: Uint8Array[] = [];
    let size = 0;
    const reader = response.body.getReader();
    for (;;) {
      const next = await reader.read();
      if (next.done) break;
      size += next.value.byteLength;
      if (size > maxImageSizeBytes) { await reader.cancel(); throw new Error("Image trop volumineuse."); }
      chunks.push(next.value);
    }
    source = Buffer.concat(chunks);
  }
  const file = new File([new Uint8Array(source)], "rotation.webp", { type: "image/webp" });
  const [rotated] = await storeProductImages(productName, [{ file, isPrimary: false, position: 0, rotation: 90 }]);
  return rotated;
}

export async function removeStoredProductImage(image: { bucket: string; path: string }): Promise<boolean> {
  if (image.bucket === "local-public") {
    if (!image.path.startsWith("/uploads/")) return false;
    const objectPath = image.path.slice("/uploads/".length);
    if (!productPathPattern.test(objectPath)) return false;
    try {
      await unlink(join(process.cwd(), "public", "uploads", ...objectPath.split("/")));
      return true;
    } catch (error) {
      return (error as NodeJS.ErrnoException).code === "ENOENT";
    }
  }

  const apiKey = process.env.SUPABASE_SECRET_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY;
  const projectUrl = (process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL ?? "").replace(/\/rest\/v1\/?$/u, "").replace(/\/+$/u, "");
  if (!apiKey || !projectUrl.startsWith("https://")) return false;
  const publicPrefix = `${projectUrl}/storage/v1/object/public/${encodeURIComponent(image.bucket)}/`;
  if (!image.path.startsWith(publicPrefix)) return false;
  const objectPath = image.path.slice(publicPrefix.length);
  if (!productPathPattern.test(objectPath)) return false;
  const response = await fetch(`${projectUrl}/storage/v1/object/${encodeURIComponent(image.bucket)}`, {
    method: "DELETE",
    cache: "no-store",
    headers: { ...supabaseServiceHeaders(apiKey), "Content-Type": "application/json" },
    body: JSON.stringify({ prefixes: [objectPath] })
  });
  return response.ok;
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
