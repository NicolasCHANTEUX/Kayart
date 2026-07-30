import { randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import { extname, join } from "node:path";
import { slugify } from "@/lib/slug";
import type { ProductImageUploadInput, ProductStoredImageInput } from "@/server/catalog/catalog.input";

const publicBucket = "local-public";

export async function storeProductImages(
  productSlug: string,
  productName: string,
  uploads: ProductImageUploadInput[]
): Promise<ProductStoredImageInput[]> {
  if (uploads.length === 0) {
    return [];
  }

  const directory = join(process.cwd(), "public", "uploads", "products", productSlug);
  await mkdir(directory, { recursive: true });

  return Promise.all(
    uploads.map(async (upload, index) => {
      const extension = getFileExtension(upload.file);
      const safeName = slugify(upload.file.name.replace(/\.[^.]+$/, "")) || `image-${index + 1}`;
      const fileName = `${safeName}-${randomUUID().slice(0, 8)}${extension}`;
      const filePath = join(directory, fileName);
      const buffer = Buffer.from(await upload.file.arrayBuffer());

      await writeFile(filePath, buffer);

      return {
        bucket: publicBucket,
        path: `/uploads/products/${productSlug}/${fileName}`,
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
