import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFPage } from "pdf-lib";
import type {
  InvoiceAddressSnapshot,
  InvoiceBuyerSnapshot,
  InvoiceLineSnapshot,
  InvoicePdfInput,
  InvoiceSellerSnapshot,
  InvoiceTaxBreakdownSnapshot
} from "./invoice-types";

const PAGE_WIDTH = 595.28;
const PAGE_HEIGHT = 841.89;
const MARGIN = 48;
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN * 2;
const FOOTER_TOP = 55;
const BODY_SIZE = 9;
const BODY_LINE = 12;

const colors = {
  accent: rgb(16 / 255, 91 / 255, 198 / 255),
  carbon: rgb(21 / 255, 23 / 255, 32 / 255),
  fiber: rgb(238 / 255, 239 / 255, 244 / 255),
  line: rgb(223 / 255, 225 / 255, 232 / 255),
  metal: rgb(85 / 255, 90 / 255, 106 / 255),
  paper: rgb(1, 1, 1),
  purple: rgb(136 / 255, 58 / 255, 125 / 255),
  red: rgb(200 / 255, 7 / 255, 3 / 255),
  yellow: rgb(1, 213 / 255, 0)
};

export class InvoicePdfError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "InvoicePdfError";
  }
}

export async function renderInvoicePdf(invoiceLike: InvoicePdfInput): Promise<Uint8Array> {
  const invoice = validateInvoice(invoiceLike);
  const document = await PDFDocument.create();
  const regular = await document.embedFont(StandardFonts.Helvetica);
  const bold = await document.embedFont(StandardFonts.HelveticaBold);
  assertEncodable(invoice, regular, bold);

  const issuedAt = parseDate(invoice.issuedAt, "date d'émission");
  document.setTitle(`Facture ${invoice.invoiceNumber}`);
  document.setAuthor(invoice.sellerSnapshot.legalName);
  document.setSubject(`Facture ${invoice.invoiceNumber} - commande ${invoice.orderNumber}`);
  document.setCreator("KayArt invoicing");
  document.setProducer("KayArt invoicing");
  document.setCreationDate(issuedAt);
  document.setModificationDate(issuedAt);

  const pages: PDFPage[] = [];
  let page: PDFPage;
  let y = 0;

  const addPage = (first = false) => {
    page = document.addPage();
    page.setSize(PAGE_WIDTH, PAGE_HEIGHT);
    pages.push(page);
    drawBrandStripe(page);
    if (first) {
      page.drawText("KAYART", { x: MARGIN, y: PAGE_HEIGHT - 65, size: 27, font: bold, color: colors.carbon });
      page.drawText("FACTURE", { x: PAGE_WIDTH - MARGIN - 118, y: PAGE_HEIGHT - 57, size: 18, font: bold, color: colors.carbon });
      drawRight(page, invoice.invoiceNumber, PAGE_WIDTH - MARGIN, PAGE_HEIGHT - 76, bold, 10, colors.accent);
      page.drawText(`Date d'émission : ${formatDate(invoice.issuedAt)}`, { x: MARGIN, y: PAGE_HEIGHT - 100, size: BODY_SIZE, font: regular, color: colors.metal });
      page.drawText(`Date de vente : ${formatDate(invoice.saleDate)}`, { x: MARGIN + 190, y: PAGE_HEIGHT - 100, size: BODY_SIZE, font: regular, color: colors.metal });
      drawRight(page, `Commande ${invoice.orderNumber}`, PAGE_WIDTH - MARGIN, PAGE_HEIGHT - 100, regular, BODY_SIZE, colors.metal);
      y = PAGE_HEIGHT - 130;
    } else {
      page.drawText("KAYART", { x: MARGIN, y: PAGE_HEIGHT - 47, size: 14, font: bold, color: colors.carbon });
      drawRight(page, `Facture ${invoice.invoiceNumber}`, PAGE_WIDTH - MARGIN, PAGE_HEIGHT - 47, bold, 9, colors.carbon);
      y = PAGE_HEIGHT - 72;
    }
    return page;
  };

  const ensureSpace = (height: number) => {
    if (y - height < FOOTER_TOP) addPage(false);
  };

  addPage(true);
  drawParties();
  drawLinesTable();
  drawTotals();
  drawPayment();
  drawLegalDetails();
  drawFooters();

  return document.save({ addDefaultPage: false, useObjectStreams: false, updateFieldAppearances: false });

  function drawParties() {
    const gutter = 16;
    const cardWidth = (CONTENT_WIDTH - gutter) / 2;
    const sellerLines = sellerDisplayLines(invoice.sellerSnapshot);
    const buyerLines = buyerDisplayLines(invoice.buyerSnapshot);
    const sellerWrapped = sellerLines.flatMap((line) => wrapText(line, regular, BODY_SIZE, cardWidth - 24));
    const buyerWrapped = buyerLines.flatMap((line) => wrapText(line, regular, BODY_SIZE, cardWidth - 24));
    const height = Math.max(102, 39 + Math.max(sellerWrapped.length, buyerWrapped.length) * BODY_LINE);
    ensureSpace(height + 18);
    drawCard(MARGIN, y, cardWidth, height, "VENDEUR", sellerWrapped);
    drawCard(MARGIN + cardWidth + gutter, y, cardWidth, height, "CLIENT", buyerWrapped);
    y -= height + 24;
  }

  function drawCard(x: number, top: number, width: number, height: number, title: string, lines: string[]) {
    page.drawRectangle({ x, y: top - height, width, height, color: colors.fiber, borderColor: colors.line, borderWidth: 0.6 });
    page.drawText(title, { x: x + 12, y: top - 21, size: 8, font: bold, color: colors.accent });
    let lineY = top - 39;
    lines.forEach((line, index) => {
      page.drawText(line, { x: x + 12, y: lineY, size: BODY_SIZE, font: index === 0 ? bold : regular, color: colors.carbon });
      lineY -= BODY_LINE;
    });
  }

  function drawLinesTable() {
    ensureSpace(56);
    drawSectionTitle("DÉTAIL DES PRODUITS");
    drawTableHeader();
    invoice.linesSnapshot.forEach((line, index) => drawTableLine(line, index));
    y -= 16;
  }

  function drawTableHeader() {
    const height = 24;
    ensureSpace(height + 20);
    page.drawRectangle({ x: MARGIN, y: y - height, width: CONTENT_WIDTH, height, color: colors.carbon });
    const baseline = y - 16;
    page.drawText("Réf.", { x: MARGIN + 6, y: baseline, size: 7.5, font: bold, color: colors.paper });
    page.drawText("Désignation", { x: MARGIN + 77, y: baseline, size: 7.5, font: bold, color: colors.paper });
    drawRight(page, "Qté", MARGIN + 300, baseline, bold, 7.5, colors.paper);
    drawRight(page, "PU HT", MARGIN + 369, baseline, bold, 7.5, colors.paper);
    drawRight(page, "TVA", MARGIN + 426, baseline, bold, 7.5, colors.paper);
    drawRight(page, "Total HT", MARGIN + CONTENT_WIDTH - 6, baseline, bold, 7.5, colors.paper);
    y -= height;
  }

  function drawTableLine(line: InvoiceLineSnapshot, index: number) {
    const referenceLines = wrapText(line.reference || "-", regular, 7.8, 62);
    const descriptionLines = wrapText(line.description, regular, 8.3, 184);
    const totalLineCount = Math.max(1, referenceLines.length, descriptionLines.length);
    let lineOffset = 0;
    while (lineOffset < totalLineCount) {
      const lineHeight = 11;
      const padding = 7;
      const minimumRowHeight = 29;
      let availableLines = Math.floor((y - FOOTER_TOP - padding * 2) / lineHeight);
      if (availableLines < 1) {
        addPage(false);
        drawTableHeader();
        availableLines = Math.floor((y - FOOTER_TOP - padding * 2) / lineHeight);
      }
      const linesThisPart = Math.min(totalLineCount - lineOffset, availableLines);
      const height = Math.max(minimumRowHeight, linesThisPart * lineHeight + padding * 2);
      if (y - height < FOOTER_TOP) {
        addPage(false);
        drawTableHeader();
        continue;
      }
      page.drawRectangle({
        x: MARGIN,
        y: y - height,
        width: CONTENT_WIDTH,
        height,
        color: index % 2 ? colors.paper : rgb(249 / 255, 250 / 255, 252 / 255),
        borderColor: colors.line,
        borderWidth: 0.45
      });
      [70, 260, 305, 374, 431].forEach((offset) => {
        page.drawLine({ start: { x: MARGIN + offset, y }, end: { x: MARGIN + offset, y: y - height }, thickness: 0.35, color: colors.line });
      });
      const baseline = y - padding - 8;
      for (let current = 0; current < linesThisPart; current++) {
        const absoluteLine = lineOffset + current;
        const rowY = baseline - current * lineHeight;
        const ref = referenceLines[absoluteLine];
        const description = descriptionLines[absoluteLine];
        if (ref) page.drawText(ref, { x: MARGIN + 6, y: rowY, size: 7.8, font: regular, color: colors.carbon });
        if (description) page.drawText(description, { x: MARGIN + 77, y: rowY, size: 8.3, font: regular, color: colors.carbon });
      }
      if (lineOffset === 0) {
        drawRight(page, String(line.quantity), MARGIN + 299, baseline, regular, 8.2, colors.carbon);
        drawRight(page, formatMoney(line.unitPriceExclTaxCents, invoice.currency), MARGIN + 368, baseline, regular, 8.2, colors.carbon);
        drawRight(page, formatTaxRate(line.taxRateBps), MARGIN + 425, baseline, regular, 8.2, colors.carbon);
        drawRight(page, formatMoney(line.totalExclTaxCents, invoice.currency), MARGIN + CONTENT_WIDTH - 6, baseline, bold, 8.2, colors.carbon);
      }
      y -= height;
      lineOffset += linesThisPart;
      if (lineOffset < totalLineCount) {
        addPage(false);
        drawTableHeader();
      }
    }
  }

  function drawTotals() {
    const breakdownRows = invoice.taxSnapshot.regime === "vat" ? invoice.taxSnapshot.breakdown.length : 1;
    const height = 85 + breakdownRows * 17;
    ensureSpace(height + 18);
    const width = 235;
    const x = PAGE_WIDTH - MARGIN - width;
    const top = y;
    page.drawRectangle({ x, y: top - height, width, height, color: colors.fiber, borderColor: colors.line, borderWidth: 0.6 });
    let rowY = top - 22;
    drawTotalRow("Sous-total HT", invoice.subtotalExclTaxCents, rowY);
    rowY -= 17;
    drawTotalRow("Livraison HT", invoice.shippingExclTaxCents, rowY);
    rowY -= 17;
    drawTotalRow("Total HT", invoice.totalExclTaxCents, rowY, true);
    rowY -= 17;
    if (invoice.taxSnapshot.regime === "vat") {
      invoice.taxSnapshot.breakdown.forEach((tax) => {
        drawTotalRow(`${tax.label} (${formatTaxRate(tax.rateBps)})`, tax.taxCents, rowY);
        rowY -= 17;
      });
    } else {
      drawTotalRow("TVA", 0, rowY);
      rowY -= 17;
    }
    page.drawLine({ start: { x: x + 12, y: rowY + 8 }, end: { x: x + width - 12, y: rowY + 8 }, thickness: 1, color: colors.carbon });
    page.drawText("TOTAL TTC", { x: x + 12, y: rowY - 8, size: 11, font: bold, color: colors.carbon });
    drawRight(page, formatMoney(invoice.totalInclTaxCents, invoice.currency), x + width - 12, rowY - 8, bold, 12, colors.accent);
    y -= height + 24;

    function drawTotalRow(label: string, cents: number, baseline: number, strong = false) {
      page.drawText(label, { x: x + 12, y: baseline, size: 8.5, font: strong ? bold : regular, color: colors.carbon });
      drawRight(page, formatMoney(cents, invoice.currency), x + width - 12, baseline, strong ? bold : regular, 8.5, colors.carbon);
    }
  }

  function drawPayment() {
    const paymentLines = [
      `Mode : ${invoice.paymentSnapshot.method}`,
      `Payée le : ${formatDate(invoice.paymentSnapshot.paidAt)}`,
      ...(invoice.paymentSnapshot.dueDate ? [`Échéance : ${formatDate(invoice.paymentSnapshot.dueDate)}`] : []),
      `Conditions : ${invoice.paymentSnapshot.terms}`
    ];
    drawFlowSection("PAIEMENT", paymentLines.join("\n"));
  }

  function drawLegalDetails() {
    const text = [
      `Catégorie d'opération : ${invoice.taxSnapshot.operationCategory}`,
      invoice.taxSnapshot.statement,
      invoice.taxSnapshot.legalNotices
    ].filter(Boolean).join("\n");
    drawFlowSection("MENTIONS FISCALES ET LÉGALES", text);
  }

  function drawFlowSection(title: string, text: string) {
    ensureSpace(46);
    drawSectionTitle(title);
    const lines = wrapText(text, regular, 8.3, CONTENT_WIDTH - 20);
    const padding = 10;
    let boxTop = y;
    let boxPage = page;
    let boxLineCount = 0;
    let cursorY = y - padding - 8;
    const closeBox = () => {
      const height = Math.max(30, padding * 2 + boxLineCount * 11);
      boxPage.drawRectangle({ x: MARGIN, y: boxTop - height, width: CONTENT_WIDTH, height, borderColor: colors.line, borderWidth: 0.6 });
      y = boxTop - height;
    };
    for (const line of lines) {
      if (cursorY - 11 < FOOTER_TOP) {
        closeBox();
        addPage(false);
        page.drawText(`${title} (suite)`, { x: MARGIN, y, size: 9, font: bold, color: colors.accent });
        y -= 18;
        boxTop = y;
        boxPage = page;
        boxLineCount = 0;
        cursorY = y - padding - 8;
      }
      page.drawText(line || " ", { x: MARGIN + padding, y: cursorY, size: 8.3, font: regular, color: colors.carbon });
      cursorY -= 11;
      boxLineCount += 1;
    }
    closeBox();
    y -= 18;
  }

  function drawSectionTitle(title: string) {
    page.drawText(title, { x: MARGIN, y, size: 9, font: bold, color: colors.accent });
    page.drawLine({ start: { x: MARGIN, y: y - 7 }, end: { x: PAGE_WIDTH - MARGIN, y: y - 7 }, thickness: 0.8, color: colors.line });
    y -= 22;
  }

  function drawFooters() {
    const footerName = invoice.sellerSnapshot.commercialName || invoice.sellerSnapshot.legalName;
    pages.forEach((currentPage, index) => {
      currentPage.drawLine({ start: { x: MARGIN, y: 39 }, end: { x: PAGE_WIDTH - MARGIN, y: 39 }, thickness: 0.5, color: colors.line });
      currentPage.drawText(`${footerName} - SIRET ${invoice.sellerSnapshot.siret}`, { x: MARGIN, y: 24, size: 7, font: regular, color: colors.metal });
      drawRight(currentPage, `Page ${index + 1} / ${pages.length}`, PAGE_WIDTH - MARGIN, 24, regular, 7, colors.metal);
    });
  }
}

function validateInvoice(value: InvoicePdfInput): InvoicePdfInput {
  if (!value || typeof value !== "object") throw new InvoicePdfError("Données de facture absentes.");
  requiredText(value.invoiceNumber, "numéro de facture", 80);
  requiredText(value.orderNumber, "numéro de commande", 120);
  if (!/^[A-Z]{3}$/u.test(value.currency)) throw new InvoicePdfError("Devise de facture invalide.");
  parseDate(value.issuedAt, "date d'émission");
  parseDate(value.saleDate, "date de vente");
  const amounts = [
    value.subtotalExclTaxCents,
    value.shippingExclTaxCents,
    value.totalExclTaxCents,
    value.taxCents,
    value.totalInclTaxCents
  ];
  if (amounts.some((amount) => !isCents(amount))) throw new InvoicePdfError("Montants de facture invalides.");
  if (value.totalExclTaxCents !== value.subtotalExclTaxCents + value.shippingExclTaxCents) {
    throw new InvoicePdfError("Le total HT ne correspond pas au sous-total et à la livraison.");
  }
  if (value.totalInclTaxCents !== value.totalExclTaxCents + value.taxCents) {
    throw new InvoicePdfError("Le total TTC ne correspond pas au total HT et à la TVA.");
  }
  validateSeller(value.sellerSnapshot);
  validateBuyer(value.buyerSnapshot);
  if (!Array.isArray(value.linesSnapshot) || !value.linesSnapshot.length || value.linesSnapshot.length > 500) {
    throw new InvoicePdfError("La facture doit contenir entre 1 et 500 lignes.");
  }
  value.linesSnapshot.forEach(validateLine);
  if (value.linesSnapshot.reduce((sum, line) => sum + line.totalExclTaxCents, 0) !== value.subtotalExclTaxCents) {
    throw new InvoicePdfError("Le sous-total HT ne correspond pas aux lignes.");
  }
  const tax = value.taxSnapshot;
  if (!tax || (tax.regime !== "franchise" && tax.regime !== "vat")) throw new InvoicePdfError("Régime fiscal invalide.");
  requiredText(tax.statement, "mention fiscale", 1000);
  requiredText(tax.operationCategory, "catégorie d'opération", 300);
  requiredText(tax.legalNotices, "mentions légales", 4000);
  if (!Array.isArray(tax.breakdown) || tax.breakdown.length > 20) throw new InvoicePdfError("Ventilation de TVA invalide.");
  tax.breakdown.forEach(validateTaxBreakdown);
  if (tax.regime === "vat" && !tax.breakdown.length) throw new InvoicePdfError("Ventilation de TVA manquante.");
  if (tax.regime === "franchise" && value.taxCents !== 0) throw new InvoicePdfError("Une facture en franchise ne peut pas comporter de TVA.");
  if (tax.breakdown.length) {
    if (tax.breakdown.reduce((sum, row) => sum + row.taxCents, 0) !== value.taxCents) throw new InvoicePdfError("Ventilation de TVA incohérente.");
    if (tax.regime === "vat" && tax.breakdown.reduce((sum, row) => sum + row.baseCents, 0) !== value.totalExclTaxCents) {
      throw new InvoicePdfError("Bases de TVA incohérentes.");
    }
  }
  const payment = value.paymentSnapshot;
  if (!payment) throw new InvoicePdfError("Snapshot de paiement manquant.");
  requiredText(payment.method, "mode de paiement", 200);
  requiredText(payment.terms, "conditions de paiement", 1000);
  if (!payment.paidAt) throw new InvoicePdfError("Date de paiement manquante.");
  parseDate(payment.paidAt, "date de paiement");
  if (payment.dueDate) parseDate(payment.dueDate, "date d'échéance");
  return value;
}

function validateSeller(seller: InvoiceSellerSnapshot) {
  if (!seller) throw new InvoicePdfError("Snapshot vendeur manquant.");
  requiredText(seller.legalName, "raison sociale vendeur", 240);
  requiredText(seller.legalForm, "forme juridique vendeur", 160);
  requiredText(seller.registration, "immatriculation vendeur", 500);
  if (!/^\d{14}$/u.test(seller.siret)) throw new InvoicePdfError("SIRET vendeur invalide.");
  if (!Array.isArray(seller.addressLines) || !seller.addressLines.length || seller.addressLines.length > 8) {
    throw new InvoicePdfError("Adresse vendeur invalide.");
  }
  seller.addressLines.forEach((line) => requiredText(line, "adresse vendeur", 300));
  if (seller.vatNumber) requiredText(seller.vatNumber, "numéro de TVA vendeur", 32);
  if (seller.email) requiredText(seller.email, "email vendeur", 254);
  if (seller.commercialName) requiredText(seller.commercialName, "nom commercial", 240);
}

function validateBuyer(buyer: InvoiceBuyerSnapshot) {
  if (!buyer) throw new InvoicePdfError("Snapshot client manquant.");
  requiredText(buyer.name, "nom client", 240);
  if (buyer.companyName) requiredText(buyer.companyName, "raison sociale client", 240);
  if (buyer.email) requiredText(buyer.email, "email client", 254);
  if (buyer.registration) requiredText(buyer.registration, "immatriculation client", 200);
  if (buyer.vatNumber) requiredText(buyer.vatNumber, "numéro de TVA client", 32);
  validateAddress(buyer.billingAddress, "facturation");
  if (buyer.shippingAddress) validateAddress(buyer.shippingAddress, "livraison");
}

function validateAddress(address: InvoiceAddressSnapshot, label: string) {
  if (!address) throw new InvoicePdfError(`Adresse de ${label} manquante.`);
  if (address.name) requiredText(address.name, `nom d'adresse ${label}`, 240);
  requiredText(address.line1, `adresse de ${label}`, 300);
  if (address.line2) requiredText(address.line2, `complément d'adresse ${label}`, 300);
  requiredText(address.postalCode, `code postal de ${label}`, 32);
  requiredText(address.city, `ville de ${label}`, 160);
  requiredText(address.country, `pays de ${label}`, 80);
}

function validateLine(line: InvoiceLineSnapshot) {
  if (!line) throw new InvoicePdfError("Ligne de facture invalide.");
  if (line.reference) requiredText(line.reference, "référence produit", 120);
  requiredText(line.description, "désignation produit", 1000);
  if (!Number.isSafeInteger(line.quantity) || line.quantity <= 0 || line.quantity > 1_000_000) throw new InvoicePdfError("Quantité invalide.");
  if (![line.unitPriceExclTaxCents, line.totalExclTaxCents, line.taxCents, line.totalInclTaxCents].every(isCents)) {
    throw new InvoicePdfError("Montant de ligne invalide.");
  }
  if (line.totalExclTaxCents !== line.unitPriceExclTaxCents * line.quantity) throw new InvoicePdfError("Total HT de ligne incohérent.");
  if (line.totalInclTaxCents !== line.totalExclTaxCents + line.taxCents) throw new InvoicePdfError("Total TTC de ligne incohérent.");
  if (line.taxRateBps !== null && (!Number.isSafeInteger(line.taxRateBps) || line.taxRateBps < 0 || line.taxRateBps > 10_000)) {
    throw new InvoicePdfError("Taux de TVA de ligne invalide.");
  }
}

function validateTaxBreakdown(row: InvoiceTaxBreakdownSnapshot) {
  if (!row) throw new InvoicePdfError("Ventilation de TVA invalide.");
  requiredText(row.label, "libellé de TVA", 120);
  if (![row.baseCents, row.taxCents].every(isCents)) throw new InvoicePdfError("Montant de TVA invalide.");
  if (row.rateBps !== null && (!Number.isSafeInteger(row.rateBps) || row.rateBps < 0 || row.rateBps > 10_000)) {
    throw new InvoicePdfError("Taux de TVA invalide.");
  }
}

function requiredText(value: unknown, label: string, maxLength: number): asserts value is string {
  if (typeof value !== "string" || !value.trim() || value.length > maxLength || /[\u0000-\u0009\u000b\u000c\u000e-\u001f\u007f]/u.test(value)) {
    throw new InvoicePdfError(`${label} invalide.`);
  }
}

function isCents(value: unknown): value is number {
  return Number.isSafeInteger(value) && (value as number) >= 0 && (value as number) <= 2_147_483_647;
}

function parseDate(value: string | Date, label: string) {
  const date = value instanceof Date ? new Date(value.getTime()) : new Date(value);
  if (!Number.isFinite(date.getTime())) throw new InvoicePdfError(`${label} invalide.`);
  return date;
}

function formatDate(value: string | Date | undefined) {
  if (!value) throw new InvoicePdfError("Date de facture manquante.");
  return new Intl.DateTimeFormat("fr-FR", { dateStyle: "long", timeZone: "Europe/Paris" }).format(parseDate(value, "date"));
}

function formatMoney(cents: number, currency: string) {
  return new Intl.NumberFormat("fr-FR", { style: "currency", currency, minimumFractionDigits: 2 })
    .format(cents / 100)
    .replace(/[\u00a0\u202f]/gu, " ");
}

function formatTaxRate(rateBps: number | null) {
  if (rateBps === null) return "-";
  return `${new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 2 }).format(rateBps / 100)} %`;
}

function sellerDisplayLines(seller: InvoiceSellerSnapshot) {
  return [
    seller.commercialName || seller.legalName,
    ...(seller.commercialName && seller.commercialName !== seller.legalName ? [seller.legalName] : []),
    seller.legalForm,
    ...seller.addressLines,
    seller.registration,
    `SIRET : ${seller.siret}`,
    ...(seller.vatNumber ? [`TVA intracommunautaire : ${seller.vatNumber}`] : []),
    ...(seller.email ? [seller.email] : [])
  ];
}

function buyerDisplayLines(buyer: InvoiceBuyerSnapshot) {
  const billing = addressLines(buyer.billingAddress).filter((line, index) =>
    index !== 0 || (line !== buyer.name && line !== buyer.companyName)
  );
  const lines = [
    buyer.companyName || buyer.name,
    ...(buyer.companyName && buyer.companyName !== buyer.name ? [buyer.name] : []),
    ...billing,
    ...(buyer.registration ? [`Immatriculation : ${buyer.registration}`] : []),
    ...(buyer.vatNumber ? [`TVA intracommunautaire : ${buyer.vatNumber}`] : []),
    ...(buyer.email ? [buyer.email] : [])
  ];
  if (buyer.shippingAddress && !sameAddress(buyer.billingAddress, buyer.shippingAddress)) {
    lines.push("Livraison :", ...addressLines(buyer.shippingAddress));
  }
  return lines;
}

function addressLines(address: InvoiceAddressSnapshot) {
  return [address.name, address.line1, address.line2, `${address.postalCode} ${address.city}`, address.country].filter((line): line is string => Boolean(line));
}

function sameAddress(left: InvoiceAddressSnapshot, right: InvoiceAddressSnapshot) {
  return JSON.stringify(left) === JSON.stringify(right);
}

function wrapText(text: string, font: PDFFont, size: number, maxWidth: number): string[] {
  const lines: string[] = [];
  for (const paragraph of text.replace(/\r\n?/gu, "\n").split("\n")) {
    if (!paragraph) {
      lines.push("");
      continue;
    }
    const words = paragraph.split(/\s+/u);
    let current = "";
    for (const word of words) {
      const candidate = current ? `${current} ${word}` : word;
      if (font.widthOfTextAtSize(candidate, size) <= maxWidth) {
        current = candidate;
        continue;
      }
      if (current) lines.push(current);
      if (font.widthOfTextAtSize(word, size) <= maxWidth) {
        current = word;
        continue;
      }
      let fragment = "";
      for (const character of word) {
        const extended = `${fragment}${character}`;
        if (fragment && font.widthOfTextAtSize(extended, size) > maxWidth) {
          lines.push(fragment);
          fragment = character;
        } else {
          fragment = extended;
        }
      }
      current = fragment;
    }
    if (current) lines.push(current);
  }
  return lines.length ? lines : [""];
}

function drawRight(page: PDFPage, text: string, right: number, y: number, font: PDFFont, size: number, color = colors.carbon) {
  page.drawText(text, { x: right - font.widthOfTextAtSize(text, size), y, size, font, color });
}

function drawBrandStripe(page: PDFPage) {
  const widths = [0.35, 0.2, 0.18, 0.27].map((ratio) => PAGE_WIDTH * ratio);
  const stripeColors = [colors.accent, colors.yellow, colors.red, colors.purple];
  let x = 0;
  widths.forEach((width, index) => {
    page.drawRectangle({ x, y: PAGE_HEIGHT - 8, width, height: 8, color: stripeColors[index] });
    x += width;
  });
}

function assertEncodable(invoice: InvoicePdfInput, regular: PDFFont, bold: PDFFont) {
  const strings: string[] = [];
  const collect = (value: unknown) => {
    if (typeof value === "string") strings.push(value);
    else if (Array.isArray(value)) value.forEach(collect);
    else if (value && typeof value === "object" && !(value instanceof Date)) Object.values(value).forEach(collect);
  };
  collect(invoice);
  try {
    for (const value of strings) {
      for (const line of value.replace(/\r\n?/gu, "\n").split("\n")) {
        regular.encodeText(line);
        bold.encodeText(line);
      }
    }
  } catch {
    throw new InvoicePdfError("La facture contient un caractère non pris en charge par la police PDF embarquée.");
  }
}

