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
  prixAnnonceCents?: number | null;
  prixOffreCents: number | null;
  fraisNotaireCents: number | null;
  /** Frais d'agence immobilière ou de marchand de bien, si le vendeur en mandate un. */
  fraisAgenceCents?: number | null;
  /** Frais de dossier bancaire + garantie (caution/hypothèque), souvent oubliés d'un premier chiffrage. */
  fraisDossierGarantieCents?: number | null;
  travauxEstimesCents: number | null;
  apportCents?: number | null;
  montantEmprunteCents: number | null;
  tauxPct: number | null;
  dureeAnnees: number | null;
  /** Assurance emprunteur, €/mois — distincte de l'assurance PNO (protège le remboursement, pas le bien). */
  assuranceEmprunteurCents?: number | null;
  /** Taxe foncière, €/an — entièrement à la charge du propriétaire, jamais récupérable. */
  taxeFonciereCents?: number | null;
  /** Charges de copropriété, €/an — laisser vide si le bien n'est pas en copropriété. */
  chargesCoproCents?: number | null;
  /** Assurance propriétaire non occupant, €/an. */
  assurancePnoCents?: number | null;
  /** Charges annuelles ne rentrant dans aucune des catégories ci-dessus (comptable, entretien, provisions...). */
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

/** Cash-flow brut/net/net-net, sur une base de loyers donnée (100 % réel, ou pondérée banque). */
export type CashflowKpis = {
  cashflowBrutCents: number;
  cashflowNetCents: number;
  cashflowNetNetCents: number;
};

export type AnalyseBienKpis = {
  coutTotalCents: number;
  pourcentageNegociation: number | null;
  loyersHcAnnuelsCents: number;
  loyersHcEffectifsCents: number;
  loyersChargesAnnuelsCents: number;
  vacanceLocativeCents: number;
  gliCents: number;
  fraisGestionCents: number;
  chargesTotalesCents: number;
  mensualiteCreditCents: number;
  mensualiteTotaleCents: number;
  mensualiteAnnuelleCents: number;
  isEstimeCents: number;
  rentabiliteBrute: number | null;
  rentabiliteNette: number | null;
  rentabiliteNetNette: number | null;
  cashOnCash: number | null;
  prixM2Cents: number | null;
  /** Cash-flow calculé sur les loyers réels à 100 %. */
  vue100: CashflowKpis;
  /** Rentabilité et cash-flow recalculés sur les loyers pondérés à 70 % — la façon dont une
   *  banque française évalue ta capacité d'emprunt (HCSF), pas la performance réelle du bien. */
  vueBanque70: CashflowKpis & {
    loyersPonderesCents: number;
    rentabiliteBrute: number | null;
    rentabiliteNette: number | null;
  };
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
 *
 * Cash-flow brut/net/net-net suit la même logique de déductions successives que la
 * rentabilité, mais en euros et en partant des loyers effectifs déjà nets de financement
 * (un cash-flow qui ignore le crédit n'a pas de sens) : brut = loyers effectifs − mensualité
 * totale (crédit + assurance emprunteur) ; net = brut − charges ; net-net = net − IS estimé.
 */
export function computeAnalyseBienKpis(input: AnalyseBienInput): AnalyseBienKpis {
  const coutTotalCents =
    (input.prixOffreCents ?? 0) +
    (input.fraisNotaireCents ?? 0) +
    (input.fraisAgenceCents ?? 0) +
    (input.fraisDossierGarantieCents ?? 0) +
    (input.travauxEstimesCents ?? 0);

  const pourcentageNegociation =
    input.prixAnnonceCents && input.prixAnnonceCents > 0 && input.prixOffreCents !== null
      ? ((input.prixAnnonceCents - input.prixOffreCents) / input.prixAnnonceCents) * 100
      : null;

  const loyersHcAnnuelsCents = input.lots.reduce((s, l) => s + l.loyerHcCents, 0) * 12;
  const loyersChargesAnnuelsCents = input.lots.reduce((s, l) => s + l.chargesCents, 0) * 12;

  const vacanceLocativeCents = loyersHcAnnuelsCents * ((input.vacanceLocativePct ?? 0) / 100);
  const loyersHcEffectifsCents = loyersHcAnnuelsCents - vacanceLocativeCents;
  const gliCents = loyersHcAnnuelsCents * ((input.gliPct ?? 0) / 100);
  const fraisGestionCents = loyersHcAnnuelsCents * ((input.fraisGestionPct ?? 0) / 100);
  const chargesTotalesCents =
    (input.taxeFonciereCents ?? 0) +
    (input.chargesCoproCents ?? 0) +
    (input.assurancePnoCents ?? 0) +
    (input.chargesAnnuellesCents ?? 0) +
    gliCents +
    fraisGestionCents;

  const mensualiteCreditCents = mensualiteEmprunt(input.montantEmprunteCents ?? 0, input.tauxPct ?? 0, input.dureeAnnees ?? 0);
  const mensualiteTotaleCents = mensualiteCreditCents + (input.assuranceEmprunteurCents ?? 0);
  const mensualiteAnnuelleCents = mensualiteTotaleCents * 12;

  const rentabiliteBrute = coutTotalCents > 0 ? (loyersHcAnnuelsCents / coutTotalCents) * 100 : null;
  const rentabiliteNette =
    coutTotalCents > 0 ? ((loyersHcEffectifsCents - chargesTotalesCents) / coutTotalCents) * 100 : null;

  const baseImposableCents = Math.max(0, loyersHcEffectifsCents - chargesTotalesCents);
  const isEstimeCents = baseImposableCents * 0.15;
  const rentabiliteNetNette =
    coutTotalCents > 0 ? ((loyersHcEffectifsCents - chargesTotalesCents - isEstimeCents) / coutTotalCents) * 100 : null;

  const cashflowBrut100 = loyersHcEffectifsCents - mensualiteAnnuelleCents;
  const cashflowNet100 = cashflowBrut100 - chargesTotalesCents;
  const cashflowNetNet100 = cashflowNet100 - isEstimeCents;

  const apportCents = input.apportCents ?? 0;
  const cashOnCash = apportCents > 0 ? (cashflowNet100 / apportCents) * 100 : null;
  const prixM2Cents = input.surfaceM2 && input.surfaceM2 > 0 ? coutTotalCents / input.surfaceM2 : null;

  // Vue banque : le HCSF impose un taux d'endettement max de 35 % (assurance comprise), et les
  // banques ne retiennent que 70 % des loyers dans ce calcul — sur les loyers bruts contractuels,
  // pas sur les loyers déjà amputés de la vacance (ce serait compter le risque deux fois).
  const loyersPonderesCents = loyersHcAnnuelsCents * 0.7;
  const cashflowBrut70 = loyersPonderesCents - mensualiteAnnuelleCents;
  const cashflowNet70 = cashflowBrut70 - chargesTotalesCents;
  // Le fisc taxe le revenu réel, pas la vue prudente de la banque — l'IS estimé reste celui du
  // scénario à 100 %.
  const cashflowNetNet70 = cashflowNet70 - isEstimeCents;
  const rentabiliteBrute70 = coutTotalCents > 0 ? (loyersPonderesCents / coutTotalCents) * 100 : null;
  const rentabiliteNette70 =
    coutTotalCents > 0 ? ((loyersPonderesCents - chargesTotalesCents) / coutTotalCents) * 100 : null;

  return {
    coutTotalCents,
    pourcentageNegociation,
    loyersHcAnnuelsCents,
    loyersHcEffectifsCents,
    loyersChargesAnnuelsCents,
    vacanceLocativeCents,
    gliCents,
    fraisGestionCents,
    chargesTotalesCents,
    mensualiteCreditCents,
    mensualiteTotaleCents,
    mensualiteAnnuelleCents,
    isEstimeCents,
    rentabiliteBrute,
    rentabiliteNette,
    rentabiliteNetNette,
    cashOnCash,
    prixM2Cents,
    vue100: {
      cashflowBrutCents: cashflowBrut100,
      cashflowNetCents: cashflowNet100,
      cashflowNetNetCents: cashflowNetNet100,
    },
    vueBanque70: {
      loyersPonderesCents,
      rentabiliteBrute: rentabiliteBrute70,
      rentabiliteNette: rentabiliteNette70,
      cashflowBrutCents: cashflowBrut70,
      cashflowNetCents: cashflowNet70,
      cashflowNetNetCents: cashflowNetNet70,
    },
  };
}
