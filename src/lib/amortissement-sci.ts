/**
 * Amortissement linéaire d'une immobilisation SCI (immeuble ou composant), avec
 * prorata temporis en jours 30/360 — convention fiscale française standard
 * (BOI-BIC-AMT-20-20) : chaque mois compte 30 jours, chaque année 360 jours.
 * Toutes les dates sont des chaînes "YYYY-MM-DD".
 */

export type ImmobilisationSci = {
  valeurAmortissableCents: number;
  dureeAnnees: number;
  dateMiseEnService: string;
};

function parseDate(d: string): { y: number; m: number; j: number } {
  const [y, m, j] = d.split("-").map(Number);
  return { y, m, j };
}

/** Un jour avant une date ISO — utilise Date en UTC pour éviter tout décalage de fuseau. */
function veille(dateIso: string): string {
  const d = new Date(`${dateIso}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() - 1);
  return d.toISOString().slice(0, 10);
}

/** Nombre de jours entre deux dates en convention 30/360. */
function jours30360(d1: string, d2: string): number {
  const a = parseDate(d1);
  const b = parseDate(d2);
  const jour1 = Math.min(a.j, 30);
  const jour2 = jour1 === 30 && b.j === 31 ? 30 : Math.min(b.j, 30);
  return (b.y - a.y) * 360 + (b.m - a.m) * 30 + (jour2 - jour1);
}

/** Amortissement cumulé depuis la mise en service jusqu'à une date donnée (plafonné à 100 %). */
export function amortissementCumuleCents(immo: ImmobilisationSci, atDate: string): number {
  if (atDate < immo.dateMiseEnService) return 0;
  const dureeJours = immo.dureeAnnees * 360;
  const ratio = dureeJours > 0 ? Math.min(1, jours30360(immo.dateMiseEnService, atDate) / dureeJours) : 1;
  return Math.round(immo.valeurAmortissableCents * ratio);
}

/** Valeur nette comptable à une date donnée (valeur d'origine − amortissement cumulé). */
export function valeurNetteComptableCents(immo: ImmobilisationSci, atDate: string): number {
  return immo.valeurAmortissableCents - amortissementCumuleCents(immo, atDate);
}

/** Dotation aux amortissements sur une période [rangeStart, rangeEnd] (bornes incluses). */
export function dotationPeriodeCents(immo: ImmobilisationSci, rangeStart: string, rangeEnd: string): number {
  if (rangeEnd < rangeStart) return 0;
  return amortissementCumuleCents(immo, rangeEnd) - amortissementCumuleCents(immo, veille(rangeStart));
}
