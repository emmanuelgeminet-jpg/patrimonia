import { describe, it, expect } from "vitest";
import { soldesMensuels } from "./tresorerie";

describe("soldesMensuels", () => {
  it("retourne 12 points se terminant au mois en cours", () => {
    const points = soldesMensuels([], 100000, null);
    expect(points).toHaveLength(12);
    const moisEnCours = new Date().toISOString().slice(0, 7);
    expect(points[11].mois).toBe(moisEnCours);
  });

  it("le solde de départ se retrouve sans aucune écriture", () => {
    const points = soldesMensuels([], 250000, null);
    expect(points.every((p) => p.soldeCents === 250000)).toBe(true);
  });

  it("ignore les écritures antérieures à la date de reprise", () => {
    const moisEnCours = new Date().toISOString().slice(0, 7);
    const points = soldesMensuels(
      [{ date: "2000-01-01", type: "encaissement", montantCents: 999999 }],
      100000,
      `${moisEnCours}-01`
    );
    expect(points[points.length - 1].soldeCents).toBe(100000);
  });

  it("cumule encaissements et décaissements jusqu'à chaque fin de mois", () => {
    const moisEnCours = new Date().toISOString().slice(0, 7);
    const points = soldesMensuels(
      [
        { date: `${moisEnCours}-05`, type: "encaissement", montantCents: 50000 },
        { date: `${moisEnCours}-10`, type: "decaissement", montantCents: 20000 },
      ],
      100000,
      null
    );
    expect(points[points.length - 1].soldeCents).toBe(100000 + 50000 - 20000);
  });
});
