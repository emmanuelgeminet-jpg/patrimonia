import { readFile } from "fs/promises";
import path from "path";
import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFPage } from "pdf-lib";
import { formatEuros, formatMonthLabel } from "@/lib/budget";

export type QuittanceInfo = {
  sciNom: string;
  /** SIREN de la SCI, si connu — absent pour un bien détenu en nom propre. */
  siren?: string | null;
  /** Adresse du bailleur (siège social pour une SCI) — mention obligatoire de la quittance. */
  bailleurAdresse?: string | null;
  /** Style d'écusson à dessiner sur la quittance — laisse vide pour le monogramme générique
   *  (toute SCI/tout foyer y a droit par défaut) ; "gascons_rapieres" est un habillage propre
   *  à une SCI en particulier, choisi via sci.logo_style, pas déduit du nom (jamais de logique
   *  câblée sur "Les Bons Gascons" — n'importe quel futur utilisateur pourrait avoir son propre
   *  style un jour). */
  logoStyle?: string | null;
  /** Nom du gérant qui signe pour la SCI — une SCI signe par son représentant légal, pas par
   *  un associé quelconque. Laisse vide pour un bien en nom propre (pas de notion de gérant). */
  gerantNom?: string | null;
  bienAdresse: string;
  lotNom: string;
  locataireNom: string;
  mois: string; // "YYYY-MM"
  loyerHcCents: number;
  chargesCents: number;
};

const INK = rgb(0.13, 0.15, 0.12);
const INK_SOFT = rgb(0.357, 0.373, 0.325);
const LINE = rgb(0.871, 0.855, 0.808);
const GASCON_RED = rgb(0.651, 0.098, 0.18);
const GOLD = rgb(0.788, 0.635, 0.294);
const WHITE = rgb(1, 1, 1);

/** Écusson générique (monogramme) — le style par défaut pour n'importe quelle SCI ou foyer. */
function drawMonogrammeBadge(page: PDFPage, cx: number, cy: number, r: number, initiale: string, font: PDFFont) {
  page.drawEllipse({ x: cx, y: cy, xScale: r, yScale: r, color: INK });
  const size = r * 1.15;
  const width = font.widthOfTextAtSize(initiale, size);
  page.drawText(initiale, { x: cx - width / 2, y: cy - size * 0.36, size, font, color: WHITE });
}

/**
 * Chemin d'un écusson personnalisé associé à un logoStyle donné — image fournie par Emmanuel
 * (rapières croisées générées avec Gemini pour "Les Bons Gascons"), stockée dans public/ comme
 * n'importe quel autre asset statique. Convention par style plutôt que codée en dur sur une SCI
 * précise : n'importe quel logoStyle futur n'a qu'à ajouter une entrée ici.
 */
const LOGO_IMAGES: Record<string, string> = {
  gascons_rapieres: "public/logos/sci-les-bons-gascons.jpg",
};

/** Génère un PDF de quittance de loyer et le renvoie en octets. */
export async function genererQuittancePdf(info: QuittanceInfo): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  const page = doc.addPage([595.28, 841.89]); // A4
  const font = await doc.embedFont(StandardFonts.TimesRoman);
  const bold = await doc.embedFont(StandardFonts.TimesRomanBold);
  const italic = await doc.embedFont(StandardFonts.TimesRomanItalic);

  const left = 55;
  const right = 540.28;
  const width = right - left;
  const totalCents = info.loyerHcCents + info.chargesCents;
  const moisLabel = formatMonthLabel(info.mois);
  const dateEmission = new Date().toLocaleDateString("fr-FR");

  // ----- En-tête : écusson + nom du bailleur -----
  const badgeR = 34;
  const badgeCx = left + badgeR;
  const badgeCy = 760;
  const logoPath = info.logoStyle ? LOGO_IMAGES[info.logoStyle] : undefined;
  if (logoPath) {
    const logoBytes = await readFile(path.join(/* turbopackIgnore: true */ process.cwd(), logoPath));
    const logoImage = logoPath.endsWith(".png") ? await doc.embedPng(logoBytes) : await doc.embedJpg(logoBytes);
    const logoDims = logoImage.scaleToFit(badgeR * 2, badgeR * 2);
    page.drawImage(logoImage, {
      x: badgeCx - logoDims.width / 2,
      y: badgeCy - logoDims.height / 2,
      width: logoDims.width,
      height: logoDims.height,
    });
  } else {
    drawMonogrammeBadge(page, badgeCx, badgeCy, badgeR, info.sciNom.trim().charAt(0).toUpperCase() || "?", bold);
  }
  const wordmarkX = left + badgeR * 2 + 12;
  page.drawText(info.sciNom.toUpperCase(), { x: wordmarkX, y: badgeCy + 8, size: 15, font: bold, color: INK });
  page.drawText("S C I", { x: wordmarkX, y: badgeCy - 8, size: 8, font, color: INK_SOFT });

  page.drawLine({ start: { x: left, y: 715 }, end: { x: right, y: 715 }, thickness: 1, color: GOLD });

  page.drawText("QUITTANCE DE LOYER", { x: left, y: 692, size: 19, font: bold, color: INK });
  const dateLabel = `Émise le ${dateEmission}`;
  page.drawText(dateLabel, { x: right - font.widthOfTextAtSize(dateLabel, 9), y: 696, size: 9, font, color: INK_SOFT });

  // ----- Identité -----
  let y = 660;
  const champ = (label: string, valeur: string, opts?: { petit?: boolean }) => {
    page.drawText(label, { x: left, y, size: 8.5, font: bold, color: INK_SOFT });
    y -= 13;
    page.drawText(valeur, { x: left, y, size: opts?.petit ? 9.5 : 11, font, color: INK });
    y -= opts?.petit ? 16 : 19;
  };

  champ("BAILLEUR", info.sciNom + (info.siren ? ` — SIREN ${info.siren}` : ""));
  if (info.bailleurAdresse) {
    page.drawText(info.bailleurAdresse, { x: left, y: y + 5, size: 9.5, font: italic, color: INK_SOFT });
    y -= 16;
  }
  champ("LOCATAIRE", info.locataireNom);
  champ("LOGEMENT LOUÉ", `${info.bienAdresse} — ${info.lotNom}`);
  champ("PÉRIODE CONCERNÉE", moisLabel);

  y -= 6;
  page.drawText(
    `Le bailleur soussigné déclare avoir reçu de ${info.locataireNom} la somme de ${formatEuros(totalCents)}`,
    { x: left, y, size: 10.5, font, color: INK }
  );
  y -= 15;
  page.drawText("au titre du loyer et des charges de la période ci-dessus, se décomposant comme suit :", {
    x: left,
    y,
    size: 10.5,
    font,
    color: INK,
  });
  y -= 26;

  // ----- Tableau loyer / charges / total -----
  const rowH = 26;
  const tableTop = y;
  const rows: [string, number, boolean][] = [
    ["Loyer hors charges", info.loyerHcCents, false],
    ["Provisions pour charges", info.chargesCents, false],
    ["Total dû", totalCents, true],
  ];
  page.drawRectangle({ x: left, y: tableTop - rowH * rows.length, width, height: rowH * rows.length, borderColor: LINE, borderWidth: 1 });
  rows.forEach(([label, cents, isTotal], i) => {
    const rowY = tableTop - rowH * i;
    if (i > 0) page.drawLine({ start: { x: left, y: rowY }, end: { x: right, y: rowY }, thickness: 1, color: LINE });
    const f = isTotal ? bold : font;
    const c = isTotal ? GASCON_RED : INK;
    const label2 = isTotal ? label.toUpperCase() : label;
    page.drawText(label2, { x: left + 14, y: rowY - rowH / 2 - 4, size: isTotal ? 11 : 10.5, font: f, color: c });
    const amountStr = formatEuros(cents);
    const amountW = f.widthOfTextAtSize(amountStr, isTotal ? 11 : 10.5);
    page.drawText(amountStr, { x: right - 14 - amountW, y: rowY - rowH / 2 - 4, size: isTotal ? 11 : 10.5, font: f, color: c });
  });
  y = tableTop - rowH * rows.length - 34;

  // ----- Signature -----
  // Une SCI signe par son représentant légal (le gérant), jamais par un associé quelconque —
  // pas juste "Signature du bailleur" comme pour un bien détenu en nom propre.
  page.drawText(`Fait le ${dateEmission}`, { x: left, y, size: 10, font, color: INK });
  const sigLines = info.gerantNom
    ? [`Pour la SCI ${info.sciNom}, le Gérant`, info.gerantNom, "Signature :"]
    : ["Signature du bailleur :"];
  let sigY = y;
  for (const line of sigLines) {
    page.drawText(line, { x: right - 200, y: sigY, size: 10, font, color: INK });
    sigY -= 13;
  }
  page.drawRectangle({ x: right - 200, y: y - 13 * sigLines.length - 56, width: 200, height: 56, borderColor: LINE, borderWidth: 1 });
  y -= 13 * sigLines.length + 56 + 24;

  // ----- Mentions légales -----
  const mentions = [
    "Cette quittance annule tout reçu établi antérieurement en cas de paiement partiel du montant ci-dessus.",
    "Quittance délivrée gratuitement, conformément à l'article 21 de la loi n° 89-462 du 6 juillet 1989.",
    "À conserver au moins 3 ans après la fin de la location (délai de prescription, article 7-1 de la même loi).",
  ];
  page.drawLine({ start: { x: left, y: y + 12 }, end: { x: right, y: y + 12 }, thickness: 0.5, color: LINE });
  for (const m of mentions) {
    page.drawText(m, { x: left, y, size: 8, font, color: INK_SOFT });
    y -= 12;
  }

  return doc.save();
}
