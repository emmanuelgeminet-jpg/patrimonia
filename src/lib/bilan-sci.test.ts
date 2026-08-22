import { describe, it, expect } from "vitest";
import { computeCompteDeResultat, computeBilan, type EcritureCompteResultat } from "./bilan-sci";
import { crdADateCents, interetsPeriodeCents, type EmpruntSci } from "./emprunt-sci";
import { valeurNetteComptableCents, type ImmobilisationSci } from "./amortissement-sci";

const emprunt: EmpruntSci = { capitalEmprunteCents: 20000000, tauxPct: 3, dureeMois: 240, dateDebut: "2020-01-01" };
const immo: ImmobilisationSci = { valeurAmortissableCents: 36000000, dureeAnnees: 30, dateMiseEnService: "2020-01-01" };

function ecrituresMensuelles(): EcritureCompteResultat[] {
  const ecritures: EcritureCompteResultat[] = [];
  for (let mois = 1; mois <= 12; mois++) {
    const m = String(mois).padStart(2, "0");
    ecritures.push({ date: `2026-${m}-05`, type: "encaissement", montantCents: 100000, financement: "banque_sci", associeMouvementType: null, empruntId: null });
    ecritures.push({ date: `2026-${m}-10`, type: "decaissement", montantCents: 20000, financement: "banque_sci", associeMouvementType: null, empruntId: null });
    // Mensualité de prêt — décaissement réel mais exclu des charges cash (part d'intérêts recalculée séparément).
    ecritures.push({ date: `2026-${m}-15`, type: "decaissement", montantCents: 110920, financement: "banque_sci", associeMouvementType: null, empruntId: "emprunt-1" });
  }
  // Apport d'un associé : encaissement réel sur le compte, mais ne doit pas compter comme un produit.
  ecritures.push({ date: "2026-03-01", type: "encaissement", montantCents: 500000, financement: "banque_sci", associeMouvementType: "apport", empruntId: null });
  // Avance personnelle d'un associé : ne passe jamais par le compte bancaire de la SCI, exclue par le filtre financement.
  ecritures.push({ date: "2026-04-01", type: "decaissement", montantCents: 30000, financement: "avance_associe", associeMouvementType: null, empruntId: null });
  return ecritures;
}

describe("computeCompteDeResultat", () => {
  const resultat = computeCompteDeResultat({
    ecritures: ecrituresMensuelles(),
    emprunts: [emprunt],
    immobilisations: [immo],
    exerciceDebut: "2026-01-01",
    exerciceFin: "2026-12-31",
  });

  it("ne compte que les loyers réels en produits, pas les apports d'associés", () => {
    expect(resultat.produitsCents).toBe(1200000); // 12 × 1000 €, l'apport de 5000 € exclu
  });

  it("exclut du charges cash les mensualités de prêt taguées et les avances hors banque", () => {
    expect(resultat.chargesCashCents).toBe(240000); // 12 × 200 €, ni la mensualité ni l'avance perso
  });

  it("recalcule les intérêts depuis le prêt plutôt que d'utiliser le montant décaissé", () => {
    const interetsAttendus = interetsPeriodeCents(emprunt, "2026-01-01", "2026-12-31");
    expect(resultat.chargesInteretsCents).toBe(interetsAttendus);
    // Les intérêts sur une seule année d'un prêt de 200 000 € à 3 % sont très inférieurs
    // aux 12 mensualités cumulées (13 310,40 €) — sinon la part de capital ne serait pas exclue.
    expect(resultat.chargesInteretsCents).toBeLessThan(110920 * 12);
  });

  it("compte une dotation aux amortissements même si aucune écriture ne la mentionne", () => {
    expect(resultat.chargesAmortissementsCents).toBe(1200000); // 36 000 000 / 30 sur une année pleine
  });

  it("le résultat est cohérent avec produits − charges totales", () => {
    expect(resultat.resultatCents).toBe(resultat.produitsCents - resultat.chargesTotalesCents);
  });
});

describe("computeBilan", () => {
  it("l'écart actif/passif est nul quand toutes les composantes sont correctement renseignées", () => {
    const dateBilan = "2026-12-31";
    const tresorerieCents = 3000000;
    const immobilisationsNettesCents = valeurNetteComptableCents(immo, dateBilan);
    const detteBancaireCents = crdADateCents(emprunt, dateBilan);
    const actifCents = tresorerieCents + immobilisationsNettesCents;

    const capitalSocialCents = 1000000;
    const resultatReporteCents = 200000;
    const resultatExerciceCents = 150000;
    const comptesCourantsCents = actifCents - capitalSocialCents - resultatReporteCents - resultatExerciceCents - detteBancaireCents;

    const bilan = computeBilan({
      tresorerieCents,
      immobilisations: [immo],
      emprunts: [emprunt],
      dateBilan,
      capitalSocialCents,
      resultatReporteCents,
      resultatExerciceCents,
      comptesCourantsCents,
    });

    expect(bilan.ecartCents).toBe(0);
  });

  it("un écart non nul est bien remonté (ex. mensualité non rattachée à son emprunt)", () => {
    const bilan = computeBilan({
      tresorerieCents: 1000000,
      immobilisations: [],
      emprunts: [],
      dateBilan: "2026-12-31",
      capitalSocialCents: 500000,
      resultatReporteCents: 0,
      resultatExerciceCents: 0,
      comptesCourantsCents: 0,
    });
    expect(bilan.ecartCents).toBe(500000); // actif 1 000 000 − passif 500 000
  });
});
