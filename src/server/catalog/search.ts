import type { Prisma, OrderStatus } from "@prisma/client";
import { getPrismaClient } from "@/server/db/prisma";
import { getCatalogRepository, productInclude } from "./catalog.repository";
import { mapAppAvailabilityForPrisma, mapPrismaAdminOrder, mapPrismaProduct, mapPublicPrismaProduct } from "./catalog.mapper";
import { stockCategory } from "@/lib/product-stock";
import { productAvailabilityLabels, productAvailabilityValues, productConditionLabels, productConditionValues } from "@/lib/catalog";
import { requireAdminSession } from "@/server/auth/session";
import { queryPage, queryText, type ListParams } from "@/lib/list-query";
import type { Category, Product } from "@/types/catalog";
const visible: Prisma.ProductWhereInput = { publishedAt: { not: null }, availability: { notIn: ["archived", "draft", "unavailable"] } };
const deliveryLabels = { shippable: "Expédiable", pickupOnly: "Retrait atelier", quote: "Sur devis" } as const;

function textValues(product: Product, category?: Category, primaryOnly = false) {
  const base = product.baseProduct;
  const primary = [product.name, product.sku, product.slug, base?.name, base?.sku, base?.slug];
  return (primaryOnly ? primary : [
    ...primary,
    product.shortDescription, product.description, product.defectDescription,
    product.categoryName, category?.name, category?.slug, category?.description,
    productConditionLabels[product.condition], productAvailabilityLabels[product.availability],
    product.deliveryMode && deliveryLabels[product.deliveryMode],
    product.isReservable && "Réservable", product.isCustomizable && "Personnalisable",
    ...(product.attributes ?? []).flatMap(attribute => [attribute.label, attribute.value, attribute.unit]),
    ...(product.images ?? []).map(image => image.altText),
    ...(base ? [
      base.shortDescription, base.description, base.categoryName,
      ...(base.attributes ?? []).flatMap(attribute => [attribute.label, attribute.value, attribute.unit]),
      ...(base.images ?? []).map(image => image.altText)
    ] : [])
  ]).filter((value): value is string => typeof value === "string" && value.length > 0);
}

function productTextConditions(term: string): Prisma.ProductWhereInput[] {
  const contains = { contains: term, mode: "insensitive" as const };
  const fields: Prisma.ProductWhereInput[] = [
    { name: contains }, { sku: contains }, { slug: contains }
  ];
  if (term.length < 2) return fields;
  fields.push(
    { shortDescription: contains }, { description: contains }, { defectDescription: contains },
    { category: { is: { OR: [{ name: contains }, { slug: contains }, { description: contains }] } } },
    { attributes: { some: { OR: [{ label: contains }, { value: contains }, { unit: contains }] } } },
    { images: { some: { mediaAsset: { is: { altText: contains } } } } }
  );
  const lowerTerm = term.toLocaleLowerCase("fr");
  for (const condition of productConditionValues) {
    if (condition.includes(lowerTerm) || productConditionLabels[condition].toLocaleLowerCase("fr").includes(lowerTerm)) fields.push({ condition });
  }
  for (const availability of productAvailabilityValues) {
    if (availability.includes(lowerTerm) || productAvailabilityLabels[availability].toLocaleLowerCase("fr").includes(lowerTerm)) fields.push({ availability: mapAppAvailabilityForPrisma(availability) });
  }
  for (const [mode, label] of Object.entries(deliveryLabels)) {
    if (mode.toLocaleLowerCase("fr").includes(lowerTerm) || label.toLocaleLowerCase("fr").includes(lowerTerm)) fields.push({ deliveryMode: mode });
  }
  if ("réservable".includes(lowerTerm)) fields.push({ isReservable: true });
  if ("personnalisable".includes(lowerTerm)) fields.push({ isCustomizable: true });
  return fields;
}

function shopSearchWhere(terms: string[]): Prisma.ProductWhereInput {
  return { AND: terms.map(term => {
    const fields = productTextConditions(term);
    return { OR: [...fields, { baseProduct: { is: { ...visible, OR: fields } } }] };
  }) };
}

export async function searchShop(params: ListParams) {
  const q = queryText(params, "q"), category = queryText(params, "category");
  const terms = q.split(/\s+/).filter(Boolean);
  const kind = queryText(params, "condition");
  const condition = ["new", "used", "imperfect", "service"].includes(kind) ? kind : "";
  const requestedSort = queryText(params, "sort");
  const sort = ["price-asc", "price-desc", "name"].includes(requestedSort) ? requestedSort : "recent";
  const stock = queryText(params, "stock") === "1" ? "1" : "";
  const filters = { q, category, condition, sort, stock }, size = 12;
  if (process.env.KAYART_DATA_SOURCE !== "prisma") {
    const repo = getCatalogRepository(), all = await repo.listPublishedProducts();
    const allCategories = await repo.listCategories();
    const categories = allCategories.filter(c => c.isActive && all.some(p => p.categoryId === c.id));
    const selected = allCategories.find(c => c.slug === category);
    const categoriesById = new Map(allCategories.map(item => [item.id, item]));
    const lowerTerms = terms.map(term => term.toLocaleLowerCase("fr"));
    const rows = all.filter(p => {
      if ((category && p.categoryId !== selected?.id) || (condition && p.condition !== condition) || (stock && (p.availability !== "available" || (p.stockQuantity ?? 0) <= 0))) return false;
      if (!lowerTerms.length) return true;
      const categoryRecord = categoriesById.get(p.categoryId);
      const values = textValues(p, categoryRecord).map(value => value.toLocaleLowerCase("fr"));
      const primary = textValues(p, categoryRecord, true).map(value => value.toLocaleLowerCase("fr"));
      return lowerTerms.every(term => (term.length < 2 ? primary : values).some(value => value.includes(term)));
    });
    rows.sort((a,b) => {
      if (sort.startsWith("price")) { if (a.priceCents === null && b.priceCents !== null) return 1; if (b.priceCents === null && a.priceCents !== null) return -1; return (sort === "price-asc" ? 1 : -1) * ((a.priceCents ?? 0) - (b.priceCents ?? 0)) || a.id.localeCompare(b.id); }
      return sort === "name" ? a.name.localeCompare(b.name, "fr") || a.id.localeCompare(b.id) : (b.publishedAt ?? "").localeCompare(a.publishedAt ?? "") || a.id.localeCompare(b.id);
    });
    const pages = Math.max(1, Math.ceil(rows.length / size)), page = Math.min(queryPage(params), pages);
    return { products: rows.slice((page-1)*size, page*size), total: rows.length, pages, page, filters, categories };
  }
  const where: Prisma.ProductWhereInput = { ...visible,
    ...(terms.length ? shopSearchWhere(terms) : {}),
    ...(category ? { category: { slug: category } } : {}),
    ...(condition ? { condition: condition as "new" | "used" | "imperfect" | "service" } : {}),
    ...(stock ? { availability: "available", stockQuantity: { gt: 0 } } : {})
  };
  const orderBy: Prisma.ProductOrderByWithRelationInput[] = sort.startsWith("price") ? [{ priceCents: { sort: sort === "price-asc" ? "asc" : "desc", nulls: "last" } }, { id: "asc" }] : sort === "name" ? [{ name: "asc" }, { id: "asc" }] : [{ publishedAt: "desc" }, { id: "asc" }];
  return getPrismaClient().$transaction(async tx => {
    const total = await tx.product.count({ where }), pages = Math.max(1, Math.ceil(total / size)), page = Math.min(queryPage(params), pages);
    const rows = await tx.product.findMany({ where, orderBy, include: productInclude, take: size, skip: (page-1)*size });
    const categories = await tx.category.findMany({ where: { isActive: true, products: { some: visible } }, select: { id: true, slug: true, name: true }, orderBy: [{ position: "asc" }, { name: "asc" }] });
    return { products: rows.map(mapPublicPrismaProduct), total, pages, page, filters, categories };
  }, { isolationLevel: "RepeatableRead" });
}
export async function searchAdminOrders(params: ListParams) {
  await requireAdminSession();
  const q = queryText(params, "q"), raw = queryText(params, "status");
  const status = ["pending","paid","preparing","ready","shipped","completed","cancelled","refunded"].includes(raw) ? raw as OrderStatus : undefined;
  const filters = { q, status: status ?? "" }, size = 25;
  if (process.env.KAYART_DATA_SOURCE !== "prisma") {
    const rows = (await getCatalogRepository().listAdminOrders()).filter(o => (!status || o.status === status) && (!q || [o.orderNumber,o.guestEmail,o.customerName ?? ""].some(v => v.toLowerCase().includes(q.toLowerCase()))));
    const pages = Math.max(1, Math.ceil(rows.length / size)), page = Math.min(queryPage(params), pages);
    return { orders: rows.slice((page-1)*size,page*size), total: rows.length, pages, page, filters };
  }
  const where: Prisma.OrderWhereInput = { ...(status ? { status } : {}), ...(q ? { OR: ["orderNumber","guestEmail","customerName"].map(field => ({ [field]: { contains: q, mode: "insensitive" } })) } : {}) };
  return getPrismaClient().$transaction(async tx => {
    const total = await tx.order.count({ where }), pages = Math.max(1, Math.ceil(total/size)), page = Math.min(queryPage(params),pages);
    const rows = await tx.order.findMany({ where, include: { items: true }, orderBy: [{ createdAt: "desc" }, { id: "asc" }], take: size, skip: (page-1)*size });
    return { orders: rows.map(mapPrismaAdminOrder), total, pages, page, filters };
  }, { isolationLevel: "RepeatableRead" });
}

export async function searchAdminProducts(params: ListParams) {
  await requireAdminSession();
  const search = queryText(params, "search"), category = queryText(params, "category");
  const rawCondition = queryText(params, "condition"), rawStock = queryText(params, "stock");
  const condition = ["new", "used", "imperfect", "service"].includes(rawCondition) ? rawCondition : "";
  const stock = ["out", "low", "available", "made-to-order", "service"].includes(rawStock) ? rawStock : "";
  const filters = { search, category, condition, stock }, size = 10;

  if (process.env.KAYART_DATA_SOURCE !== "prisma") {
    const rows = (await getCatalogRepository().listProducts()).filter(product =>
      (!search || [product.name, product.sku].some(value => value.toLowerCase().includes(search.toLowerCase()))) &&
      (!category || product.categoryId === category) && (!condition || product.condition === condition) &&
      (!stock || stockCategory(product) === stock)
    ).sort((a, b) => a.name.localeCompare(b.name, "fr") || a.id.localeCompare(b.id));
    const pages = Math.max(1, Math.ceil(rows.length / size)), page = Math.min(queryPage(params), pages);
    return { products: rows.slice((page - 1) * size, page * size), total: rows.length, pages, page, filters };
  }

  // Match the stock badge's precedence: service, made to order, then physical stock.
  const stockWhere: Prisma.ProductWhereInput = stock === "service" ? { condition: "service" }
    : stock === "made-to-order" ? { condition: { not: "service" }, OR: [{ availability: "madeToOrder" }, { stockQuantity: null }] }
    : stock ? {
      condition: { not: "service" }, availability: { not: "madeToOrder" },
      stockQuantity: stock === "out" ? 0 : stock === "low" ? { gt: 0, lte: 5 } : { gt: 5 }
    } : {};
  const where: Prisma.ProductWhereInput = { AND: [
    search ? { OR: [{ name: { contains: search, mode: "insensitive" } }, { sku: { contains: search, mode: "insensitive" } }] } : {},
    category ? { categoryId: category } : {},
    condition ? { condition: condition as "new" | "used" | "imperfect" | "service" } : {},
    stockWhere
  ] };
  return getPrismaClient().$transaction(async tx => {
    const total = await tx.product.count({ where }), pages = Math.max(1, Math.ceil(total / size)), page = Math.min(queryPage(params), pages);
    const rows = await tx.product.findMany({ where, orderBy: [{ name: "asc" }, { id: "asc" }], include: productInclude, take: size, skip: (page - 1) * size });
    return { products: rows.map(mapPrismaProduct), total, pages, page, filters };
  }, { isolationLevel: "RepeatableRead" });
}
