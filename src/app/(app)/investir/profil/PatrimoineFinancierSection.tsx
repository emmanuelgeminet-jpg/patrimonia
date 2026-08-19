"use client";

import { useActionState, useTransition } from "react";
import { addPatrimoineLigne, deletePatrimoineLigne, type SaveState } from "./actions";
import { formatEuros } from "@/lib/budget";
import DocumentsCell, { type DocItem } from "./DocumentsCell";

export type PatrimoineLigne = {
  id: string;
  categorie: string;
  etablissement: string | null;
  type_produit: string | null;
  titulaire: string | null;
  valeur_cents: number;
};

const initialState: SaveState = {};

export default function PatrimoineFinancierSection({
  categorie,
  titre,
  lignes,
  docsByEntity = {},
}: {
  categorie: string;
  titre: string;
  lignes: PatrimoineLigne[];
  docsByEntity?: Record<string, DocItem[]>;
}) {
  const [state, formAction, pending] = useActionState(addPatrimoineLigne, initialState);
  const [, startTransition] = useTransition();
  const total = lignes.reduce((s, l) => s + l.valeur_cents, 0);

  return (
    <div style={{ marginBottom: 20 }}>
      <div style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: ".07em", color: "var(--ink-soft)", fontWeight: 600, margin: "14px 0 8px" }}>
        {titre}
      </div>
      <table>
        <thead>
          <tr><th>Établissement</th><th>Type</th><th>Titulaire</th><th className="num">Valeur</th><th>Documents</th><th></th></tr>
        </thead>
        <tbody>
          {lignes.length === 0 && (
            <tr><td colSpan={6} style={{ color: "var(--ink-soft)", fontStyle: "italic" }}>Aucune ligne renseignée</td></tr>
          )}
          {lignes.map((l) => (
            <tr key={l.id}>
              <td>{l.etablissement ?? "—"}</td>
              <td>{l.type_produit ?? "—"}</td>
              <td>{l.titulaire ?? "—"}</td>
              <td className="num">{formatEuros(l.valeur_cents)}</td>
              <td>
                <DocumentsCell entityType="patrimoine_ligne" entityId={l.id} documents={docsByEntity[l.id] ?? []} />
              </td>
              <td>
                <span
                  style={{ color: "var(--brick)", cursor: "pointer", fontSize: 11 }}
                  onClick={() => startTransition(() => { deletePatrimoineLigne(l.id); })}
                >
                  Supprimer
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <form action={formAction} style={{ display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center", marginTop: 8 }}>
        <input type="hidden" name="categorie" value={categorie} />
        <input name="etablissement" placeholder="Établissement" style={{ maxWidth: 140 }} />
        <input name="type_produit" placeholder="Type / produit" style={{ maxWidth: 140 }} />
        <input name="titulaire" placeholder="Titulaire" style={{ maxWidth: 110 }} />
        <input name="valeur" placeholder="Valeur €" style={{ maxWidth: 90 }} />
        <button
          type="submit"
          disabled={pending}
          style={{ background: "var(--sage)", color: "#fff", border: "none", padding: "6px 14px", borderRadius: 20, fontSize: 11.5, cursor: "pointer", fontFamily: "inherit" }}
        >
          + Ajouter
        </button>
      </form>
      {state.error && <div style={{ color: "var(--brick)", fontSize: 11, marginTop: 4 }}>{state.error}</div>}

      <div className="rentab-row total" style={{ marginTop: 6 }}>
        <div className="lbl">Sous-total {titre}</div>
        <div className="val">{formatEuros(total)}</div>
      </div>
    </div>
  );
}
