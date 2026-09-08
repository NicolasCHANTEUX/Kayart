import { randomUUID } from "node:crypto";
import { normalizeProductImage } from "@/server/catalog/product-image-storage";

export type PrivateRequestImage = { path: string; sizeBytes: number; originalFilename: string };
export function requestStorageConfig() {
  const url = (process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || "").replace(/\/rest\/v1\/?$/, "").replace(/\/+$/, "");
  const key = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url.startsWith("https://") || !key) throw new Error("Private request storage not configured.");
  return { url, bucket: "request-images", headers: { apikey: key, Authorization: `Bearer ${key}` } };
}
export async function storePrivateRequestImages(files: File[]): Promise<PrivateRequestImage[]> {
  if (!files.length) return [];
  if (files.length > 3 || files.some(file => file.size > 1024 * 1024)) throw new Error("Invalid attachment sizes.");
  const config = requestStorageConfig();
  const stored: PrivateRequestImage[] = [];
  try {
    // Check the bucket before sending any customer photo; never publish it accidentally.
    const bucket = await fetch(`${config.url}/storage/v1/bucket/${config.bucket}`, { headers: config.headers, cache: "no-store" });
    if (!bucket.ok || (await bucket.json()).public !== false) throw new Error("Private bucket required.");
    for (const file of files) {
      const buffer = await normalizeProductImage(file);
      const path = `requests/${randomUUID()}.webp`;
      const response = await fetch(`${config.url}/storage/v1/object/${config.bucket}/${path}`, { method: "POST", cache: "no-store", headers: { ...config.headers, "Content-Type": "image/webp", "x-upsert": "false" }, body: new Uint8Array(buffer) });
      if (!response.ok) throw new Error("Private upload failed.");
      stored.push({ path, sizeBytes: buffer.length, originalFilename: file.name.slice(0, 255) });
    }
    return stored;
  } catch (error) { await removePrivateRequestImages(stored); throw error; }
}
export async function removePrivateRequestImages(images: PrivateRequestImage[]) {
  if (!images.length) return;
  const config = requestStorageConfig();
  await fetch(`${config.url}/storage/v1/object/${config.bucket}`, { method: "DELETE", headers: { ...config.headers, "Content-Type": "application/json" }, body: JSON.stringify({ prefixes: images.map(image => image.path) }) }).catch(() => {});
}
