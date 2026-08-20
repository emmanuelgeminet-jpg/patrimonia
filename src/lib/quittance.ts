import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { formatEuros, formatMonthLabel } from "@/lib/budget";

export type QuittanceInfo = {
  sciNom: string;
  /** SIREN de la SCI, si connu — absent pour un bien détenu en nom propre. */
  siren?: string | null;
  bienAdresse: string;
  lotNom: string;
  locataireNom: string;
  mois: string; // "YYYY-MM"
  loyerHcCents: number;
  chargesCents: number;
};

/** Génère un PDF de quittance de loyer et le renvoie en octets. */
export async function genererQuittancePdf(info: QuittanceInfo): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  const page = doc.addPage([595.28, 841.89]); // A4
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);
  const ink = rgb(0.13, 0.15, 0.12);

  let y = 780;
  const left = 60;
  const totalCents = info.loyerHcCents + info.chargesCents;
  const moisLabel = formatMonthLabel(info.mois);
  const dateEmission = new Date().toLocaleDateString("fr-FR");

  const drawLine = (text: string, opts?: { size?: number; useFont?: typeof font; gap?: number }) => {
    page.drawText(text, { x: left, y, size: opts?.size ?? 11, font: opts?.useFont ?? font, color: ink });
    y -= opts?.gap ?? 20;
  };

  drawLine("QUITTANCE DE LOYER", { size: 18, useFont: bold, gap: 34 });

  drawLine(`Bailleur : ${info.sciNom}${info.siren ? ` — SIREN ${info.siren}` : ""}`, { gap: 18 });
  drawLine(`Locataire : ${info.locataireNom}`, { gap: 18 });
  drawLine(`Logement loué : ${info.bienAdresse} — ${info.lotNom}`, { gap: 18 });
  drawLine(`Période concernée : ${moisLabel}`, { gap: 32 });

  drawLine(
    `Le bailleur soussigné déclare avoir reçu de ${info.locataireNom} la somme de`,
    { gap: 18 }
  );
  drawLine(`${formatEuros(totalCents)} au titre du loyer et des charges de la période ci-dessus,`, { gap: 18 });
  drawLine("se décomposant comme suit :", { gap: 30 });

  drawLine(`Loyer hors charges .......................... ${formatEuros(info.loyerHcCents)}`, { gap: 18 });
  drawLine(`Provisions pour charges ..................... ${formatEuros(info.chargesCents)}`, { gap: 18 });
  drawLine(`Total .......................................... ${formatEuros(totalCents)}`, { useFont: bold, gap: 40 });

  drawLine(
    "La présente quittance annule tous les reçus qui auraient pu être établis précédemment en cas de",
    { size: 9.5, gap: 14 }
  );
  drawLine(
    "paiement partiel du montant ci-dessus. À conserver par le locataire pendant toute la durée de la location.",
    { size: 9.5, gap: 36 }
  );

  drawLine(`Fait le ${dateEmission}`, { gap: 40 });
  drawLine("Signature du bailleur :", {});

  return doc.save();
}
