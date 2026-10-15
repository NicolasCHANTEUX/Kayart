type ContactProduct = {
  name: string;
  sku?: string | null;
};

export function productContactHref(product: ContactProduct) {
  const params = new URLSearchParams({ produit: product.name });

  if (product.sku) {
    params.set("reference", product.sku);
  }

  return `/contact?${params.toString()}`;
}

export function productContactSubject(productName: string, reference = "") {
  const suffix = reference ? ` (${reference})` : "";
  return `Question concernant : ${productName}${suffix}`;
}
