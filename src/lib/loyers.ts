export type StatutLoyer = "paye" | "partiel" | "en_attente" | "vacant";

export const STATUT_LOYER_LABELS: Record<StatutLoyer, string> = {
  paye: "Payé",
  partiel: "Partiel",
  en_attente: "En attente",
  vacant: "Vacant",
};

type EcritureLoyer = { lotId: string | null; type: "encaissement" | "decaissement"; montantCents: number; financement: "banque_sci" | "avance_associe" };
type LocataireActif = { loyerHcCents: number; chargesCents: number } | undefined;

/**
 * Statut du loyer d'un lot pour un mois donné, déterminé uniquement à partir des
 * écritures du journal explicitement liées à ce lot (financement="banque_sci") —
 * pas de devinette par montant, qui échoue dès que deux loyers se ressemblent.
 */
export function statutLoyerDuMois(
  lotId: string,
  locataireActif: LocataireActif,
  ecrituresDuMois: EcritureLoyer[]
): { statut: StatutLoyer; encaisseCents: number; attenduCents: number } {
  if (!locataireActif) return { statut: "vacant", encaisseCents: 0, attenduCents: 0 };

  const attenduCents = locataireActif.loyerHcCents + locataireActif.chargesCents;
  const encaisseCents = ecrituresDuMois
    .filter((e) => e.lotId === lotId && e.type === "encaissement" && e.financement === "banque_sci")
    .reduce((s, e) => s + e.montantCents, 0);

  if (attenduCents > 0 && encaisseCents >= attenduCents) return { statut: "paye", encaisseCents, attenduCents };
  if (encaisseCents > 0) return { statut: "partiel", encaisseCents, attenduCents };
  return { statut: "en_attente", encaisseCents, attenduCents };
}
