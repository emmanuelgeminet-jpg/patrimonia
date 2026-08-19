"use client";

import { useActionState, useTransition } from "react";
import { addEmprunt, deleteEmprunt, type SaveState } from "./actions";
import { formatEuros } from "@/lib/budget";
import DocumentsCell, { type DocItem } from "./DocumentsCell";

export type Emprunt = {
  id: string;
  objet: string;
  capital_emprunte_cents: number | null;
  taux_pct: number | null;
  duree_mois: number | null;
  mensualite_cents: number | null;
  crd_cents: number | null;
};

const initialState: SaveState = {};

export default function EmpruntsSection({
  emprunts,
  docsByEntity = {},
}: {
  emprunts: Emprunt[];
  docsByEntity?: Record<string, DocItem[]>;
}) {
  const [state, formAction, pending] = useActionState(addEmprunt, initialState);
  const [, startTransition] = useTransition();

  return (
    <div className="card">
      <h2>7. Emprunts en cours</h2>
      <table>
        <thead>
          <tr>
            <th>Objet</th><th className="num">Capital</th><th className="num">Taux</th>
            <th>Durée</th><th className="num">Mensualité</th><th className="num">CRD</th><th>Documents</th><th></th>
          </tr>
        </thead>
        <tbody>
          {emprunts.length === 0 && (
            <tr><td colSpan={8} style={{ color: "var(--ink-soft)", fontStyle: "italic" }}>Aucun emprunt renseigné</td></tr>
          )}
          {emprunts.map((e) => (
            <tr key={e.id}>
              <td>{e.objet}</td>
              <td className="num">{e.capital_emprunte_cents ? formatEuros(e.capital_emprunte_cents) : "—"}</td>
              <td className="num">{e.taux_pct ? `${e.taux_pct} %` : "—"}</td>
              <td>{e.duree_mois ? `${Math.round(e.duree_mois / 12)} ans` : "—"}</td>
              <td className="num">{e.mensualite_cents ? formatEuros(e.mensualite_cents) : "—"}</td>
              <td className="num">{e.crd_cents ? formatEuros(e.crd_cents) : "—"}</td>
              <td>
                <DocumentsCell entityType="emprunt" entityId={e.id} documents={docsByEntity[e.id] ?? []} />
              </td>
              <td>
                <span
                  style={{ color: "var(--brick)", cursor: "pointer", fontSize: 11 }}
                  onClick={() => startTransition(() => { deleteEmprunt(e.id); })}
                >
                  Supprimer
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <form action={formAction} style={{ display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center", marginTop: 10 }}>
        <input name="objet" placeholder="Objet (ex : Résidence principale)" style={{ maxWidth: 180 }} required />
        <input name="capital" placeholder="Capital emprunté €" style={{ maxWidth: 120 }} />
        <input name="taux" placeholder="Taux %" style={{ maxWidth: 70 }} />
        <input name="duree_mois" placeholder="Durée (mois)" style={{ maxWidth: 100 }} />
        <input name="mensualite" placeholder="Mensualité €" style={{ maxWidth: 100 }} />
        <input name="crd" placeholder="CRD actuel €" style={{ maxWidth: 100 }} />
        <button
          type="submit"
          disabled={pending}
          style={{ background: "var(--sage)", color: "#fff", border: "none", padding: "6px 14px", borderRadius: 20, fontSize: 11.5, cursor: "pointer", fontFamily: "inherit" }}
        >
          + Ajouter
        </button>
      </form>
      {state.error && <div style={{ color: "var(--brick)", fontSize: 11, marginTop: 4 }}>{state.error}</div>}
    </div>
  );
}
