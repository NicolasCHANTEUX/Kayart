import { requireAdminSession } from "@/server/auth/session";
import { getPrismaClient } from "@/server/db/prisma";
import { removeStoredProductImage, rotateStoredProductImage } from "./product-image-storage";

export async function rotateExistingProductImage(input: { productId: string; imageId: string }) {
  await requireAdminSession();
  const prisma = getPrismaClient();
  const current = await prisma.productImage.findFirst({
    where: { id: input.imageId, productId: input.productId },
    include: { mediaAsset: true, product: { select: { name: true, slug: true } } }
  });
  if (!current) throw new Error("Image introuvable sur ce produit.");

  // Write a new object so any other reference to the original keeps its orientation.
  const rotated = await rotateStoredProductImage(current.mediaAsset, current.product.name);
  try {
    const oldAssetIsOrphaned = await prisma.$transaction(async tx => {
      const asset = await tx.mediaAsset.create({
        data: {
          bucket: rotated.bucket,
          path: rotated.path,
          mimeType: rotated.mimeType,
          sizeBytes: rotated.sizeBytes,
          originalFilename: current.mediaAsset.originalFilename,
          altText: current.mediaAsset.altText,
          visibility: "public"
        }
      });
      const updated = await tx.productImage.updateMany({
        where: { id: input.imageId, productId: input.productId, mediaAssetId: current.mediaAssetId },
        data: { mediaAssetId: asset.id }
      });
      if (!updated.count) throw new Error("L’image a changé. Rechargez la fiche et réessayez.");
      const removed = await tx.mediaAsset.deleteMany({
        where: { id: current.mediaAssetId, productImages: { none: {} }, blogPosts: { none: {} }, requestMedia: { none: {} } }
      });
      return removed.count > 0;
    });
    if (oldAssetIsOrphaned) {
      await removeStoredProductImage(current.mediaAsset).catch(() => false);
    }
    return { url: rotated.path, slug: current.product.slug };
  } catch (error) {
    await removeStoredProductImage(rotated).catch(() => false);
    throw error;
  }
}
