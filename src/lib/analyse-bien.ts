/** Mensualité d'un prêt amortissable classique (formule d'annuité). */
export function mensualiteEmprunt(capitalCents: number, tauxPct: number, dureeAnnees: number): number {
  if (capitalCents <= 0 || dureeAnnees <= 0) return 0;
  const r = tauxPct / 100 / 12;
  const n = dureeAnnees * 12;
  if (r === 0) return capitalCents / n;
  return (capitalCents * r) / (1 - Math.pow(1 + r, -n));
}

/** Total des intérêts payés sur toute la durée du prêt (mensualités cumulées − capital emprunté). */
export function totalInteretsEmprunt(capitalCents: number, tauxPct: number, dureeAnnees: number): number {
  const mensualite = mensualiteEmprunt(capitalCents, tauxPct, dureeAnnees);
  return Math.max(0, mensualite * dureeAnnees * 12 - capitalCents);
}

export type AnalyseBienInput = {
  prixOffreCents: number | null;
  fraisNotaireCents: number | null;
  travauxEstimesCents: number | null;
  apportCents?: number | null;
  montantEmprunteCents: number | null;
  tauxPct: number | null;
  dureeAnnees: number | null;
  chargesAnnuellesCents: number | null;
  surfaceM2: number | null;
  /** % de loyers perdus en moyenne (logement vacant entre deux locataires, etc.). */
  vacanceLocativePct?: number | null;
  /** % du loyer HC pour une assurance loyers impayés. */
  gliPct?: number | null;
  /** % du loyer HC pour la gestion locative déléguée. */
  fraisGestionPct?: number | null;
  lots: { loyerHcCents: number; chargesCents: number }[];
};

export type AnalyseBienKpis = {
  coutTotalCents: number;
  loyersHcAnnuelsCents: number;
  loyersHcEffectifsCents: number;
  loyersChargesAnnuelsCents: number;
  vacanceLocativeCents: number;
  gliCents: number;
  fraisGestionCents: number;
  chargesTotalesCents: number;
  mensualiteCents: number;
  mensualiteAnnuelleCents: number;
  isEstimeCents: number;
  rentabiliteBrute: number | null;
  rentabiliteNette: number | null;
  rentabiliteNetNette: number | null;
  cashflowAnnuelCents: number;
  cashOnCash: number | null;
  prixM2Cents: number | null;
};

/**
 * Reproduit les formules validées dans l'analyse détaillée de départ (13 rue des
 * Cordeliers) : brute = loyers HC / coût total ; nette = (loyers HC - charges) /
 * coût total ; net-net = (loyers HC - charges - IS estimé à 15 %) / coût total.
 * Les intérêts d'emprunt sont volontairement exclus des rentabilités (relèvent du
 * financement, pas de la performance intrinsèque du bien) — ils apparaissent dans le cashflow.
 *
 * Vacance locative, GLI et frais de gestion sont des hypothèses de marché optionnelles
 * (0 par défaut = sans effet) qui viennent affiner les loyers effectifs et les charges,
 * dans l'esprit des grilles d'analyse professionnelles.
 */
export function computeAnalyseBienKpis(input: AnalyseBienInput): AnalyseBienKpis {
  const coutTotalCents = (input.prixOffreCents ?? 0) + (input.fraisNotaireCents ?? 0) + (input.travauxEstimesCents ?? 0);
  const loyersHcAnnuelsCents = input.lots.reduce((s, l) => s + l.loyerHcCents, 0) * 12;
  const loyersChargesAnnuelsCents = input.lots.reduce((s, l) => s + l.chargesCents, 0) * 12;

  const vacanceLocativeCents = loyersHcAnnuelsCents * ((input.vacanceLocativePct ?? 0) / 100);
  const loyersHcEffectifsCents = loyersHcAnnuelsCents - vacanceLocativeCents;
  const gliCents = loyersHcAnnuelsCents * ((input.gliPct ?? 0) / 100);
  const fraisGestionCents = loyersHcAnnuelsCents * ((input.fraisGestionPct ?? 0) / 100);
  const chargesTotalesCents = (input.chargesAnnuellesCents ?? 0) + gliCents + fraisGestionCents;

  const mensualiteCents = mensualiteEmprunt(input.montantEmprunteCents ?? 0, input.tauxPct ?? 0, input.dureeAnnees ?? 0);
  const mensualiteAnnuelleCents = mensualiteCents * 12;

  const rentabiliteBrute = coutTotalCents > 0 ? (loyersHcAnnuelsCents / coutTotalCents) * 100 : null;
  const rentabiliteNette =
    coutTotalCents > 0 ? ((loyersHcEffectifsCents - chargesTotalesCents) / coutTotalCents) * 100 : null;

  const baseImposableCents = Math.max(0, loyersHcEffectifsCents - chargesTotalesCents);
  const isEstimeCents = baseImposableCents * 0.15;
  const rentabiliteNetNette =
    coutTotalCents > 0 ? ((loyersHcEffectifsCents - chargesTotalesCents - isEstimeCents) / coutTotalCents) * 100 : null;

  const cashflowAnnuelCents = loyersHcEffectifsCents - chargesTotalesCents - mensualiteAnnuelleCents;
  const apportCents = input.apportCents ?? 0;
  const cashOnCash = apportCents > 0 ? (cashflowAnnuelCents / apportCents) * 100 : null;
  const prixM2Cents = input.surfaceM2 && input.surfaceM2 > 0 ? coutTotalCents / input.surfaceM2 : null;

  return {
    coutTotalCents,
    loyersHcAnnuelsCents,
    loyersHcEffectifsCents,
    loyersChargesAnnuelsCents,
    vacanceLocativeCents,
    gliCents,
    fraisGestionCents,
    chargesTotalesCents,
    mensualiteCents,
    mensualiteAnnuelleCents,
    isEstimeCents,
    rentabiliteBrute,
    rentabiliteNette,
    rentabiliteNetNette,
    cashflowAnnuelCents,
    cashOnCash,
    prixM2Cents,
  };
}
