import { interetsPeriodeCents, crdADateCents, type EmpruntSci } from "./emprunt-sci";
import { dotationPeriodeCents, valeurNetteComptableCents, type ImmobilisationSci } from "./amortissement-sci";

export type EcritureCompteResultat = {
  date: string;
  type: "encaissement" | "decaissement";
  montantCents: number;
  financement: "banque_sci" | "avance_associe";
  associeMouvementType: "apport" | "avance" | "remboursement" | null;
  empruntId: string | null;
};

export type CompteDeResultat = {
  produitsCents: number;
  chargesCashCents: number;
  chargesInteretsCents: number;
  chargesAmortissementsCents: number;
  chargesTotalesCents: number;
  /** Résultat avant IS — le calcul de l'impôt sur les sociétés n'est pas modélisé ici. */
  resultatCents: number;
};

/**
 * Compte de résultat sur une période, calculé depuis le journal (produits/charges cash),
 * plus les intérêts d'emprunt et les dotations aux amortissements (charges comptables,
 * pas des sorties de trésorerie, donc jamais dans le journal). Les écritures rattachées
 * à un emprunt (emprunt_id) sont exclues des charges "cash" : leur part d'intérêts est
 * recalculée depuis le prêt, leur part de capital réduit seulement la dette (bilan), pas
 * le résultat.
 */
export function computeCompteDeResultat(params: {
  ecritures: EcritureCompteResultat[];
  emprunts: EmpruntSci[];
  immobilisations: ImmobilisationSci[];
  exerciceDebut: string;
  exerciceFin: string;
}): CompteDeResultat {
  const { ecritures, emprunts, immobilisations, exerciceDebut, exerciceFin } = params;
  const ecrituresExercice = ecritures.filter(
    (e) => e.financement === "banque_sci" && e.date >= exerciceDebut && e.date <= exerciceFin
  );

  const produitsCents = ecrituresExercice
    .filter((e) => e.type === "encaissement" && e.associeMouvementType === null)
    .reduce((s, e) => s + e.montantCents, 0);

  const chargesCashCents = ecrituresExercice
    .filter((e) => e.type === "decaissement" && e.associeMouvementType === null && e.empruntId === null)
    .reduce((s, e) => s + e.montantCents, 0);

  const chargesInteretsCents = emprunts.reduce((s, emp) => s + interetsPeriodeCents(emp, exerciceDebut, exerciceFin), 0);

  const chargesAmortissementsCents = immobilisations.reduce(
    (s, immo) => s + dotationPeriodeCents(immo, exerciceDebut, exerciceFin),
    0
  );

  const chargesTotalesCents = chargesCashCents + chargesInteretsCents + chargesAmortissementsCents;

  return {
    produitsCents,
    chargesCashCents,
    chargesInteretsCents,
    chargesAmortissementsCents,
    chargesTotalesCents,
    resultatCents: produitsCents - chargesTotalesCents,
  };
}

export type Bilan = {
  tresorerieCents: number;
  immobilisationsNettesCents: number;
  actifCents: number;
  capitalSocialCents: number;
  resultatReporteCents: number;
  resultatExerciceCents: number;
  comptesCourantsCents: number;
  detteBancaireCents: number;
  passifCents: number;
  /** Actif − Passif : doit être à 0 (aux arrondis près) — sinon une écriture n'a
   *  probablement pas été rattachée à son emprunt, ou une saisie est incohérente. */
  ecartCents: number;
};

export function computeBilan(params: {
  tresorerieCents: number;
  immobilisations: ImmobilisationSci[];
  emprunts: EmpruntSci[];
  dateBilan: string;
  capitalSocialCents: number;
  resultatReporteCents: number;
  resultatExerciceCents: number;
  comptesCourantsCents: number;
}): Bilan {
  const immobilisationsNettesCents = params.immobilisations.reduce(
    (s, immo) => s + valeurNetteComptableCents(immo, params.dateBilan),
    0
  );
  const detteBancaireCents = params.emprunts.reduce((s, emp) => s + crdADateCents(emp, params.dateBilan), 0);
  const actifCents = params.tresorerieCents + immobilisationsNettesCents;
  const passifCents =
    params.capitalSocialCents +
    params.resultatReporteCents +
    params.resultatExerciceCents +
    params.comptesCourantsCents +
    detteBancaireCents;

  return {
    tresorerieCents: params.tresorerieCents,
    immobilisationsNettesCents,
    actifCents,
    capitalSocialCents: params.capitalSocialCents,
    resultatReporteCents: params.resultatReporteCents,
    resultatExerciceCents: params.resultatExerciceCents,
    comptesCourantsCents: params.comptesCourantsCents,
    detteBancaireCents,
    passifCents,
    ecartCents: actifCents - passifCents,
  };
}
