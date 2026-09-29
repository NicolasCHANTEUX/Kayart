import { getCurrentAuthSession } from "@/server/auth/session";
import { getPrismaClient } from "@/server/db/prisma";
import {
  InvoiceStorageError,
  isValidInvoiceStoragePath,
  maxInvoicePdfBytes,
  readInvoicePdf,
  sha256InvoicePdf
} from "@/server/invoicing/invoice-storage";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/iu;
const sha256Pattern = /^[0-9a-f]{64}$/u;

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getCurrentAuthSession();
  if (session?.role !== "admin") return privateText("Connexion administrateur requise.", 401);

  const { id } = await params;
  if (!uuidPattern.test(id)) return privateText("Facture introuvable.", 404);

  const invoice = await getPrismaClient().invoice.findUnique({
    where: { id },
    select: {
      archiveStatus: true,
      invoiceNumber: true,
      pdfSha256: true,
      pdfSizeBytes: true,
      storageBucket: true,
      storagePath: true
    }
  });
  if (!invoice) return privateText("Facture introuvable.", 404);
  if (
    invoice.archiveStatus !== "ready"
    || !invoice.storageBucket
    || !invoice.storagePath
    || !isValidInvoiceStoragePath(invoice.storagePath)
    || !invoice.pdfSha256
    || !sha256Pattern.test(invoice.pdfSha256)
    || !invoice.pdfSizeBytes
    || invoice.pdfSizeBytes > maxInvoicePdfBytes
  ) {
    return privateText("L'archive PDF de cette facture n'est pas disponible.", 409);
  }

  try {
    const bytes = await readInvoicePdf({
      bucket: invoice.storageBucket,
      path: invoice.storagePath,
      maxBytes: invoice.pdfSizeBytes
    });
    if (bytes.byteLength !== invoice.pdfSizeBytes || sha256InvoicePdf(bytes) !== invoice.pdfSha256) {
      return privateText("L'intégrité de l'archive PDF n'a pas pu être vérifiée.", 502);
    }
    const filename = `${safeFilename(invoice.invoiceNumber)}.pdf`;
    return new Response(Uint8Array.from(bytes).buffer, {
      status: 200,
      headers: {
        "Cache-Control": "private, no-store, max-age=0",
        "Content-Disposition": `attachment; filename="${filename}"; filename*=UTF-8''${encodeURIComponent(filename)}`,
        "Content-Length": String(bytes.byteLength),
        "Content-Security-Policy": "sandbox",
        "Content-Type": "application/pdf",
        "Expires": "0",
        "Pragma": "no-cache",
        "X-Content-Type-Options": "nosniff",
        "X-Robots-Tag": "noindex, nofollow"
      }
    });
  } catch (error) {
    if (error instanceof InvoiceStorageError && error.code === "not-found") return privateText("Archive PDF introuvable.", 404);
    if (error instanceof InvoiceStorageError && ["integrity", "too-large", "collision"].includes(error.code)) {
      return privateText("L'intégrité de l'archive PDF n'a pas pu être vérifiée.", 502);
    }
    return privateText("Le stockage privé des factures est momentanément indisponible.", 503);
  }
}

function privateText(message: string, status: number) {
  return new Response(message, {
    status,
    headers: {
      "Cache-Control": "private, no-store, max-age=0",
      "Content-Type": "text/plain; charset=utf-8",
      "X-Content-Type-Options": "nosniff",
      "X-Robots-Tag": "noindex, nofollow"
    }
  });
}

function safeFilename(invoiceNumber: string) {
  const normalized = invoiceNumber.normalize("NFKD").replace(/[^A-Za-z0-9-]/gu, "-").replace(/-+/gu, "-").slice(0, 80);
  return normalized || "facture";
}

