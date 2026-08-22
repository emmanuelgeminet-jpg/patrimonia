import { describe, it, expect } from "vitest";
import { statutLoyerDuMois } from "./loyers";

describe("statutLoyerDuMois", () => {
  it("est vacant sans locataire actif", () => {
    const { statut } = statutLoyerDuMois("lot-1", undefined, []);
    expect(statut).toBe("vacant");
  });

  it("est en attente sans aucun encaissement", () => {
    const { statut } = statutLoyerDuMois("lot-1", { loyerHcCents: 60000, chargesCents: 5000 }, []);
    expect(statut).toBe("en_attente");
  });

  it("est partiel si le montant encaissé est inférieur à l'attendu", () => {
    const ecritures = [{ lotId: "lot-1", type: "encaissement" as const, montantCents: 30000, financement: "banque_sci" as const }];
    const { statut, encaisseCents, attenduCents } = statutLoyerDuMois("lot-1", { loyerHcCents: 60000, chargesCents: 5000 }, ecritures);
    expect(statut).toBe("partiel");
    expect(encaisseCents).toBe(30000);
    expect(attenduCents).toBe(65000);
  });

  it("est payé si le montant encaissé couvre au moins l'attendu", () => {
    const ecritures = [{ lotId: "lot-1", type: "encaissement" as const, montantCents: 65000, financement: "banque_sci" as const }];
    const { statut } = statutLoyerDuMois("lot-1", { loyerHcCents: 60000, chargesCents: 5000 }, ecritures);
    expect(statut).toBe("paye");
  });

  it("ignore les écritures d'un autre lot ou financées par avance d'associé", () => {
    const ecritures = [
      { lotId: "lot-2", type: "encaissement" as const, montantCents: 65000, financement: "banque_sci" as const },
      { lotId: "lot-1", type: "encaissement" as const, montantCents: 65000, financement: "avance_associe" as const },
    ];
    const { statut } = statutLoyerDuMois("lot-1", { loyerHcCents: 60000, chargesCents: 5000 }, ecritures);
    expect(statut).toBe("en_attente");
  });

  it("ignore les décaissements même s'ils sont sur le bon lot", () => {
    const ecritures = [{ lotId: "lot-1", type: "decaissement" as const, montantCents: 65000, financement: "banque_sci" as const }];
    const { statut } = statutLoyerDuMois("lot-1", { loyerHcCents: 60000, chargesCents: 5000 }, ecritures);
    expect(statut).toBe("en_attente");
  });
});
