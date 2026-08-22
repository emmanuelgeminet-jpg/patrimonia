import { describe, it, expect } from "vitest";
import { computeRegularisation, moisInclusifs, repartirCents, type ChargeLigne, type LotRepartitionInput, type OccupationInput } from "./charges-regularisation";

describe("moisInclusifs", () => {
  it("vaut 1 pour un seul mois", () => {
    expect(moisInclusifs("2026-03-01", "2026-03-31")).toBe(1);
  });

  it("compte à cheval sur une année", () => {
    expect(moisInclusifs("2025-11-01", "2026-02-28")).toBe(4);
  });

  it("ignore le jour du mois — deux dates du même mois comptent pour 1, quel que soit le jour", () => {
    expect(moisInclusifs("2026-01-01", "2026-01-31")).toBe(1);
    expect(moisInclusifs("2026-01-31", "2026-01-01")).toBe(1);
  });
});

describe("repartirCents", () => {
  it("la somme du résultat est toujours exactement égale au total", () => {
    expect(repartirCents(10000, [1, 1, 1]).reduce((s, x) => s + x, 0)).toBe(10000);
    expect(repartirCents(10000, [1, 1, 1])).toEqual(expect.arrayContaining([3334]));
  });

  it("un seul poids non nul reçoit tout", () => {
    expect(repartirCents(5000, [0, 10, 0])).toEqual([0, 5000, 0]);
  });

  it("tous les poids nuls retombe sur une répartition égale", () => {
    const resultat = repartirCents(9000, [0, 0, 0]);
    expect(resultat.reduce((s, x) => s + x, 0)).toBe(9000);
    expect(resultat).toEqual([3000, 3000, 3000]);
  });

  it("fonctionne avec un total négatif", () => {
    const resultat = repartirCents(-10000, [1, 1, 1]);
    expect(resultat.reduce((s, x) => s + x, 0)).toBe(-10000);
  });
});

const lotsDeuxEgaux: LotRepartitionInput[] = [
  { lotId: "lot-a", lotNom: "Lot A", surfaceM2: null, tantiemes: null },
  { lotId: "lot-b", lotNom: "Lot B", surfaceM2: null, tantiemes: null },
];

function occupationPleinePeriode(lotId: string, locataireId: string, provisionCents: number): OccupationInput {
  return { locataireId, locataireNom: locataireId, lotId, dateEntree: null, dateSortie: null, provisionMensuelleCents: provisionCents };
}

describe("computeRegularisation — répartition entre lots", () => {
  it("clé égale : chaque lot reçoit exactement la moitié", () => {
    const chargeLignes: ChargeLigne[] = [{ id: "c1", montantCents: 120000, lotId: null, periodeDebut: "2025-01-01", periodeFin: "2025-12-31" }];
    const occupations = [occupationPleinePeriode("lot-a", "loc-a", 10000), occupationPleinePeriode("lot-b", "loc-b", 10000)];
    const resultat = computeRegularisation({ periodeDebut: "2025-01-01", periodeFin: "2025-12-31", clefRepartition: "egale", chargeLignes, lots: lotsDeuxEgaux, occupations });

    expect(resultat.parLot[0].chargesLotCents).toBe(60000);
    expect(resultat.parLot[1].chargesLotCents).toBe(60000);
    expect(resultat.ecartCents).toBe(0);
  });

  it("clé surface : proportionnel exactement aux surfaces", () => {
    const lots: LotRepartitionInput[] = [
      { lotId: "lot-a", lotNom: "Lot A", surfaceM2: 30, tantiemes: null },
      { lotId: "lot-b", lotNom: "Lot B", surfaceM2: 70, tantiemes: null },
    ];
    const chargeLignes: ChargeLigne[] = [{ id: "c1", montantCents: 100000, lotId: null, periodeDebut: "2025-01-01", periodeFin: "2025-12-31" }];
    const occupations = [occupationPleinePeriode("lot-a", "loc-a", 0), occupationPleinePeriode("lot-b", "loc-b", 0)];
    const resultat = computeRegularisation({ periodeDebut: "2025-01-01", periodeFin: "2025-12-31", clefRepartition: "surface", chargeLignes, lots, occupations });

    expect(resultat.parLot[0].chargesLotCents).toBe(30000);
    expect(resultat.parLot[1].chargesLotCents).toBe(70000);
  });

  it("clé tantièmes : proportionnel exactement aux millièmes", () => {
    const lots: LotRepartitionInput[] = [
      { lotId: "lot-a", lotNom: "Lot A", surfaceM2: null, tantiemes: 300 },
      { lotId: "lot-b", lotNom: "Lot B", surfaceM2: null, tantiemes: 700 },
    ];
    const chargeLignes: ChargeLigne[] = [{ id: "c1", montantCents: 100000, lotId: null, periodeDebut: "2025-01-01", periodeFin: "2025-12-31" }];
    const occupations = [occupationPleinePeriode("lot-a", "loc-a", 0), occupationPleinePeriode("lot-b", "loc-b", 0)];
    const resultat = computeRegularisation({ periodeDebut: "2025-01-01", periodeFin: "2025-12-31", clefRepartition: "tantiemes", chargeLignes, lots, occupations });

    expect(resultat.parLot[0].chargesLotCents).toBe(30000);
    expect(resultat.parLot[1].chargesLotCents).toBe(70000);
  });

  it("une ligne rattachée à un lot précis va à 100 % sur ce lot, même en clé surface", () => {
    const lots: LotRepartitionInput[] = [
      { lotId: "lot-a", lotNom: "Lot A", surfaceM2: 30, tantiemes: null },
      { lotId: "lot-b", lotNom: "Lot B", surfaceM2: 70, tantiemes: null },
    ];
    const chargeLignes: ChargeLigne[] = [{ id: "c1", montantCents: 50000, lotId: "lot-a", periodeDebut: "2025-01-01", periodeFin: "2025-12-31" }];
    const occupations = [occupationPleinePeriode("lot-a", "loc-a", 0), occupationPleinePeriode("lot-b", "loc-b", 0)];
    const resultat = computeRegularisation({ periodeDebut: "2025-01-01", periodeFin: "2025-12-31", clefRepartition: "surface", chargeLignes, lots, occupations });

    expect(resultat.parLot[0].chargesLotCents).toBe(50000);
    expect(resultat.parLot[1].chargesLotCents).toBe(0);
  });

  it("clé sans donnée renseignée : repli sur poids égal, signalé dans lotsDonneeManquante", () => {
    const chargeLignes: ChargeLigne[] = [{ id: "c1", montantCents: 100000, lotId: null, periodeDebut: "2025-01-01", periodeFin: "2025-12-31" }];
    const occupations = [occupationPleinePeriode("lot-a", "loc-a", 0), occupationPleinePeriode("lot-b", "loc-b", 0)];
    const resultat = computeRegularisation({ periodeDebut: "2025-01-01", periodeFin: "2025-12-31", clefRepartition: "tantiemes", chargeLignes, lots: lotsDeuxEgaux, occupations });

    expect(resultat.lotsDonneeManquante).toEqual(["Lot A", "Lot B"]);
    expect(resultat.parLot[0].chargesLotCents).toBe(50000);
    expect(resultat.parLot[1].chargesLotCents).toBe(50000);
    expect(resultat.ecartCents).toBe(0);
  });
});

describe("computeRegularisation — occupation et prorata temporel", () => {
  it("un locataire entré en cours de période ne paie que ses mois d'occupation", () => {
    const chargeLignes: ChargeLigne[] = [{ id: "c1", montantCents: 120000, lotId: "lot-a", periodeDebut: "2025-01-01", periodeFin: "2025-12-31" }];
    const occupations: OccupationInput[] = [{ locataireId: "loc-a", locataireNom: "A", lotId: "lot-a", dateEntree: "2025-07-01", dateSortie: null, provisionMensuelleCents: 5000 }];
    const resultat = computeRegularisation({ periodeDebut: "2025-01-01", periodeFin: "2025-12-31", clefRepartition: "egale", chargeLignes, lots: [lotsDeuxEgaux[0]], occupations });

    const lot = resultat.parLot[0];
    expect(lot.parLocataire[0].moisOccupes).toBe(6);
    expect(lot.parLocataire[0].provisionsCollecteesCents).toBe(30000);
    expect(lot.parLocataire[0].partChargesCents).toBe(60000); // 6/12 de 120 000
    expect(lot.chargesNonAffecteesCents).toBe(60000); // les 6 mois avant son arrivée
  });

  it("un locataire sorti en cours de période ne paie que jusqu'à son départ", () => {
    const chargeLignes: ChargeLigne[] = [{ id: "c1", montantCents: 120000, lotId: "lot-a", periodeDebut: "2025-01-01", periodeFin: "2025-12-31" }];
    const occupations: OccupationInput[] = [{ locataireId: "loc-a", locataireNom: "A", lotId: "lot-a", dateEntree: null, dateSortie: "2025-04-30", provisionMensuelleCents: 5000 }];
    const resultat = computeRegularisation({ periodeDebut: "2025-01-01", periodeFin: "2025-12-31", clefRepartition: "egale", chargeLignes, lots: [lotsDeuxEgaux[0]], occupations });

    expect(resultat.parLot[0].parLocataire[0].moisOccupes).toBe(4);
  });

  it("deux locataires successifs sans trou : leurs parts somment exactement à la charge du lot", () => {
    const chargeLignes: ChargeLigne[] = [{ id: "c1", montantCents: 100000, lotId: "lot-a", periodeDebut: "2025-01-01", periodeFin: "2025-12-31" }];
    const occupations: OccupationInput[] = [
      { locataireId: "loc-a", locataireNom: "A", lotId: "lot-a", dateEntree: null, dateSortie: "2025-06-30", provisionMensuelleCents: 5000 },
      { locataireId: "loc-b", locataireNom: "B", lotId: "lot-a", dateEntree: "2025-07-01", dateSortie: null, provisionMensuelleCents: 5000 },
    ];
    const resultat = computeRegularisation({ periodeDebut: "2025-01-01", periodeFin: "2025-12-31", clefRepartition: "egale", chargeLignes, lots: [lotsDeuxEgaux[0]], occupations });

    const lot = resultat.parLot[0];
    const sommeParLocataires = lot.parLocataire.reduce((s, l) => s + l.partChargesCents, 0);
    expect(sommeParLocataires).toBe(lot.chargesLotCents);
    expect(lot.chargesNonAffecteesCents).toBe(0);
  });
});

describe("computeRegularisation — prorata des lignes de charge", () => {
  it("une ligne annuelle proratée sur un semestre de régularisation", () => {
    const chargeLignes: ChargeLigne[] = [{ id: "c1", montantCents: 120000, lotId: "lot-a", periodeDebut: "2024-01-01", periodeFin: "2024-12-31" }];
    const occupations = [occupationPleinePeriode("lot-a", "loc-a", 0)];
    const resultat = computeRegularisation({ periodeDebut: "2024-07-01", periodeFin: "2024-12-31", clefRepartition: "egale", chargeLignes, lots: [lotsDeuxEgaux[0]], occupations });

    expect(resultat.chargesTotalesCents).toBe(60000); // moitié de l'année
  });

  it("une ligne totalement hors période est exclue", () => {
    const chargeLignes: ChargeLigne[] = [{ id: "c1", montantCents: 120000, lotId: "lot-a", periodeDebut: "2023-01-01", periodeFin: "2023-12-31" }];
    const occupations = [occupationPleinePeriode("lot-a", "loc-a", 0)];
    const resultat = computeRegularisation({ periodeDebut: "2025-01-01", periodeFin: "2025-12-31", clefRepartition: "egale", chargeLignes, lots: [lotsDeuxEgaux[0]], occupations });

    expect(resultat.chargesTotalesCents).toBe(0);
  });
});

describe("computeRegularisation — garde-fous", () => {
  it("l'écart reste à 0 avec un montant non divisible et un lot totalement vacant", () => {
    const lots: LotRepartitionInput[] = [
      { lotId: "lot-a", lotNom: "Lot A", surfaceM2: null, tantiemes: null },
      { lotId: "lot-b", lotNom: "Lot B", surfaceM2: null, tantiemes: null },
      { lotId: "lot-c", lotNom: "Lot C", surfaceM2: null, tantiemes: null },
    ];
    const chargeLignes: ChargeLigne[] = [{ id: "c1", montantCents: 10000, lotId: null, periodeDebut: "2025-01-01", periodeFin: "2025-12-31" }];
    // Lot C reste vacant toute la période (aucune occupation).
    const occupations = [occupationPleinePeriode("lot-a", "loc-a", 1000), occupationPleinePeriode("lot-b", "loc-b", 1000)];

    const resultat = computeRegularisation({ periodeDebut: "2025-01-01", periodeFin: "2025-12-31", clefRepartition: "egale", chargeLignes, lots, occupations });

    expect(resultat.ecartCents).toBe(0);
    const totalParLot = resultat.parLot.reduce((s, l) => s + l.chargesLotCents, 0);
    expect(totalParLot).toBe(10000);
    expect(resultat.parLot[2].chargesNonAffecteesCents).toBe(resultat.parLot[2].chargesLotCents); // lot C entièrement vacant
  });
});
