import { ProductFormError, type ProductUpdateInput } from "./catalog.input";

type ExistingImage = { id: string; position: number; isPrimary: boolean };

export function planProductImages(existing: ExistingImage[], input: ProductUpdateInput) {
  const fail = (message: string): never => { throw new ProductFormError({ images: message }); };
  const ids = new Set(existing.map(image => image.id));
  if (input.deletedImageIds.some(id => !ids.has(id))) fail("Les images ont changé. Rechargez la fiche avant de réessayer.");
  const remaining = existing.filter(image => !input.deletedImageIds.includes(image.id)).sort((a, b) => a.position - b.position || a.id.localeCompare(b.id));
  if (remaining.length + input.images.length > 6) fail("Un produit peut recevoir 6 images maximum, images conservées comprises.");
  const order = input.imageOrder ?? remaining.map(image => image.id);
  if (order.length !== remaining.length || new Set(order).size !== order.length || order.some(id => !remaining.some(image => image.id === id))) {
    fail("L’ordre des images est invalide ou la fiche a changé. Rechargez la page.");
  }
  const requestedCover = input.coverImageId;
  if (requestedCover === "new" && !input.images.length) fail("Ajoutez une nouvelle image pour la choisir comme couverture.");
  if (requestedCover && requestedCover !== "new" && !order.includes(requestedCover)) fail("La couverture doit être une image conservée de ce produit.");
  const cover = requestedCover ?? remaining.find(image => image.isPrimary)?.id ?? (input.images.length ? "new" : order[0]);
  const newCoverIndex = Math.max(0, input.images.findIndex(image => image.isPrimary));
  return {
    existing: order.map((id, position) => ({ id, position, isPrimary: id === cover })),
    added: input.images.map((image, index) => ({ ...image, position: order.length + index, isPrimary: cover === "new" && index === newCoverIndex }))
  };
}
