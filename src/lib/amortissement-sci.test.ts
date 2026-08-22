import { describe, it, expect } from "vitest";
import { amortissementCumuleCents, valeurNetteComptableCents, dotationPeriodeCents, type ImmobilisationSci } from "./amortissement-sci";

const immo: ImmobilisationSci = { valeurAmortissableCents: 36000000, dureeAnnees: 30, dateMiseEnService: "2020-01-01" };

describe("amortissementCumuleCents", () => {
  it("est nul avant la mise en service", () => {
    expect(amortissementCumuleCents(immo, "2019-12-31")).toBe(0);
  });

  it("est nul à la date de mise en service", () => {
    expect(amortissementCumuleCents(immo, "2020-01-01")).toBe(0);
  });

  it("est plafonné à 100 % de la valeur amortissable au-delà de la durée", () => {
    expect(amortissementCumuleCents(immo, "2060-01-01")).toBe(immo.valeurAmortissableCents);
  });

  it("vaut la moitié de la valeur amortissable à mi-parcours (convention 30/360)", () => {
    // 15 ans sur 30 = exactement la moitié en 30/360.
    expect(amortissementCumuleCents(immo, "2035-01-01")).toBe(immo.valeurAmortissableCents / 2);
  });
});

describe("valeurNetteComptableCents", () => {
  it("vaut la valeur d'origine avant mise en service", () => {
    expect(valeurNetteComptableCents(immo, "2019-01-01")).toBe(immo.valeurAmortissableCents);
  });

  it("vaut 0 une fois complètement amorti", () => {
    expect(valeurNetteComptableCents(immo, "2060-01-01")).toBe(0);
  });
});

describe("dotationPeriodeCents", () => {
  it("est nulle si la période est inversée", () => {
    expect(dotationPeriodeCents(immo, "2026-06-01", "2026-01-01")).toBe(0);
  });

  it("la somme des dotations sur toute la durée égale la valeur amortissable", () => {
    // En convention 30/360, 30 ans depuis le 1er janvier 2020 se termine le 1er janvier
    // 2050 (10 800 jours) — la boucle doit donc couvrir l'année 2050 elle-même pour
    // capturer ce dernier jour d'amortissement, sinon il manque 1/10800e de la valeur.
    let total = 0;
    for (let annee = 2020; annee <= 2050; annee++) {
      total += dotationPeriodeCents(immo, `${annee}-01-01`, `${annee}-12-31`);
    }
    expect(total).toBe(immo.valeurAmortissableCents);
  });

  it("une dotation annuelle correspond à 1/30e de la valeur amortissable", () => {
    const dotation = dotationPeriodeCents(immo, "2021-01-01", "2021-12-31");
    expect(dotation).toBeCloseTo(immo.valeurAmortissableCents / 30, -1);
  });
});
