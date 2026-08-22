/**
 * Régularisation des charges — répartition d'un ensemble de factures de charges entre les
 * lots d'un bien (clé : égale, surface, ou tantièmes), puis entre les locataires successifs
 * de chaque lot au prorata de leurs mois d'occupation. Granularité mensuelle partout (comme
 * le reste de l'appli — loyers, durée de bail), pas de précision au jour.
 *
 * Ne fait jamais confiance à un total déjà arrondi ailleurs : `repartirCents` garantit que la
 * somme des parts retournées est toujours exactement égale au total d'entrée, jamais un écart
 * d'arrondi — un `ecartCents` non nul dans le résultat final signalerait un bug, pas un cas
 * métier normal (même esprit que l'écart actif/passif de bilan-sci.ts).
 */

export type ClefRepartition = "egale" | "surface" | "tantiemes";

export type ChargeLigne = {
  id: string;
  montantCents: number;
  /** null = réparti sur tous les lots selon la clé ; sinon 100 % affecté à ce lot. */
  lotId: string | null;
  periodeDebut: string; // "YYYY-MM-DD"
  periodeFin: string;
};

export type LotRepartitionInput = {
  lotId: string;
  lotNom: string;
  surfaceM2: number | null;
  tantiemes: number | null;
};

export type OccupationInput = {
  locataireId: string;
  locataireNom: string;
  lotId: string;
  /** null = occupait déjà avant le début de la période de régularisation. */
  dateEntree: string | null;
  /** null = occupe toujours à la fin de la période de régularisation. */
  dateSortie: string | null;
  provisionMensuelleCents: number;
};

export type RegularisationLocataireResult = {
  locataireId: string;
  locataireNom: string;
  moisOccupes: number;
  provisionsCollecteesCents: number;
  partChargesCents: number;
  /** provisionsCollectees − partCharges : positif = à rembourser au locataire, négatif = à réclamer. */
  soldeCents: number;
};

export type RegularisationLotResult = {
  lotId: string;
  lotNom: string;
  poidsRepartition: number;
  chargesLotCents: number;
  parLocataire: RegularisationLocataireResult[];
  /** Part du lot non attribuée à un locataire (vacance) — normal, pas un bug. */
  chargesNonAffecteesCents: number;
  provisionSuggereeMensuelleCents: number;
};

export type RegularisationResult = {
  periodeDebut: string;
  periodeFin: string;
  clefRepartition: ClefRepartition;
  chargesTotalesCents: number;
  parLot: RegularisationLotResult[];
  chargesNonAffecteesTotalCents: number;
  /** chargesTotalesCents − Σ chargesLotCents : doit toujours être 0. */
  ecartCents: number;
  /** Lots pour lesquels la clé choisie n'avait pas de valeur (repli sur poids égal). */
  lotsDonneeManquante: string[];
};

function moisIndex(date: string): number {
  const [y, m] = date.split("-").map(Number);
  return y * 12 + (m - 1);
}

/** Nombre de mois entiers entre deux dates, bornes incluses (ignore le jour du mois). */
export function moisInclusifs(debut: string, fin: string): number {
  return Math.max(0, moisIndex(fin) - moisIndex(debut) + 1);
}

function chevauchementMois(debutA: string, finA: string, debutB: string, finB: string): number {
  const debut = Math.max(moisIndex(debutA), moisIndex(debutB));
  const fin = Math.min(moisIndex(finA), moisIndex(finB));
  return Math.max(0, fin - debut + 1);
}

/**
 * Répartit `totalCents` selon les poids donnés, en garantissant que la somme du résultat est
 * toujours exactement égale à `totalCents` (allocateur au plus fort reste) — jamais un écart
 * d'arrondi d'un centime perdu ou en trop. Fonctionne aussi avec un total négatif.
 */
export function repartirCents(totalCents: number, poids: number[]): number[] {
  if (poids.length === 0) return [];
  const totalPoids = poids.reduce((s, p) => s + p, 0);
  if (totalPoids <= 0) return repartirCents(totalCents, poids.map(() => 1));

  const bruts = poids.map((p) => (totalCents * p) / totalPoids);
  const resultat = bruts.map((b) => Math.round(b));
  let diff = totalCents - resultat.reduce((s, a) => s + a, 0);

  const ordreParReste = bruts
    .map((b, i) => ({ i, reste: Math.abs(b - Math.round(b)) }))
    .sort((a, b) => b.reste - a.reste);

  let k = 0;
  while (diff !== 0) {
    const idx = ordreParReste[k % ordreParReste.length].i;
    resultat[idx] += diff > 0 ? 1 : -1;
    diff += diff > 0 ? -1 : 1;
    k++;
  }
  return resultat;
}

function poidsLot(lot: LotRepartitionInput, clef: ClefRepartition): { poids: number; manquant: boolean } {
  if (clef === "egale") return { poids: 1, manquant: false };
  if (clef === "surface") return lot.surfaceM2 ? { poids: lot.surfaceM2, manquant: false } : { poids: 1, manquant: true };
  return lot.tantiemes ? { poids: lot.tantiemes, manquant: false } : { poids: 1, manquant: true };
}

export function computeRegularisation(params: {
  periodeDebut: string;
  periodeFin: string;
  clefRepartition: ClefRepartition;
  chargeLignes: ChargeLigne[];
  lots: LotRepartitionInput[];
  occupations: OccupationInput[];
}): RegularisationResult {
  const { periodeDebut, periodeFin, clefRepartition, chargeLignes, lots, occupations } = params;
  const moisPeriode = moisInclusifs(periodeDebut, periodeFin);

  // ----- 1. Prorata mensuel de chaque ligne sur la période demandée -----
  const lignesProratees = chargeLignes
    .map((l) => {
      const moisLigne = moisInclusifs(l.periodeDebut, l.periodeFin);
      const moisChevauchement = chevauchementMois(l.periodeDebut, l.periodeFin, periodeDebut, periodeFin);
      if (moisChevauchement === 0 || moisLigne === 0) return null;
      const montantProrateCents = Math.round((l.montantCents * moisChevauchement) / moisLigne);
      return { lotId: l.lotId, montantProrateCents };
    })
    .filter((l): l is { lotId: string | null; montantProrateCents: number } => l !== null);

  const chargesTotalesCents = lignesProratees.reduce((s, l) => s + l.montantProrateCents, 0);

  // ----- 2. Lignes rattachées à un lot précis vs. réparties sur tout le bien -----
  const lotSpecifiquesCents = new Map<string, number>();
  let bienWideCents = 0;
  for (const l of lignesProratees) {
    if (l.lotId) lotSpecifiquesCents.set(l.lotId, (lotSpecifiquesCents.get(l.lotId) ?? 0) + l.montantProrateCents);
    else bienWideCents += l.montantProrateCents;
  }

  // ----- 3. Répartition de la part "bien entier" entre les lots selon la clé -----
  const poids = lots.map((lot) => poidsLot(lot, clefRepartition));
  const lotsDonneeManquante = lots.filter((_, i) => poids[i].manquant).map((l) => l.lotNom);
  const bienWideParLot = repartirCents(bienWideCents, poids.map((p) => p.poids));

  // ----- 4. Charges totales par lot, puis répartition entre occupants successifs -----
  const parLot: RegularisationLotResult[] = lots.map((lot, i) => {
    const chargesLotCents = (lotSpecifiquesCents.get(lot.lotId) ?? 0) + bienWideParLot[i];

    const occupationsDuLot = occupations
      .filter((o) => o.lotId === lot.lotId)
      .map((o) => {
        const debutOccupation = o.dateEntree ? Math.max(moisIndex(o.dateEntree), moisIndex(periodeDebut)) : moisIndex(periodeDebut);
        const finOccupation = o.dateSortie ? Math.min(moisIndex(o.dateSortie), moisIndex(periodeFin)) : moisIndex(periodeFin);
        const moisOccupes = Math.max(0, finOccupation - debutOccupation + 1);
        return { occupation: o, moisOccupes };
      })
      .filter((o) => o.moisOccupes > 0);

    const moisOccupesTotal = occupationsDuLot.reduce((s, o) => s + o.moisOccupes, 0);
    const moisVacance = Math.max(0, moisPeriode - moisOccupesTotal);
    const poidsAvecVacance = [...occupationsDuLot.map((o) => o.moisOccupes), moisVacance];
    const partsAvecVacance = repartirCents(chargesLotCents, poidsAvecVacance);

    const parLocataire: RegularisationLocataireResult[] = occupationsDuLot.map((o, idx) => {
      const partChargesCents = partsAvecVacance[idx];
      const provisionsCollecteesCents = o.occupation.provisionMensuelleCents * o.moisOccupes;
      return {
        locataireId: o.occupation.locataireId,
        locataireNom: o.occupation.locataireNom,
        moisOccupes: o.moisOccupes,
        provisionsCollecteesCents,
        partChargesCents,
        soldeCents: provisionsCollecteesCents - partChargesCents,
      };
    });
    const chargesNonAffecteesCents = partsAvecVacance[partsAvecVacance.length - 1] ?? 0;

    return {
      lotId: lot.lotId,
      lotNom: lot.lotNom,
      poidsRepartition: poids[i].poids,
      chargesLotCents,
      parLocataire,
      chargesNonAffecteesCents,
      provisionSuggereeMensuelleCents: moisPeriode > 0 ? Math.round(chargesLotCents / moisPeriode) : 0,
    };
  });

  const chargesNonAffecteesTotalCents = parLot.reduce((s, l) => s + l.chargesNonAffecteesCents, 0);
  const ecartCents = chargesTotalesCents - parLot.reduce((s, l) => s + l.chargesLotCents, 0);

  return {
    periodeDebut,
    periodeFin,
    clefRepartition,
    chargesTotalesCents,
    parLot,
    chargesNonAffecteesTotalCents,
    ecartCents,
    lotsDonneeManquante,
  };
}
