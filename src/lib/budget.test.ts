import { describe, it, expect } from "vitest";
import { parseCsv, parsePdfText, decodeFileContent } from "./budget";

describe("parseCsv", () => {
  it("reconnaît un export avec une colonne montant signée, séparateur point-virgule", () => {
    const csv = "Date;Libelle;Montant\n01/03/2024;SALAIRE MARS;2500,00\n03/03/2024;CARREFOUR;-45,30\n";
    const { transactions, errors } = parseCsv(csv);
    expect(errors).toEqual([]);
    expect(transactions).toEqual([
      { date: "2024-03-01", libelle: "SALAIRE MARS", montant_cents: 250000 },
      { date: "2024-03-03", libelle: "CARREFOUR", montant_cents: -4530 },
    ]);
  });

  it("reconnaît un export avec colonnes Débit / Crédit séparées, séparateur virgule", () => {
    const csv = "Date,Libelle,Debit,Credit\n01/03/2024,SALAIRE MARS,,2500.00\n03/03/2024,CARREFOUR,45.30,\n";
    const { transactions } = parseCsv(csv);
    expect(transactions).toEqual([
      { date: "2024-03-01", libelle: "SALAIRE MARS", montant_cents: 250000 },
      { date: "2024-03-03", libelle: "CARREFOUR", montant_cents: -4530 },
    ]);
  });

  it("accepte des en-têtes de banque avec des mots en plus (repli par correspondance partielle)", () => {
    const csv = "Date operation;Libelle operation;Montant de l'operation\n01/03/2024;VIREMENT RECU;1200,00\n";
    const { transactions, errors } = parseCsv(csv);
    expect(errors).toEqual([]);
    expect(transactions).toEqual([{ date: "2024-03-01", libelle: "VIREMENT RECU", montant_cents: 120000 }]);
  });

  it("gère un BOM en tête de fichier", () => {
    const csv = "﻿Date;Libelle;Montant\n01/03/2024;TEST;10,00\n";
    const { transactions } = parseCsv(csv);
    expect(transactions).toHaveLength(1);
    expect(transactions[0].libelle).toBe("TEST");
  });

  it("gère les montants avec espace insécable comme séparateur de milliers", () => {
    const csv = "Date;Libelle;Montant\n01/03/2024;GROS VIREMENT;1 234,56\n";
    const { transactions } = parseCsv(csv);
    expect(transactions[0].montant_cents).toBe(123456);
  });

  it("accepte les dates au format YYYY-MM-DD", () => {
    const csv = "Date;Libelle;Montant\n2024-03-01;TEST;10,00\n";
    const { transactions } = parseCsv(csv);
    expect(transactions[0].date).toBe("2024-03-01");
  });

  it("signale une ligne illisible sans faire perdre les autres", () => {
    const csv = "Date;Libelle;Montant\n01/03/2024;OK;10,00\nXX/YY/ZZZZ;CASSEE;5,00\n02/03/2024;OK2;20,00\n";
    const { transactions, errors } = parseCsv(csv);
    expect(transactions).toHaveLength(2);
    expect(errors).toHaveLength(1);
    expect(errors[0]).toContain("Ligne 3");
  });

  it("rejette un fichier dont aucune colonne n'est reconnaissable", () => {
    const csv = "Colonne A;Colonne B\nx;y\n";
    const { transactions, errors } = parseCsv(csv);
    expect(transactions).toEqual([]);
    expect(errors[0]).toContain("Colonnes non reconnues");
  });

  it("ignore les lignes entièrement vides", () => {
    const csv = "Date;Libelle;Montant\n01/03/2024;OK;10,00\n;;\n02/03/2024;OK2;20,00\n";
    const { transactions } = parseCsv(csv);
    expect(transactions).toHaveLength(2);
  });
});

describe("decodeFileContent", () => {
  it("décode un buffer UTF-8 valide", () => {
    const buffer = new TextEncoder().encode("Café, 12,50 €").buffer;
    expect(decodeFileContent(buffer)).toBe("Café, 12,50 €");
  });
});

describe("parsePdfText", () => {
  it("déduit dépense/recette depuis deux colonnes de montant (débit puis crédit)", () => {
    const text = "01/03/2024\tSALAIRE\t\t2500,00\n03/03/2024\tCARREFOUR\t45,30\t\n";
    const { transactions } = parsePdfText(text);
    expect(transactions).toEqual([
      { date: "2024-03-01", libelle: "SALAIRE", montant_cents: 250000 },
      { date: "2024-03-03", libelle: "CARREFOUR", montant_cents: -4530 },
    ]);
  });

  it("déduit le signe via des mots-clés quand une seule colonne de montant existe", () => {
    const text = "01/03/2024\tVIREMENT RECU DE TIERS\t120,00\n03/03/2024\tACHAT DIVERS\t15,00\n";
    const { transactions } = parsePdfText(text);
    expect(transactions[0].montant_cents).toBe(12000);
    expect(transactions[1].montant_cents).toBe(-1500);
  });
});
