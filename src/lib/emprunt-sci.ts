/**
 * Suivi d'un emprunt SCI à taux fixe, mensualités constantes (formule d'annuité
 * classique) — natif au mois, pas à l'année comme src/lib/analyse-bien.ts (qui sert
 * un usage différent, la simulation avant achat, et ne convient pas ici : une durée
 * en mois non multiple de 12 casserait un calcul natif à l'année).
 *
 * Toutes les dates sont des chaînes "YYYY-MM-DD". Le capital restant dû (CRD) et la
 * part d'intérêts d'une période se recalculent depuis les conditions d'origine du
 * prêt (capital, taux, durée, date de départ) — pas de solde "repris" à maintenir à
 * la main : formule fermée d'annuité, valable pour un prêt classique jamais
 * renégocié ni remboursé par anticipation.
 */

export type EmpruntSci = {
  capitalEmprunteCents: number;
  tauxPct: number;
  dureeMois: number;
  dateDebut: string;
};

function parseDate(d: string): { y: number; m: number; j: number } {
  const [y, m, j] = d.split("-").map(Number);
  return { y, m, j };
}

/** Nombre de mois calendaires complets écoulés entre deux dates (0 si atDate <= dateDebut). */
function moisEcoules(dateDebut: string, atDate: string): number {
  const a = parseDate(dateDebut);
  const b = parseDate(atDate);
  let mois = (b.y - a.y) * 12 + (b.m - a.m);
  if (b.j < a.j) mois -= 1;
  return Math.max(0, mois);
}

/** Un jour avant une date ISO — utilise Date en UTC pour éviter tout décalage de fuseau. */
function veille(dateIso: string): string {
  const d = new Date(`${dateIso}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() - 1);
  return d.toISOString().slice(0, 10);
}

export function tauxMensuel(tauxPct: number): number {
  return tauxPct / 100 / 12;
}

/** Mensualité constante (hors assurance emprunteur, toujours saisie à part). */
export function mensualiteMensuelleCents(capitalCents: number, tauxPct: number, dureeMois: number): number {
  if (capitalCents <= 0 || dureeMois <= 0) return 0;
  const r = tauxMensuel(tauxPct);
  if (r === 0) return capitalCents / dureeMois;
  return (capitalCents * r) / (1 - Math.pow(1 + r, -dureeMois));
}

/** Nombre de mensualités déjà passées à une date donnée (0 à dureeMois). */
export function nombrePaiementsEffectues(dateDebut: string, dureeMois: number, atDate: string): number {
  if (atDate <= dateDebut) return 0;
  return Math.min(moisEcoules(dateDebut, atDate), dureeMois);
}

/** Capital restant dû après k mensualités — formule fermée (pas de tableau d'amortissement à stocker). */
export function crdApresPaiement(capitalCents: number, tauxPct: number, dureeMois: number, k: number): number {
  if (k <= 0) return capitalCents;
  if (k >= dureeMois) return 0;
  const r = tauxMensuel(tauxPct);
  if (r === 0) return Math.round((capitalCents * (dureeMois - k)) / dureeMois);
  const facteur = (Math.pow(1 + r, dureeMois) - Math.pow(1 + r, k)) / (Math.pow(1 + r, dureeMois) - 1);
  return Math.round(capitalCents * facteur);
}

/** Capital restant dû à une date donnée. */
export function crdADateCents(emprunt: EmpruntSci, atDate: string): number {
  const k = nombrePaiementsEffectues(emprunt.dateDebut, emprunt.dureeMois, atDate);
  return crdApresPaiement(emprunt.capitalEmprunteCents, emprunt.tauxPct, emprunt.dureeMois, k);
}

/**
 * Part d'intérêts payée sur les mensualités tombant dans [rangeStart, rangeEnd]
 * (bornes incluses) — ne boucle que sur les mensualités de la période, jamais sur
 * la durée totale du prêt.
 */
export function interetsPeriodeCents(emprunt: EmpruntSci, rangeStart: string, rangeEnd: string): number {
  if (rangeEnd < rangeStart) return 0;
  const r = tauxMensuel(emprunt.tauxPct);
  const kMax = nombrePaiementsEffectues(emprunt.dateDebut, emprunt.dureeMois, rangeEnd);
  const kMinExclusive = nombrePaiementsEffectues(emprunt.dateDebut, emprunt.dureeMois, veille(rangeStart));
  let total = 0;
  for (let k = kMinExclusive + 1; k <= kMax; k++) {
    total += crdApresPaiement(emprunt.capitalEmprunteCents, emprunt.tauxPct, emprunt.dureeMois, k - 1) * r;
  }
  return Math.round(total);
}
