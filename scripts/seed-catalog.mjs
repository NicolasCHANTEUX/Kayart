import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";

loadEnvFile(".env");
loadEnvFile(".env.local", true);

const connectionString = process.env.DIRECT_URL || process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DIRECT_URL or DATABASE_URL is required to seed the catalog.");
}

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString })
});

const categories = [
  {
    slug: "pagaies",
    name: "Pagaies",
    description: "Pieces carbone orientees performance, controle et adaptation au pratiquant.",
    position: 1,
    isActive: true
  },
  {
    slug: "occasion",
    name: "Occasion",
    description: "Materiel unique, controle et decrit avant reservation.",
    position: 2,
    isActive: true
  },
  {
    slug: "reparation",
    name: "Reparation",
    description: "Diagnostics, reparations et renovations de pieces carbone.",
    position: 3,
    isActive: true
  }
];

const products = [
  {
    slug: "pagaie-carbone-signature",
    sku: "KAY-PAG-SIGNATURE",
    name: "Pagaie carbone signature",
    categorySlug: "pagaies",
    condition: "new",
    availability: "madeToOrder",
    priceCents: null,
    compareAtPriceCents: null,
    stockQuantity: null,
    shortDescription: "Pagaie carbone technique fabriquee a la demande.",
    description:
      "Une pagaie technique pensee pour la rigidite, le controle et l'adaptation au pratiquant.",
    attributes: [
      { label: "Matiere", value: "Carbone" },
      { label: "Poids", value: "Optimise" },
      { label: "Rigidite", value: "Ajustable" },
      { label: "Fabrication", value: "Atelier" }
    ],
    isFeatured: true,
    isReservable: false,
    isCustomizable: true,
    publishedAt: new Date("2026-07-14T00:00:00.000Z")
  },
  {
    slug: "kayak-occasion-controle",
    sku: "KAY-OCC-001",
    name: "Kayak d'occasion controle",
    categorySlug: "occasion",
    condition: "used",
    availability: "available",
    priceCents: null,
    compareAtPriceCents: null,
    stockQuantity: 1,
    shortDescription: "Produit unique controle avant reservation.",
    description:
      "Materiel d'occasion photographie, verifie et decrit avec precision avant reservation.",
    attributes: [
      { label: "Type", value: "Piece unique" },
      { label: "Etat", value: "Documente" },
      { label: "Parcours", value: "Reservation" },
      { label: "Photos", value: "Detaillees" }
    ],
    isFeatured: false,
    isReservable: true,
    isCustomizable: false,
    publishedAt: new Date("2026-07-14T00:00:00.000Z")
  },
  {
    slug: "diagnostic-reparation-carbone",
    sku: "KAY-SRV-REPAIR",
    name: "Diagnostic reparation carbone",
    categorySlug: "reparation",
    condition: "service",
    availability: "available",
    priceCents: null,
    compareAtPriceCents: null,
    stockQuantity: null,
    shortDescription: "Demande de diagnostic avec photos.",
    description:
      "Analyse d'un dommage avec photos pour evaluer une reparation, renovation ou amelioration.",
    attributes: [
      { label: "Entree", value: "Photos" },
      { label: "Traitement", value: "Diagnostic" },
      { label: "Retour", value: "Reponse atelier" },
      { label: "Objectif", value: "Solution adaptee" }
    ],
    isFeatured: false,
    isReservable: false,
    isCustomizable: false,
    publishedAt: new Date("2026-07-14T00:00:00.000Z")
  }
];

try {
  for (const category of categories) {
    await prisma.category.upsert({
      create: category,
      update: category,
      where: {
        slug: category.slug
      }
    });
  }

  for (const product of products) {
    const { attributes, categorySlug, ...data } = product;
    const row = await prisma.product.upsert({
      create: {
        ...data,
        category: {
          connect: {
            slug: categorySlug
          }
        }
      },
      update: {
        ...data,
        category: {
          connect: {
            slug: categorySlug
          }
        }
      },
      where: {
        slug: product.slug
      }
    });

    await prisma.productAttribute.deleteMany({
      where: {
        productId: row.id
      }
    });

    if (attributes.length > 0) {
      await prisma.productAttribute.createMany({
        data: attributes.map((attribute, index) => ({
          productId: row.id,
          label: attribute.label,
          value: attribute.value,
          position: index
        }))
      });
    }
  }

  console.log(`Seeded ${categories.length} categories and ${products.length} products.`);
} finally {
  await prisma.$disconnect();
}

function loadEnvFile(fileName, overridePrevious = false) {
  const filePath = resolve(process.cwd(), fileName);

  if (!existsSync(filePath)) {
    return;
  }

  const lines = readFileSync(filePath, "utf8").split(/\r?\n/);

  for (const line of lines) {
    const trimmed = line.trim();

    if (!trimmed || trimmed.startsWith("#")) {
      continue;
    }

    const match = /^(?:export\s+)?([A-Z0-9_]+)\s*=\s*(.*)$/i.exec(trimmed);

    if (!match) {
      continue;
    }

    const [, key, rawValue] = match;

    if (!overridePrevious && process.env[key] !== undefined) {
      continue;
    }

    process.env[key] = parseEnvValue(rawValue ?? "");
  }
}

function parseEnvValue(value) {
  const trimmed = value.trim();
  const isDoubleQuoted = trimmed.startsWith("\"") && trimmed.endsWith("\"");
  const isSingleQuoted = trimmed.startsWith("'") && trimmed.endsWith("'");

  if (isDoubleQuoted || isSingleQuoted) {
    return trimmed.slice(1, -1);
  }

  return trimmed;
}
