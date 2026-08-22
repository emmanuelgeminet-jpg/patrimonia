import { describe, it, expect } from "vitest";
import { montantEnLettres } from "./bail";

describe("montantEnLettres", () => {
  it("gère zéro et l'unité", () => {
    expect(montantEnLettres(0)).toBe("zéro euro");
    expect(montantEnLettres(100)).toBe("un euro");
    expect(montantEnLettres(200)).toBe("deux euros");
  });

  it("gère les dizaines simples et les nombres de 11 à 16 (formes irrégulières)", () => {
    expect(montantEnLettres(1500)).toBe("quinze euros");
    expect(montantEnLettres(2000)).toBe("vingt euros");
  });

  it("ajoute « et un » pour 21, 31, 41, 51, 61 — mais pas pour 81", () => {
    expect(montantEnLettres(2100)).toBe("vingt et un euros");
    expect(montantEnLettres(3100)).toBe("trente et un euros");
    expect(montantEnLettres(6100)).toBe("soixante et un euros");
    expect(montantEnLettres(8100)).toBe("quatre-vingt-un euros");
  });

  it("gère la forme irrégulière soixante-dix / quatre-vingt-dix", () => {
    expect(montantEnLettres(7000)).toBe("soixante-dix euros");
    expect(montantEnLettres(7100)).toBe("soixante et onze euros");
    expect(montantEnLettres(7200)).toBe("soixante-douze euros");
    expect(montantEnLettres(9000)).toBe("quatre-vingt-dix euros");
    expect(montantEnLettres(9100)).toBe("quatre-vingt-onze euros");
  });

  it("« quatre-vingts » prend un s seul, le perd si suivi d'un chiffre", () => {
    expect(montantEnLettres(8000)).toBe("quatre-vingts euros");
    expect(montantEnLettres(8500)).toBe("quatre-vingt-cinq euros");
  });

  it("« cent » prend un s au pluriel, le perd si suivi d'un chiffre", () => {
    expect(montantEnLettres(10000)).toBe("cent euros");
    expect(montantEnLettres(20000)).toBe("deux cents euros");
    expect(montantEnLettres(20100)).toBe("deux cent un euros");
  });

  it("« mille » est toujours invariable", () => {
    expect(montantEnLettres(100000)).toBe("mille euros");
    expect(montantEnLettres(200000)).toBe("deux mille euros");
    expect(montantEnLettres(100100)).toBe("mille un euros");
  });

  it("un loyer réaliste à 4 chiffres, cas déjà vérifié manuellement (670,00 €)", () => {
    expect(montantEnLettres(67000)).toBe("six cent soixante-dix euros");
  });

  it("ajoute les centimes seulement s'ils sont non nuls, avec le bon singulier/pluriel", () => {
    expect(montantEnLettres(65001)).toBe("six cent cinquante euros et un centime");
    expect(montantEnLettres(65050)).toBe("six cent cinquante euros et cinquante centimes");
    expect(montantEnLettres(65000)).toBe("six cent cinquante euros");
  });
});
