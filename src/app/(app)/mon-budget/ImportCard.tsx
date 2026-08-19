"use client";

import { useActionState, useRef } from "react";
import { importCsv, type ImportState } from "./actions";
import type { Transaction } from "./page";

const initialState: ImportState = {};

export default function ImportCard({ transactions }: { transactions: Transaction[] }) {
  const [state, formAction, pending] = useActionState(importCsv, initialState);
  const formRef = useRef<HTMLFormElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const periods = new Map<string, { total: number; categorized: number }>();
  for (const t of transactions) {
    const key = t.mois_import ?? "Sans période";
    const entry = periods.get(key) ?? { total: 0, categorized: 0 };
    entry.total += 1;
    if (t.categorie_id) entry.categorized += 1;
    periods.set(key, entry);
  }
  const periodRows = [...periods.entries()].sort((a, b) => (a[0] < b[0] ? 1 : -1));

  return (
    <div className="card">
      <h2>Importer un relevé bancaire</h2>
      <div className="card-sub">CSV ou PDF exporté depuis ta banque — une catégorie est proposée automatiquement pour chaque ligne déjà vue par le passé</div>

      <form ref={formRef} action={formAction}>
        <div
          style={{ border: "1.5px dashed var(--line)", borderRadius: 6, padding: 24, textAlign: "center", marginTop: 8, cursor: "pointer" }}
          onClick={() => inputRef.current?.click()}
        >
          <div style={{ fontSize: 24, marginBottom: 8 }}>📄</div>
          <div style={{ fontSize: 12.5, color: "var(--ink-soft)", marginBottom: 10 }}>Clique pour choisir ton fichier CSV ou PDF</div>
          <span style={{ background: "var(--ink)", color: "#fff", padding: "8px 18px", borderRadius: 20, fontSize: 12, cursor: "pointer" }}>
            Choisir un fichier
          </span>
          <input
            ref={inputRef}
            type="file"
            name="file"
            accept=".csv,.pdf,text/csv,application/pdf"
            style={{ display: "none" }}
            onChange={() => formRef.current?.requestSubmit()}
          />
        </div>
      </form>

      <div className="placeholder-note" style={{ marginTop: 10 }}>
        Le PDF est reconnu automatiquement, mais moins fiable que le CSV selon la mise en page de ta banque (le sens dépense/recette peut se tromper — corrigeable ligne par ligne avec le bouton ↕ dans le tableau plus bas). Si ta banque propose les deux formats, préfère le CSV.
      </div>

      {pending && <div className="placeholder-note">Import en cours...</div>}
      {state.error && <div className="auth-error" style={{ marginTop: 12 }}>{state.error}</div>}
      {state.success && (
        <div className="placeholder-note" style={{ background: "var(--sage-soft)", color: "var(--sage)" }}>
          {state.success}
        </div>
      )}

      {periodRows.length > 0 && (
        <table style={{ marginTop: 14 }}>
          <thead>
            <tr><th>Période</th><th>Statut</th><th className="num">Lignes catégorisées</th></tr>
          </thead>
          <tbody>
            {periodRows.map(([period, { total, categorized }]) => (
              <tr key={period}>
                <td>{period}</td>
                <td><span className="pill ok">Importé</span></td>
                <td className="num">{categorized} / {total}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
