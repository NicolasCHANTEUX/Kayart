import { createHash, timingSafeEqual } from "node:crypto";
import { getInvoiceConfig } from "./invoice-config";
import { supabaseServiceHeaders } from "@/server/supabase/service-headers";

export const maxInvoicePdfBytes = 10 * 1024 * 1024;

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/iu;
const invoiceNumberPattern = /^[A-Z0-9][A-Z0-9-]{2,63}$/u;
const invoicePathPattern = /^invoices\/\d{4}\/[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}\/[A-Z0-9][A-Z0-9-]{2,63}\.pdf$/iu;
const sha256Pattern = /^[0-9a-f]{64}$/u;

type StorageErrorCode =
  | "configuration"
  | "bucket"
  | "collision"
  | "download"
  | "integrity"
  | "not-found"
  | "too-large"
  | "upload";

export class InvoiceStorageError extends Error {
  readonly code: StorageErrorCode;

  constructor(code: StorageErrorCode, message: string) {
    super(message);
    this.name = "InvoiceStorageError";
    this.code = code;
  }
}

export type StoredInvoicePdf = {
  bucket: string;
  path: string;
  sizeBytes: number;
};

export function sha256InvoicePdf(bytes: Uint8Array): string {
  return createHash("sha256").update(bytes).digest("hex");
}

export function isValidInvoiceStoragePath(path: string): boolean {
  return invoicePathPattern.test(path);
}

export async function storeInvoicePdf({
  invoiceId,
  invoiceNumber,
  issuedAt,
  bytes,
  sha256
}: {
  invoiceId: string;
  invoiceNumber: string;
  issuedAt: string | Date;
  bytes: Uint8Array;
  sha256: string;
}): Promise<StoredInvoicePdf> {
  if (!uuidPattern.test(invoiceId) || !invoiceNumberPattern.test(invoiceNumber)) {
    throw new InvoiceStorageError("configuration", "Identifiant ou numéro de facture invalide.");
  }
  assertPdfBytes(bytes, maxInvoicePdfBytes);
  if (!sha256Pattern.test(sha256) || !equalHashes(sha256InvoicePdf(bytes), sha256)) {
    throw new InvoiceStorageError("integrity", "Le hash du PDF à archiver est invalide.");
  }

  const issuedDate = parseDate(issuedAt);
  const year = new Intl.DateTimeFormat("en", { timeZone: "Europe/Paris", year: "numeric" }).format(issuedDate);
  const path = `invoices/${year}/${invoiceId.toLowerCase()}/${invoiceNumber}.pdf`;
  if (!isValidInvoiceStoragePath(path)) throw new InvoiceStorageError("configuration", "Chemin de facture invalide.");

  const config = storageConfig();
  await assertPrivateInvoiceBucket(config, bytes.byteLength);
  const response = await fetch(objectUrl(config, path, false), {
    method: "POST",
    cache: "no-store",
    redirect: "error",
    signal: AbortSignal.timeout(15_000),
    headers: {
      ...config.headers,
      "Cache-Control": "no-store",
      "Content-Type": "application/pdf",
      "x-upsert": "false"
    },
    body: Uint8Array.from(bytes).buffer
  }).catch(() => null);

  if (!response?.ok) {
    const existing = await readExistingForRecovery(config, path);
    if (!existing) throw new InvoiceStorageError("upload", "Archivage de la facture indisponible.");
    if (!equalHashes(sha256InvoicePdf(existing), sha256)) {
      throw new InvoiceStorageError("collision", "Un objet différent existe déjà à cet emplacement.");
    }
    return { bucket: config.bucket, path, sizeBytes: existing.byteLength };
  }

  const stored = await readInvoicePdf({ bucket: config.bucket, path, maxBytes: bytes.byteLength });
  if (stored.byteLength !== bytes.byteLength || !equalHashes(sha256InvoicePdf(stored), sha256)) {
    throw new InvoiceStorageError("integrity", "Le PDF relu après archivage ne correspond pas à l'original.");
  }
  return { bucket: config.bucket, path, sizeBytes: stored.byteLength };
}

export async function readInvoicePdf({
  bucket,
  path,
  maxBytes = maxInvoicePdfBytes
}: {
  bucket: string;
  path: string;
  maxBytes?: number;
}): Promise<Uint8Array> {
  if (!isValidInvoiceStoragePath(path)) throw new InvoiceStorageError("configuration", "Chemin de facture invalide.");
  if (!Number.isSafeInteger(maxBytes) || maxBytes <= 0 || maxBytes > maxInvoicePdfBytes) {
    throw new InvoiceStorageError("configuration", "Limite de téléchargement invalide.");
  }
  const config = storageConfig();
  if (bucket !== config.bucket) throw new InvoiceStorageError("configuration", "Bucket de facture inattendu.");
  await assertPrivateInvoiceBucket(config);
  const response = await fetch(objectUrl(config, path, true), {
    cache: "no-store",
    redirect: "error",
    signal: AbortSignal.timeout(15_000),
    headers: config.headers
  }).catch(() => null);
  if (!response) throw new InvoiceStorageError("download", "Lecture de la facture indisponible.");
  if (response.status === 404) throw new InvoiceStorageError("not-found", "Facture archivée introuvable.");
  if (!response.ok || !response.body) throw new InvoiceStorageError("download", "Lecture de la facture indisponible.");
  const contentType = response.headers.get("content-type")?.split(";", 1)[0]?.trim().toLowerCase();
  if (contentType !== "application/pdf") throw new InvoiceStorageError("integrity", "Type de document archivé invalide.");
  const bytes = await readBoundedBody(response, maxBytes);
  assertPdfBytes(bytes, maxBytes);
  return bytes;
}

type StorageConfig = {
  url: string;
  bucket: string;
  headers: Record<string, string>;
};

function storageConfig(): StorageConfig {
  const url = (process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || "")
    .replace(/\/rest\/v1\/?$/u, "")
    .replace(/\/+$/u, "");
  const key = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
  const bucket = getInvoiceConfig().storageBucket;
  if (!url.startsWith("https://") || !key || !bucket) {
    throw new InvoiceStorageError("configuration", "Stockage privé des factures non configuré.");
  }
  return { url, bucket, headers: supabaseServiceHeaders(key) };
}

async function assertPrivateInvoiceBucket(config: StorageConfig, requiredBytes = 0) {
  const response = await fetch(`${config.url}/storage/v1/bucket/${encodeURIComponent(config.bucket)}`, {
    cache: "no-store",
    redirect: "error",
    signal: AbortSignal.timeout(10_000),
    headers: config.headers
  }).catch(() => null);
  if (!response?.ok) throw new InvoiceStorageError("bucket", "Bucket privé des factures indisponible.");
  const metadata = await response.json().catch(() => null) as {
    public?: unknown;
    file_size_limit?: unknown;
    allowed_mime_types?: unknown;
  } | null;
  if (!metadata || metadata.public !== false) {
    throw new InvoiceStorageError("bucket", "Le bucket des factures doit être privé.");
  }
  const allowed = metadata.allowed_mime_types;
  if (Array.isArray(allowed) && !allowed.includes("application/pdf")) {
    throw new InvoiceStorageError("bucket", "Le bucket des factures doit autoriser application/pdf.");
  }
  const limit = Number(metadata.file_size_limit);
  if (requiredBytes > 0 && Number.isFinite(limit) && limit < requiredBytes) {
    throw new InvoiceStorageError("too-large", "Le PDF dépasse la limite du bucket.");
  }
}

async function readExistingForRecovery(config: StorageConfig, path: string) {
  try {
    return await readInvoicePdf({ bucket: config.bucket, path });
  } catch (error) {
    if (error instanceof InvoiceStorageError && error.code === "not-found") return null;
    if (error instanceof InvoiceStorageError && error.code === "integrity") throw error;
    return null;
  }
}

async function readBoundedBody(response: Response, maxBytes: number): Promise<Uint8Array> {
  const declaredLength = Number(response.headers.get("content-length"));
  if (Number.isFinite(declaredLength) && declaredLength > maxBytes) {
    await response.body?.cancel().catch(() => undefined);
    throw new InvoiceStorageError("too-large", "PDF archivé trop volumineux.");
  }
  const reader = response.body!.getReader();
  const chunks: Uint8Array[] = [];
  let size = 0;
  for (;;) {
    const next = await reader.read();
    if (next.done) break;
    size += next.value.byteLength;
    if (size > maxBytes) {
      await reader.cancel().catch(() => undefined);
      throw new InvoiceStorageError("too-large", "PDF archivé trop volumineux.");
    }
    chunks.push(next.value);
  }
  const bytes = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return bytes;
}

function objectUrl(config: StorageConfig, path: string, authenticated: boolean) {
  const encodedPath = path.split("/").map(encodeURIComponent).join("/");
  return `${config.url}/storage/v1/object/${authenticated ? "authenticated/" : ""}${encodeURIComponent(config.bucket)}/${encodedPath}`;
}

function assertPdfBytes(bytes: Uint8Array, limit: number) {
  if (!(bytes instanceof Uint8Array) || bytes.byteLength < 8) {
    throw new InvoiceStorageError("integrity", "Document PDF vide ou invalide.");
  }
  if (bytes.byteLength > limit) throw new InvoiceStorageError("too-large", "PDF trop volumineux.");
  const header = new TextDecoder("ascii").decode(bytes.subarray(0, 5));
  const trailer = new TextDecoder("ascii").decode(bytes.subarray(Math.max(0, bytes.byteLength - 1024)));
  if (header !== "%PDF-" || !trailer.includes("%%EOF")) {
    throw new InvoiceStorageError("integrity", "Signature PDF invalide.");
  }
}

function equalHashes(left: string, right: string) {
  if (!sha256Pattern.test(left) || !sha256Pattern.test(right)) return false;
  return timingSafeEqual(Buffer.from(left, "hex"), Buffer.from(right, "hex"));
}

function parseDate(value: string | Date) {
  const date = value instanceof Date ? new Date(value.getTime()) : new Date(value);
  if (!Number.isFinite(date.getTime())) throw new InvoiceStorageError("configuration", "Date d'émission invalide.");
  return date;
}

