import { describe, it, expect } from "vitest";
import { mensualiteEmprunt, calculerTRI, computeAnalyseBienKpis, crdApresAnnees, type AnalyseBienInput } from "./analyse-bien";

describe("mensualiteEmprunt", () => {
  it("retourne 0 sans capital ni durée", () => {
    expect(mensualiteEmprunt(0, 3, 20)).toBe(0);
    expect(mensualiteEmprunt(200000000, 3, 0)).toBe(0);
  });

  it("répartit uniformément à taux 0", () => {
    expect(mensualiteEmprunt(24000000, 0, 20)).toBe(100000);
  });
});

describe("crdApresAnnees", () => {
  it("vaut le capital initial avant tout remboursement", () => {
    expect(crdApresAnnees(20000000, 3, 20, 0)).toBe(20000000);
  });

  it("est nul au-delà de la durée du prêt", () => {
    expect(crdApresAnnees(20000000, 3, 20, 25)).toBe(0);
  });
});

describe("calculerTRI", () => {
  it("retourne null si le premier flux n'est pas négatif", () => {
    expect(calculerTRI([1000, -500, -600])).toBeNull();
  });

  it("retourne null avec moins de deux flux", () => {
    expect(calculerTRI([-1000])).toBeNull();
  });

  it("retrouve un TRI simple à 10 % (−1000 puis +1100 un an après)", () => {
    const tri = calculerTRI([-1000, 1100]);
    expect(tri).not.toBeNull();
    expect(tri!).toBeCloseTo(10, 0);
  });

  it("retourne null quand tous les flux sont du même signe", () => {
    expect(calculerTRI([-1000, -200, -300])).toBeNull();
  });
});

function baseInput(overrides: Partial<AnalyseBienInput> = {}): AnalyseBienInput {
  return {
    prixOffreCents: 20000000,
    fraisNotaireCents: 1600000,
    travauxEstimesCents: 0,
    montantEmprunteCents: 20000000,
    tauxPct: 3,
    dureeAnnees: 20,
    chargesAnnuellesCents: 0,
    surfaceM2: 50,
    lots: [{ loyerHcCents: 100000, chargesCents: 10000 }],
    ...overrides,
  };
}

describe("computeAnalyseBienKpis", () => {
  it("calcule un coût total = prix + notaire + travaux", () => {
    const kpis = computeAnalyseBienKpis(baseInput({ travauxEstimesCents: 500000 }));
    expect(kpis.coutTotalCents).toBe(20000000 + 1600000 + 500000);
  });

  it("la rentabilité nette est toujours inférieure ou égale à la brute (charges soustraites)", () => {
    const kpis = computeAnalyseBienKpis(baseInput({ taxeFonciereCents: 100000, chargesCoproCents: 50000 }));
    expect(kpis.rentabiliteNette!).toBeLessThanOrEqual(kpis.rentabiliteBrute!);
  });

  it("la rentabilité net-nette est toujours inférieure ou égale à la nette (IS estimé soustrait)", () => {
    const kpis = computeAnalyseBienKpis(baseInput());
    expect(kpis.rentabiliteNetNette!).toBeLessThanOrEqual(kpis.rentabiliteNette!);
  });

  it("la vue banque à 70 % pondère les loyers bruts, pas les loyers déjà nets de vacance", () => {
    const kpis = computeAnalyseBienKpis(baseInput({ vacanceLocativePct: 10 }));
    expect(kpis.vueBanque70.loyersPonderesCents).toBe(kpis.loyersHcAnnuelsCents * 0.7);
  });

  it("le prix au m² est nul si la surface n'est pas renseignée", () => {
    const kpis = computeAnalyseBienKpis(baseInput({ surfaceM2: null }));
    expect(kpis.prixM2Cents).toBeNull();
  });

  it("le cash-on-cash n'est calculable que si un apport est renseigné", () => {
    const sansApport = computeAnalyseBienKpis(baseInput());
    expect(sansApport.cashOnCash).toBeNull();
    const avecApport = computeAnalyseBienKpis(baseInput({ apportCents: 5000000 }));
    expect(avecApport.cashOnCash).not.toBeNull();
  });
});
