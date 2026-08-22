import { describe, it, expect } from "vitest";
import {
  mensualiteMensuelleCents,
  nombrePaiementsEffectues,
  crdApresPaiement,
  crdADateCents,
  interetsPeriodeCents,
  type EmpruntSci,
} from "./emprunt-sci";

describe("mensualiteMensuelleCents", () => {
  it("retourne 0 si capital ou durée nuls", () => {
    expect(mensualiteMensuelleCents(0, 3, 240)).toBe(0);
    expect(mensualiteMensuelleCents(20000000, 3, 0)).toBe(0);
  });

  it("répartit uniformément à taux 0", () => {
    expect(mensualiteMensuelleCents(24000000, 0, 240)).toBe(100000);
  });

  it("calcule une mensualité réaliste (200 000 € / 3 % / 20 ans)", () => {
    // Valeur de référence déjà vérifiée manuellement pendant le développement de la
    // trésorerie prévisionnelle (2026-08-21) : ~1 109,20 €/mois.
    const m = mensualiteMensuelleCents(20000000, 3, 240);
    expect(m / 100).toBeCloseTo(1109.2, 1);
  });
});

describe("nombrePaiementsEffectues", () => {
  it("est nul avant la date de départ", () => {
    expect(nombrePaiementsEffectues("2026-01-01", 240, "2025-12-01")).toBe(0);
    expect(nombrePaiementsEffectues("2026-01-01", 240, "2026-01-01")).toBe(0);
  });

  it("est plafonné à la durée du prêt", () => {
    expect(nombrePaiementsEffectues("2006-01-01", 240, "2030-01-01")).toBe(240);
  });

  it("compte les mois calendaires complets écoulés", () => {
    expect(nombrePaiementsEffectues("2026-01-15", 240, "2026-03-15")).toBe(2);
    expect(nombrePaiementsEffectues("2026-01-15", 240, "2026-03-10")).toBe(1);
  });
});

describe("crdApresPaiement", () => {
  const capital = 20000000;
  const taux = 3;
  const duree = 240;

  it("vaut le capital emprunté à k=0", () => {
    expect(crdApresPaiement(capital, taux, duree, 0)).toBe(capital);
  });

  it("vaut 0 une fois toutes les mensualités payées", () => {
    expect(crdApresPaiement(capital, taux, duree, duree)).toBe(0);
    expect(crdApresPaiement(capital, taux, duree, duree + 12)).toBe(0);
  });

  it("décroît strictement de mensualité en mensualité", () => {
    const crd1 = crdApresPaiement(capital, taux, duree, 12);
    const crd2 = crdApresPaiement(capital, taux, duree, 24);
    expect(crd2).toBeLessThan(crd1);
    expect(crd1).toBeLessThan(capital);
  });

  it("répartit le capital linéairement à taux 0", () => {
    expect(crdApresPaiement(24000000, 0, 240, 120)).toBe(12000000);
  });
});

describe("crdADateCents", () => {
  it("vaut le capital initial à la date de départ", () => {
    const emprunt: EmpruntSci = { capitalEmprunteCents: 20000000, tauxPct: 3, dureeMois: 240, dateDebut: "2026-01-01" };
    expect(crdADateCents(emprunt, "2026-01-01")).toBe(20000000);
  });

  it("vaut 0 après la fin du prêt", () => {
    const emprunt: EmpruntSci = { capitalEmprunteCents: 20000000, tauxPct: 3, dureeMois: 24, dateDebut: "2020-01-01" };
    expect(crdADateCents(emprunt, "2030-01-01")).toBe(0);
  });
});

describe("interetsPeriodeCents", () => {
  it("est nul si la période est inversée", () => {
    const emprunt: EmpruntSci = { capitalEmprunteCents: 20000000, tauxPct: 3, dureeMois: 240, dateDebut: "2026-01-01" };
    expect(interetsPeriodeCents(emprunt, "2026-06-01", "2026-01-01")).toBe(0);
  });

  it("la somme des intérêts sur toute la durée correspond à mensualités cumulées − capital", () => {
    const emprunt: EmpruntSci = { capitalEmprunteCents: 20000000, tauxPct: 3, dureeMois: 240, dateDebut: "2020-01-01" };
    const mensualite = mensualiteMensuelleCents(emprunt.capitalEmprunteCents, emprunt.tauxPct, emprunt.dureeMois);
    const totalAttendu = mensualite * emprunt.dureeMois - emprunt.capitalEmprunteCents;
    const totalCalcule = interetsPeriodeCents(emprunt, "2020-01-01", "2040-12-31");
    // Tolérance de quelques centimes dues aux arrondis mensuels successifs.
    expect(Math.abs(totalCalcule - totalAttendu)).toBeLessThan(200);
  });

  it("est nul sur une période avant le début du prêt", () => {
    const emprunt: EmpruntSci = { capitalEmprunteCents: 20000000, tauxPct: 3, dureeMois: 240, dateDebut: "2026-06-01" };
    expect(interetsPeriodeCents(emprunt, "2026-01-01", "2026-05-31")).toBe(0);
  });
});
