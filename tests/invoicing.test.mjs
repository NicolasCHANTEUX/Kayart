import test from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import fs from 'node:fs';
import { createRequire } from 'node:module';
import { PDFDocument } from 'pdf-lib';
import ts from 'typescript';
import { load } from './helpers/load-module.mjs';

const nativeRequire = createRequire(import.meta.url);

function loadPdfRendererInThisRealm() {
  const source = fs.readFileSync('src/server/invoicing/invoice-pdf.ts', 'utf8');
  const compiled = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true }
  }).outputText;
  const module = { exports: {} };
  Function('require', 'module', 'exports', compiled)(nativeRequire, module, module.exports);
  return module.exports;
}

const validInvoiceEnv = {
  KAYART_INVOICING_ENABLED: 'true',
  KAYART_LEGAL_APPROVED: 'true',
  KAYART_LEGAL_NAME: 'Atelier KayArt',
  KAYART_LEGAL_FORM: 'Entreprise individuelle',
  KAYART_LEGAL_ADDRESS: '8 rue des Artisans\n44000 Nantes\nFrance',
  KAYART_LEGAL_REGISTRATION: 'RCS Nantes 123 456 789',
  KAYART_LEGAL_TAX_STATEMENT: 'TVA non applicable, art. 293 B du CGI',
  KAYART_INVOICE_SIRET: '12345678901234',
  KAYART_INVOICE_TAX_REGIME: 'franchise',
  KAYART_INVOICE_OPERATION_CATEGORY: 'Vente de biens',
  KAYART_INVOICE_PAYMENT_TERMS: 'Paiement comptant - facture acquittée',
  KAYART_INVOICE_LEGAL_NOTICES: 'Garantie légale applicable selon les dispositions en vigueur.',
  SUPABASE_INVOICE_BUCKET: 'invoices'
};

function invoiceOrder(overrides = {}) {
  const itemId = randomUUID();
  return {
    id: randomUUID(),
    orderNumber: 'MAN-20260929-FIXTURE',
    isTest: false,
    status: 'paid',
    paymentStatus: 'paid',
    paidAt: new Date('2026-09-29T12:34:00.000Z'),
    currency: 'EUR',
    customerName: 'Nicolas Dupont',
    guestEmail: 'nicolas@example.test',
    billingAddress: { name: 'Nicolas Dupont', line1: '4 rue du Test', postalCode: '75001', city: 'Paris', country: 'FR' },
    shippingAddress: null,
    subtotalCents: 2400,
    shippingCents: 0,
    totalCents: 2400,
    stripePaymentIntentId: null,
    items: [{ id: itemId, orderId: 'unused', productId: null, productName: 'Pagaie carbone', productSku: 'PAG-001', quantity: 2, unitPriceCents: 1200, totalCents: 2400, createdAt: new Date() }],
    ...overrides
  };
}

test('invoice configuration is explicit, prefixed and rejects placeholder legal identities', () => {
  const ready = load('src/server/invoicing/invoice-config.ts', {}, validInvoiceEnv).getInvoiceConfig();
  assert.equal(ready.ready, true);
  assert.equal(ready.tax.regime, 'franchise');
  assert.equal(ready.tax.rateBps, null);

  const unprefixed = load('src/server/invoicing/invoice-config.ts', {}, {
    ...validInvoiceEnv,
    KAYART_INVOICE_TAX_REGIME: '',
    TAX_REGIME: 'franchise'
  }).getInvoiceConfig();
  assert.equal(unprefixed.ready, false);
  assert.ok(unprefixed.missing.includes('KAYART_INVOICE_TAX_REGIME'));

  const placeholder = load('src/server/invoicing/invoice-config.ts', {}, {
    ...validInvoiceEnv,
    KAYART_LEGAL_NAME: 'KayArt SARL',
    KAYART_LEGAL_REGISTRATION: '000 000 000 00000'
  }).getInvoiceConfig();
  assert.equal(placeholder.ready, false);
  assert.ok(placeholder.missing.includes('KAYART_LEGAL_NAME'));
});

test('invoice eligibility refuses tests and incomplete buyers before allocating a number', () => {
  const service = load('src/server/invoicing/invoice-service.ts', {}, validInvoiceEnv);
  assert.equal(service.getInvoiceEligibility(invoiceOrder()).eligible, true);
  assert.match(service.getInvoiceEligibility(invoiceOrder({ isTest: true })).reason, /test/i);
  assert.match(service.getInvoiceEligibility(invoiceOrder({ billingAddress: null })).reason, /adresse/i);
  assert.match(service.getInvoiceEligibility(invoiceOrder({ paymentStatus: 'pending', paidAt: null })).reason, /payée|paiement/i);
});

test('tax snapshots derive HT from configured TTC values without inventing VAT', () => {
  const franchiseService = load('src/server/invoicing/invoice-service.ts', {}, validInvoiceEnv);
  const franchise = franchiseService.buildInvoiceSnapshots(invoiceOrder());
  assert.equal(franchise.totals.totalExclTaxCents, 2400);
  assert.equal(franchise.totals.taxCents, 0);
  assert.equal(franchise.lines[0].taxRateBps, null);

  const vatService = load('src/server/invoicing/invoice-service.ts', {}, {
    ...validInvoiceEnv,
    KAYART_INVOICE_TAX_REGIME: 'vat',
    KAYART_INVOICE_VAT_NUMBER: 'FR12123456789',
    KAYART_INVOICE_VAT_RATE_BPS: '2000',
    KAYART_LEGAL_TAX_STATEMENT: 'TVA française au taux normal.'
  });
  const vat = vatService.buildInvoiceSnapshots(invoiceOrder({ shippingCents: 600, totalCents: 3000 }));
  assert.equal(vat.totals.subtotalExclTaxCents, 2000);
  assert.equal(vat.totals.shippingExclTaxCents, 500);
  assert.equal(vat.totals.taxCents, 500);
  assert.equal(vat.lines[0].taxRateBps, 2000);
});

test('a failed archive retry keeps the same invoice number and immutable snapshots', async () => {
  const order = invoiceOrder({ id: randomUUID() });
  const actorUserId = randomUUID();
  let invoice = null;
  let sequenceUpdates = 0;
  let rawCall = 0;
  let storeCalls = 0;
  const audits = [];
  const tx = {
    invoice: {
      findUnique: async () => invoice,
      create: async ({ data }) => {
        invoice = { id: randomUUID(), ...data, archiveStatus: 'pending', storageBucket: null, storagePath: null, pdfSha256: null, pdfSizeBytes: null, archivedAt: null, createdAt: new Date(), updatedAt: new Date() };
        return invoice;
      },
      updateMany: async ({ data }) => { if (!invoice || invoice.archiveStatus === 'ready') return { count: 0 }; Object.assign(invoice, data); return { count: 1 }; },
      findUniqueOrThrow: async () => invoice
    },
    order: { findUnique: async () => order },
    invoiceSequence: {
      upsert: async () => ({}),
      update: async () => { sequenceUpdates++; return {}; }
    },
    auditLog: { create: async ({ data }) => { audits.push(data); return data; } },
    $queryRaw: async () => rawCall++ === 0
      ? [{ currentYear: 2026, lastNumber: 41 }]
      : [{ issuedAt: new Date('2026-09-29T14:00:00.000Z'), issueYear: 2026 }]
  };
  const prisma = {
    invoice: tx.invoice,
    auditLog: tx.auditLog,
    $transaction: async (operation) => operation(tx)
  };
  const service = load('src/server/invoicing/invoice-service.ts', {
    '@/server/db/prisma': { getPrismaClient: () => prisma },
    '@/server/checkout/transactions': { checkoutTransaction: async (operation) => operation(tx) },
    './invoice-config': { getInvoiceConfig: () => ({
      enabled: true, ready: true, missing: [], storageBucket: 'invoices',
      seller: { legalName: 'Atelier KayArt', legalForm: 'EI', addressLines: ['Nantes'], registration: 'RCS 123', siret: '12345678901234' },
      tax: { regime: 'franchise', rateBps: null, statement: 'TVA non applicable, art. 293 B du CGI' },
      operationCategory: 'Vente de biens', paymentTerms: 'Comptant', legalNotices: 'Garantie légale.'
    }) },
    './invoice-pdf': { renderInvoicePdf: async () => Uint8Array.from([37, 80, 68, 70, 45, 49, 10, 37, 37, 69, 79, 70]) },
    './invoice-storage': { storeInvoicePdf: async ({ bytes }) => {
      storeCalls++;
      if (storeCalls === 1) throw new Error('storage unavailable');
      return { bucket: 'invoices', path: `invoices/2026/${invoice.id}/${invoice.invoiceNumber}.pdf`, sizeBytes: bytes.byteLength };
    } }
  }, validInvoiceEnv);

  await assert.rejects(service.issueInvoice(order.id, actorUserId), /FA-2026-000042/);
  assert.equal(invoice.invoiceNumber, 'FA-2026-000042');
  assert.equal(invoice.archiveStatus, 'failed');
  const sellerSnapshot = JSON.stringify(invoice.sellerSnapshot);

  const result = await service.issueInvoice(order.id, actorUserId);
  assert.equal(result.invoiceNumber, 'FA-2026-000042');
  assert.equal(result.archiveStatus, 'ready');
  assert.equal(JSON.stringify(result.sellerSnapshot), sellerSnapshot);
  assert.equal(sequenceUpdates, 1);
  assert.equal(storeCalls, 2);
  assert.ok(audits.some((entry) => entry.action === 'invoice.issued'));
  assert.ok(audits.some((entry) => entry.action === 'invoice.archived'));
});

test('PDF rendering is deterministic and preserves canonical metadata', async () => {
  const { renderInvoicePdf } = loadPdfRendererInThisRealm();
  const input = {
    invoiceNumber: 'FA-2026-000042', orderNumber: 'KA-2026-0042',
    issuedAt: '2026-09-29T14:32:00.000Z', saleDate: '2026-09-29T14:30:00.000Z', currency: 'EUR',
    subtotalExclTaxCents: 33900, shippingExclTaxCents: 1290, totalExclTaxCents: 35190, taxCents: 0, totalInclTaxCents: 35190,
    sellerSnapshot: { legalName: 'Atelier KayArt', legalForm: 'Entreprise individuelle', addressLines: ['8 rue des Artisans', '44000 Nantes', 'France'], registration: 'RCS Nantes 123 456 789', siret: '12345678901234', commercialName: 'KayArt' },
    buyerSnapshot: { name: 'Nicolas Dupont', email: 'nicolas@example.test', billingAddress: { name: 'Nicolas Dupont', line1: '4 rue du Test', postalCode: '75001', city: 'Paris', country: 'FR' } },
    linesSnapshot: [
      { reference: 'PAG-001', description: 'Pagaie carbone', quantity: 1, unitPriceExclTaxCents: 18900, taxRateBps: null, totalExclTaxCents: 18900, taxCents: 0, totalInclTaxCents: 18900 },
      { reference: 'SIE-003', description: 'Siège carbone', quantity: 2, unitPriceExclTaxCents: 7500, taxRateBps: null, totalExclTaxCents: 15000, taxCents: 0, totalInclTaxCents: 15000 }
    ],
    taxSnapshot: { regime: 'franchise', statement: 'TVA non applicable, art. 293 B du CGI', operationCategory: 'Vente de biens', legalNotices: 'Garantie légale applicable selon les dispositions en vigueur.', breakdown: [{ label: 'TVA non applicable', rateBps: null, baseCents: 35190, taxCents: 0 }] },
    paymentSnapshot: { method: 'Paiement enregistré manuellement', paidAt: '2026-09-29T14:31:00.000Z', dueDate: '2026-09-29T14:31:00.000Z', terms: 'Paiement comptant - facture acquittée' }
  };
  const first = await renderInvoicePdf(input);
  const second = await renderInvoicePdf(structuredClone(input));
  assert.equal(Buffer.from(first).equals(Buffer.from(second)), true);
  assert.equal(Buffer.from(first.subarray(0, 5)).toString('ascii'), '%PDF-');
  const parsed = await PDFDocument.load(first);
  assert.equal(parsed.getTitle(), 'Facture FA-2026-000042');
  assert.equal(parsed.getAuthor(), 'Atelier KayArt');
  assert.ok(parsed.getPageCount() >= 1);
});

test('invoice storage paths are private, strict and hashable', () => {
  const storage = load('src/server/invoicing/invoice-storage.ts');
  const id = randomUUID();
  assert.equal(storage.isValidInvoiceStoragePath(`invoices/2026/${id}/FA-2026-000042.pdf`), true);
  for (const path of [`2026/${id}/FA-2026-000042.pdf`, `invoices/2026/../secret.pdf`, `invoices/2026/${id}/invoice.html`]) {
    assert.equal(storage.isValidInvoiceStoragePath(path), false);
  }
  assert.equal(storage.sha256InvoicePdf(Uint8Array.from([1, 2, 3])).length, 64);
});
