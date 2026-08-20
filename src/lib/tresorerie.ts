export type EcritureBanque = { date: string; type: "encaissement" | "decaissement"; montantCents: number };

export type PointMensuel = { mois: string; label: string; soldeCents: number };

const MOIS_LABELS = ["Jan", "Fév", "Mar", "Avr", "Mai", "Juin", "Juil", "Août", "Sep", "Oct", "Nov", "Déc"];

/**
 * Solde bancaire en fin de chaque mois, sur les 12 derniers mois (mois en cours inclus).
 * Même filtre que le KPI "Solde bancaire" : uniquement les écritures banque_sci, à partir de
 * la date d'ouverture si renseignée. Comparaison de dates en texte "YYYY-MM-DD" — "-31" en
 * borne haute fonctionne même sur les mois plus courts grâce à l'ordre lexicographique.
 */
export function soldesMensuels(
  ecritures: EcritureBanque[],
  soldeOuvertureCents: number,
  soldeOuvertureDate: string | null
): PointMensuel[] {
  const filtrees = ecritures.filter((e) => !soldeOuvertureDate || e.date >= soldeOuvertureDate);
  const aujourdHui = new Date();
  const points: PointMensuel[] = [];
  for (let i = 11; i >= 0; i--) {
    const d = new Date(aujourdHui.getFullYear(), aujourdHui.getMonth() - i, 1);
    const mois = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    const finMois = `${mois}-31`;
    const soldeCents = filtrees
      .filter((e) => e.date <= finMois)
      .reduce((s, e) => s + (e.type === "encaissement" ? e.montantCents : -e.montantCents), soldeOuvertureCents);
    points.push({ mois, label: MOIS_LABELS[d.getMonth()], soldeCents });
  }
  return points;
}
