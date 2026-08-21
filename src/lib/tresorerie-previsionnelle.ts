import { mensualiteMensuelleCents, nombrePaiementsEffectues, type EmpruntSci } from "@/lib/emprunt-sci";

export type PointPrevisionnel = {
  mois: string;
  label: string;
  soldeCents: number;
  loyersCents: number;
  mensualitesCents: number;
  chargesEstimeesCents: number;
};

const MOIS_LABELS = ["Jan", "Fév", "Mar", "Avr", "Mai", "Juin", "Juil", "Août", "Sep", "Oct", "Nov", "Déc"];

/**
 * Projection du solde bancaire SCI sur les prochains mois — hypothèses volontairement
 * simples et explicites plutôt qu'un modèle optimiste :
 * - Loyers : somme des locataires actifs aujourd'hui, supposés inchangés (pas de départ/
 *   arrivée anticipé — l'appli ne peut pas le deviner).
 * - Mensualités de prêt : calculées depuis les conditions d'origine de chaque emprunt actif,
 *   s'arrêtent automatiquement à l'échéance du prêt.
 * - Charges diverses (hors prêt) : moyenne mensuelle réelle des décaissements banque_sci non
 *   rattachés à un emprunt, sur l'historique disponible — pas ignorées comme si elles
 *   n'existaient pas (assurance, taxe foncière, entretien...), pas non plus une fausse
 *   précision : un seul chiffre moyen, explicitement présenté comme une estimation.
 */
export function projeterTresorerie(
  soldeActuelCents: number,
  loyersMensuelsCents: number,
  emprunts: EmpruntSci[],
  chargesMensuellesEstimeesCents: number,
  nombreMois = 12
): PointPrevisionnel[] {
  const points: PointPrevisionnel[] = [];
  let solde = soldeActuelCents;
  const aujourdHui = new Date();

  for (let i = 1; i <= nombreMois; i++) {
    const d = new Date(aujourdHui.getFullYear(), aujourdHui.getMonth() + i, 1);
    const mois = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    const dateReference = `${mois}-28`;

    const mensualitesCents = emprunts.reduce((s, e) => {
      const encoreActif = nombrePaiementsEffectues(e.dateDebut, e.dureeMois, dateReference) < e.dureeMois;
      return s + (encoreActif ? mensualiteMensuelleCents(e.capitalEmprunteCents, e.tauxPct, e.dureeMois) : 0);
    }, 0);

    solde = solde + loyersMensuelsCents - mensualitesCents - chargesMensuellesEstimeesCents;
    points.push({
      mois,
      label: `${MOIS_LABELS[d.getMonth()]} ${String(d.getFullYear()).slice(2)}`,
      soldeCents: Math.round(solde),
      loyersCents: loyersMensuelsCents,
      mensualitesCents: Math.round(mensualitesCents),
      chargesEstimeesCents: Math.round(chargesMensuellesEstimeesCents),
    });
  }
  return points;
}
