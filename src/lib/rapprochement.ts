import type { ParsedTransaction } from "./budget";

export type EcritureRapprochement = {
  id: string;
  date: string;
  type: "encaissement" | "decaissement";
  montantCents: number;
  libelle: string;
};

export type ResultatRapprochement = {
  matches: number;
  lignesBancairesSansEcriture: ParsedTransaction[];
  ecrituresSansLigneBancaire: EcritureRapprochement[];
};

function joursEntre(a: string, b: string): number {
  return Math.abs((new Date(a).getTime() - new Date(b).getTime()) / 86400000);
}

/**
 * Rapproche les lignes d'un relevé bancaire réel avec les écritures du journal (financement
 * banque_sci uniquement — une avance personnelle n'apparaît jamais sur le relevé de la SCI).
 * Appariement par montant exact (signé) + date la plus proche dans une tolérance donnée ;
 * chaque écriture n'est utilisée qu'une seule fois. Ce qui reste des deux côtés est ce qui
 * mérite d'être vérifié : une ligne bancaire orpheline (oubliée dans le journal) ou une
 * écriture orpheline (montant/date faux, ou mal taguée banque_sci).
 */
export function rapprocher(
  lignesBancaires: ParsedTransaction[],
  ecritures: EcritureRapprochement[],
  toleranceJours = 3
): ResultatRapprochement {
  const ecrituresRestantes = [...ecritures];
  const lignesSansMatch: ParsedTransaction[] = [];
  let matches = 0;

  for (const ligne of lignesBancaires) {
    const montantSigne = ligne.montant_cents;
    let meilleurIndex = -1;
    let meilleurEcart = Infinity;
    ecrituresRestantes.forEach((e, i) => {
      const montantEcritureSigne = e.type === "encaissement" ? e.montantCents : -e.montantCents;
      if (montantEcritureSigne !== montantSigne) return;
      const ecart = joursEntre(ligne.date, e.date);
      if (ecart <= toleranceJours && ecart < meilleurEcart) {
        meilleurEcart = ecart;
        meilleurIndex = i;
      }
    });
    if (meilleurIndex !== -1) {
      ecrituresRestantes.splice(meilleurIndex, 1);
      matches++;
    } else {
      lignesSansMatch.push(ligne);
    }
  }

  return { matches, lignesBancairesSansEcriture: lignesSansMatch, ecrituresSansLigneBancaire: ecrituresRestantes };
}
