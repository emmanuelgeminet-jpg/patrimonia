import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFPage } from "pdf-lib";
import { LOGO_GASCONS_RAPIERES_BASE64 } from "@/lib/logo-gascons-rapieres";

/**
 * Aide générique de mise en page pdf-lib pour des documents longs et à longueur variable
 * (bail, état des lieux) — pagination automatique, retour à la ligne, tableaux qui se
 * redécoupent sur plusieurs pages. Reprend les conventions visuelles de src/lib/quittance.ts
 * (couleurs, polices, écusson SCI) sans en dépendre : quittance.ts reste inchangé (document
 * légal déjà en production, aucune raison d'y toucher pour ce chantier).
 */

export const INK = rgb(0.13, 0.15, 0.12);
export const INK_SOFT = rgb(0.357, 0.373, 0.325);
export const LINE = rgb(0.871, 0.855, 0.808);
export const ACCENT = rgb(0.651, 0.098, 0.18);
export const GOLD = rgb(0.788, 0.635, 0.294);
export const WHITE = rgb(1, 1, 1);

const PAGE_WIDTH = 595.28;
const PAGE_HEIGHT = 841.89; // A4
const MARGIN_LEFT = 55;
const MARGIN_RIGHT = 540.28;
const MARGIN_TOP = 780;
const MARGIN_BOTTOM = 46;

/** Même principe que LOGO_IMAGES_BASE64 dans quittance.ts (clé = sci.logo_style), dupliqué ici
 *  volontairement pour ne pas créer de dépendance vers quittance.ts. */
const LOGO_IMAGES_BASE64: Record<string, string> = {
  gascons_rapieres: LOGO_GASCONS_RAPIERES_BASE64,
};

export type PdfLayout = {
  doc: PDFDocument;
  page: PDFPage;
  y: number;
  font: PDFFont;
  bold: PDFFont;
  italic: PDFFont;
  left: number;
  right: number;
  top: number;
  bottom: number;
  title: string;
  pageNum: number;
};

function drawRunningHeader(layout: PdfLayout) {
  const { page, left, right, bold, font, top, title } = layout;
  page.drawText(title, { x: left, y: top + 18, size: 8.5, font: bold, color: INK_SOFT });
  const pageLabel = `Page ${layout.pageNum}`;
  page.drawText(pageLabel, { x: right - font.widthOfTextAtSize(pageLabel, 8), y: top + 18, size: 8, font, color: INK_SOFT });
  page.drawLine({ start: { x: left, y: top + 10 }, end: { x: right, y: top + 10 }, thickness: 0.5, color: LINE });
}

export async function createLayout(title: string): Promise<PdfLayout> {
  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.TimesRoman);
  const bold = await doc.embedFont(StandardFonts.TimesRomanBold);
  const italic = await doc.embedFont(StandardFonts.TimesRomanItalic);
  const layout: PdfLayout = {
    doc,
    page: doc.addPage([PAGE_WIDTH, PAGE_HEIGHT]),
    y: MARGIN_TOP - 16,
    font,
    bold,
    italic,
    left: MARGIN_LEFT,
    right: MARGIN_RIGHT,
    top: MARGIN_TOP,
    bottom: MARGIN_BOTTOM,
    title,
    pageNum: 1,
  };
  drawRunningHeader(layout);
  return layout;
}

export function newPage(layout: PdfLayout) {
  layout.page = layout.doc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
  layout.pageNum += 1;
  drawRunningHeader(layout);
  layout.y = layout.top - 16;
}

/** Passe à la page suivante si la hauteur demandée ne tient plus au-dessus de la marge basse. */
export function ensureSpace(layout: PdfLayout, needed: number) {
  if (layout.y - needed < layout.bottom) newPage(layout);
}

export function drawSectionTitle(layout: PdfLayout, label: string) {
  const size = 11.5;
  const lines = wrapText(label.toUpperCase(), layout.bold, size, layout.right - layout.left);
  ensureSpace(layout, 26 + (lines.length - 1) * (size + 3));
  layout.y -= 4;
  for (const line of lines) {
    layout.page.drawText(line, { x: layout.left, y: layout.y, size, font: layout.bold, color: ACCENT });
    layout.y -= size + 3;
  }
  layout.y -= 4;
  layout.page.drawLine({ start: { x: layout.left, y: layout.y }, end: { x: layout.right, y: layout.y }, thickness: 0.75, color: GOLD });
  layout.y -= 15;
}

function wrapText(text: string, font: PDFFont, size: number, maxWidth: number): string[] {
  const words = text.split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let current = "";
  for (const word of words) {
    const attempt = current ? `${current} ${word}` : word;
    if (current && font.widthOfTextAtSize(attempt, size) > maxWidth) {
      lines.push(current);
      current = word;
    } else {
      current = attempt;
    }
  }
  if (current) lines.push(current);
  return lines.length ? lines : [""];
}

export function drawParagraph(
  layout: PdfLayout,
  text: string,
  opts?: { size?: number; font?: PDFFont; color?: ReturnType<typeof rgb>; lineHeight?: number; width?: number }
) {
  const size = opts?.size ?? 9;
  const font = opts?.font ?? layout.font;
  const color = opts?.color ?? INK_SOFT;
  const lineHeight = opts?.lineHeight ?? size + 3.5;
  const width = opts?.width ?? layout.right - layout.left;
  const lines = wrapText(text, font, size, width);
  for (const line of lines) {
    ensureSpace(layout, lineHeight);
    layout.page.drawText(line, { x: layout.left, y: layout.y, size, font, color });
    layout.y -= lineHeight;
  }
}

/** Un champ pleine largeur : libellé au-dessus, valeur en dessous (adresses, texte libre). */
export function drawField(layout: PdfLayout, label: string, value: string, opts?: { size?: number }) {
  const size = opts?.size ?? 10;
  ensureSpace(layout, size + 24);
  layout.page.drawText(label.toUpperCase(), { x: layout.left, y: layout.y, size: 8, font: layout.bold, color: INK_SOFT });
  layout.y -= 12;
  const lines = wrapText(value || "—", layout.font, size, layout.right - layout.left);
  for (const line of lines) {
    ensureSpace(layout, size + 4);
    layout.page.drawText(line, { x: layout.left, y: layout.y, size, font: layout.font, color: INK });
    layout.y -= size + 4;
  }
  layout.y -= 6;
}

/** Champs courts affichés à deux par ligne ("Libellé : valeur") — compact, pour les nombreux
 *  petits champs du bail/état des lieux. Un champ dont la valeur ne tiendrait pas sur une seule
 *  ligne bascule automatiquement en pleine largeur (drawField, qui gère le retour à la ligne) :
 *  jamais de valeur tronquée/perdue sur un document légal, même pour un champ "en principe" court
 *  (ex. une profession libre saisie par l'utilisateur peut être longue). */
export function drawFieldsGrid(layout: PdfLayout, fields: { label: string; value: string }[], opts?: { size?: number }) {
  const size = opts?.size ?? 9;
  const rowH = size + 9;
  const colWidth = (layout.right - layout.left) / 2 - 8;
  const midX = layout.left + (layout.right - layout.left) / 2 + 8;

  const fitsCompact = (field: { label: string; value: string }) => {
    const labelW = layout.bold.widthOfTextAtSize(`${field.label} : `, size);
    const valueW = layout.font.widthOfTextAtSize(field.value || "—", size);
    return labelW + valueW <= colWidth;
  };

  let pending: { label: string; value: string } | null = null;
  const flushPending = () => {
    if (!pending) return;
    ensureSpace(layout, rowH);
    drawFieldInline(layout, layout.left, layout.y, pending, size, colWidth);
    layout.y -= rowH;
    pending = null;
  };

  for (const field of fields) {
    if (!fitsCompact(field)) {
      flushPending();
      drawField(layout, field.label, field.value);
      continue;
    }
    if (!pending) {
      pending = field;
    } else {
      ensureSpace(layout, rowH);
      drawFieldInline(layout, layout.left, layout.y, pending, size, colWidth);
      drawFieldInline(layout, midX, layout.y, field, size, colWidth);
      layout.y -= rowH;
      pending = null;
    }
  }
  flushPending();
}

function drawFieldInline(layout: PdfLayout, x: number, y: number, field: { label: string; value: string }, size: number, maxWidth: number) {
  const labelText = `${field.label} : `;
  layout.page.drawText(labelText, { x, y, size, font: layout.bold, color: INK_SOFT });
  const labelW = layout.bold.widthOfTextAtSize(labelText, size);
  const value = field.value || "—";
  const availableWidth = maxWidth - labelW;
  // Filet de sécurité seulement : drawFieldsGrid ne devrait plus jamais appeler cette fonction
  // avec une valeur trop longue (voir fitsCompact ci-dessus) — si ça arrive quand même, on
  // rend visible la coupure au lieu de perdre silencieusement la fin du texte.
  const display =
    availableWidth > 0 && layout.font.widthOfTextAtSize(value, size) > availableWidth
      ? `${wrapText(value, layout.font, size, availableWidth - layout.font.widthOfTextAtSize("…", size))[0]}…`
      : value;
  layout.page.drawText(display, { x: x + labelW, y, size, font: layout.font, color: INK });
}

/** Ligne de cases à cocher ([X]/[ ]) — plusieurs éléments par ligne, retour à la ligne
 *  automatique. Polices standard pdf-lib (WinAnsi) : pas de glyphes ☑/☐ (non encodables). */
export function drawChecklistLine(layout: PdfLayout, items: { label: string; checked: boolean }[], opts?: { size?: number }) {
  const size = opts?.size ?? 9;
  const gap = 18;
  ensureSpace(layout, size + 8);
  let x = layout.left;
  for (const item of items) {
    const glyph = item.checked ? "[X]" : "[ ]";
    const text = `${glyph} ${item.label}`;
    const w = layout.font.widthOfTextAtSize(text, size);
    if (x + w > layout.right && x > layout.left) {
      layout.y -= size + 7;
      ensureSpace(layout, size + 8);
      x = layout.left;
    }
    layout.page.drawText(text, {
      x,
      y: layout.y,
      size,
      font: layout.font,
      color: item.checked ? INK : INK_SOFT,
    });
    x += w + gap;
  }
  layout.y -= size + 8;
}

/** Tableau bordé, colonnes de largeur fixe, en-tête redessiné si le tableau franchit une page. */
export function drawTable(
  layout: PdfLayout,
  columns: { label: string; width: number }[],
  rows: string[][],
  opts?: { rowHeight?: number; size?: number }
) {
  const rowH = opts?.rowHeight ?? 20;
  const size = opts?.size ?? 8.5;
  const tableWidth = columns.reduce((s, c) => s + c.width, 0);

  const drawHeaderRow = () => {
    ensureSpace(layout, rowH + 2);
    const top = layout.y;
    layout.page.drawRectangle({ x: layout.left, y: top - rowH, width: tableWidth, height: rowH, color: LINE });
    let x = layout.left;
    for (const col of columns) {
      layout.page.drawText(col.label, { x: x + 6, y: top - rowH / 2 - 3, size, font: layout.bold, color: INK });
      x += col.width;
    }
    layout.y -= rowH;
  };

  drawHeaderRow();
  for (const row of rows) {
    const pageBefore = layout.pageNum;
    ensureSpace(layout, rowH);
    // Réaffiche l'en-tête si on vient de changer de page pour cette ligne.
    if (layout.pageNum !== pageBefore) drawHeaderRow();
    const top = layout.y;
    layout.page.drawRectangle({ x: layout.left, y: top - rowH, width: tableWidth, height: rowH, borderColor: LINE, borderWidth: 0.75 });
    let x = layout.left;
    for (let i = 0; i < columns.length; i++) {
      if (i > 0) layout.page.drawLine({ start: { x, y: top }, end: { x, y: top - rowH }, thickness: 0.5, color: LINE });
      const cell = row[i] ?? "";
      const lines = wrapText(cell, layout.font, size, columns[i].width - 12);
      layout.page.drawText(lines[0] ?? "", { x: x + 6, y: top - rowH / 2 - 3, size, font: layout.font, color: INK });
      x += columns[i].width;
    }
    layout.y -= rowH;
  }
  layout.y -= 8;
}

/** Écusson/logo en en-tête (identique dans l'esprit à drawMonogrammeBadge/LOGO_IMAGES_BASE64 de
 *  quittance.ts) — générique par défaut, personnalisé seulement si logoStyle est renseigné. */
export async function drawBadgeOrLogo(
  layout: PdfLayout,
  cx: number,
  cy: number,
  r: number,
  initiale: string,
  logoStyle?: string | null
) {
  const logoBase64 = logoStyle ? LOGO_IMAGES_BASE64[logoStyle] : undefined;
  if (logoBase64) {
    const logoBytes = Buffer.from(logoBase64, "base64");
    const logoImage = await layout.doc.embedJpg(logoBytes);
    const logoDims = logoImage.scaleToFit(r * 2, r * 2);
    layout.page.drawImage(logoImage, {
      x: cx - logoDims.width / 2,
      y: cy - logoDims.height / 2,
      width: logoDims.width,
      height: logoDims.height,
    });
  } else {
    layout.page.drawEllipse({ x: cx, y: cy, xScale: r, yScale: r, color: INK });
    const size = r * 1.15;
    const letter = initiale.trim().charAt(0).toUpperCase() || "?";
    const width = layout.bold.widthOfTextAtSize(letter, size);
    layout.page.drawText(letter, { x: cx - width / 2, y: cy - size * 0.36, size, font: layout.bold, color: WHITE });
  }
}

export async function finish(layout: PdfLayout): Promise<Uint8Array> {
  return layout.doc.save();
}
