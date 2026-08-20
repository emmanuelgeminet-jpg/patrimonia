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
  montantEmprunteCents: number | null;
  tauxPct: number | null;
  dureeAnnees: number | null;
  chargesAnnuellesCents: number | null;
  surfaceM2: number | null;
  lots: { loyerHcCents: number; chargesCents: number }[];
};

export type AnalyseBienKpis = {
  coutTotalCents: number;
  loyersHcAnnuelsCents: number;
  loyersChargesAnnuelsCents: number;
  mensualiteCents: number;
  mensualiteAnnuelleCents: number;
  isEstimeCents: number;
  rentabiliteBrute: number | null;
  rentabiliteNette: number | null;
  rentabiliteNetNette: number | null;
  cashflowAnnuelCents: number;
  prixM2Cents: number | null;
};

/**
 * Reproduit les formules validées dans l'analyse détaillée de départ (13 rue des
 * Cordeliers) : brute = loyers HC / coût total ; nette = (loyers HC - charges) /
 * coût total ; net-net = (loyers HC - charges - IS estimé à 15 %) / coût total.
 * Les intérêts d'emprunt sont volontairement exclus des rentabilités (relèvent du
 * financement, pas de la performance intrinsèque du bien) — ils apparaissent dans le cashflow.
 */
export function computeAnalyseBienKpis(input: AnalyseBienInput): AnalyseBienKpis {
  const coutTotalCents = (input.prixOffreCents ?? 0) + (input.fraisNotaireCents ?? 0) + (input.travauxEstimesCents ?? 0);
  const loyersHcAnnuelsCents = input.lots.reduce((s, l) => s + l.loyerHcCents, 0) * 12;
  const loyersChargesAnnuelsCents = input.lots.reduce((s, l) => s + l.chargesCents, 0) * 12;
  const mensualiteCents = mensualiteEmprunt(input.montantEmprunteCents ?? 0, input.tauxPct ?? 0, input.dureeAnnees ?? 0);
  const mensualiteAnnuelleCents = mensualiteCents * 12;
  const chargesAnnuellesCents = input.chargesAnnuellesCents ?? 0;

  const rentabiliteBrute = coutTotalCents > 0 ? (loyersHcAnnuelsCents / coutTotalCents) * 100 : null;
  const rentabiliteNette = coutTotalCents > 0 ? ((loyersHcAnnuelsCents - chargesAnnuellesCents) / coutTotalCents) * 100 : null;

  const baseImposableCents = Math.max(0, loyersHcAnnuelsCents - chargesAnnuellesCents);
  const isEstimeCents = baseImposableCents * 0.15;
  const rentabiliteNetNette =
    coutTotalCents > 0 ? ((loyersHcAnnuelsCents - chargesAnnuellesCents - isEstimeCents) / coutTotalCents) * 100 : null;

  const cashflowAnnuelCents = loyersHcAnnuelsCents - chargesAnnuellesCents - mensualiteAnnuelleCents;
  const prixM2Cents = input.surfaceM2 && input.surfaceM2 > 0 ? coutTotalCents / input.surfaceM2 : null;

  return {
    coutTotalCents,
    loyersHcAnnuelsCents,
    loyersChargesAnnuelsCents,
    mensualiteCents,
    mensualiteAnnuelleCents,
    isEstimeCents,
    rentabiliteBrute,
    rentabiliteNette,
    rentabiliteNetNette,
    cashflowAnnuelCents,
    prixM2Cents,
  };
}
