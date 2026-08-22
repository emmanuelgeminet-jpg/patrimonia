import { describe, it, expect } from "vitest";
import { projeterTresorerie } from "./tresorerie-previsionnelle";
import { mensualiteMensuelleCents } from "./emprunt-sci";

describe("projeterTresorerie", () => {
  it("génère bien le nombre de mois demandé", () => {
    const points = projeterTresorerie(0, 0, [], 0, 6);
    expect(points).toHaveLength(6);
  });

  it("le solde évolue de loyers − mensualités − charges chaque mois, sans emprunt", () => {
    const points = projeterTresorerie(100000, 50000, [], 10000, 3);
    expect(points[0].soldeCents).toBe(100000 + 50000 - 10000);
    expect(points[1].soldeCents).toBe(points[0].soldeCents + 50000 - 10000);
    expect(points[2].soldeCents).toBe(points[1].soldeCents + 50000 - 10000);
  });

  it("compte la mensualité d'un prêt actif, puis l'arrête à son échéance", () => {
    const dansLongtemps = new Date();
    dansLongtemps.setMonth(dansLongtemps.getMonth() - 238); // encore 2 mensualités à venir sur 240
    const emprunt = { capitalEmprunteCents: 20000000, tauxPct: 3, dureeMois: 240, dateDebut: dansLongtemps.toISOString().slice(0, 10) };
    const mensualiteAttendue = mensualiteMensuelleCents(emprunt.capitalEmprunteCents, emprunt.tauxPct, emprunt.dureeMois);

    const points = projeterTresorerie(0, 0, [emprunt], 0, 6);
    expect(points[0].mensualitesCents).toBeCloseTo(mensualiteAttendue, -1);
    // Les derniers mois de la projection, le prêt est fini : plus de mensualité comptée.
    expect(points[5].mensualitesCents).toBe(0);
  });

  it("un prêt déjà terminé ne pèse pas sur la projection", () => {
    const points = projeterTresorerie(1000000, 0, [{ capitalEmprunteCents: 20000000, tauxPct: 3, dureeMois: 12, dateDebut: "2010-01-01" }], 0, 3);
    expect(points.every((p) => p.mensualitesCents === 0)).toBe(true);
  });
});
