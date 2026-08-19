"use client";

import { useActionState } from "react";
import { saveObjectifs, type SaveState } from "./actions";
import { formatEuros } from "@/lib/budget";

const initialState: SaveState = {};

export type Objectifs = {
  horizon_investissement: string | null;
  objectif_principal: string | null;
  appetence_risque: string | null;
  capacite_apport: string | null;
  epargne_precaution_cents: number | null;
};

export default function ObjectifsForm({ initial }: { initial: Objectifs | null }) {
  const [state, formAction, pending] = useActionState(saveObjectifs, initialState);

  return (
    <div className="card">
      <h2>2. Objectifs et profil d&apos;investisseur</h2>
      {state.error && <div className="auth-error">{state.error}</div>}
      <form action={formAction}>
        <div className="form-row">
          <label>Horizon d&apos;investissement</label>
          <select name="horizon_investissement" defaultValue={initial?.horizon_investissement ?? "Long terme (10 ans et +)"}>
            <option>Court terme (&lt; 5 ans)</option>
            <option>Moyen terme (5-10 ans)</option>
            <option>Long terme (10 ans et +)</option>
          </select>
        </div>
        <div className="form-row">
          <label>Objectif principal</label>
          <select name="objectif_principal" defaultValue={initial?.objectif_principal ?? "Constitution de patrimoine"}>
            <option>Revenus complémentaires</option>
            <option>Constitution de patrimoine</option>
            <option>Transmission</option>
            <option>Réduction d&apos;impôt</option>
            <option>Résidence future</option>
          </select>
        </div>
        <div className="form-row">
          <label>Appétence au risque</label>
          <select name="appetence_risque" defaultValue={initial?.appetence_risque ?? "Équilibrée"}>
            <option>Prudente</option>
            <option>Équilibrée</option>
            <option>Dynamique</option>
          </select>
        </div>
        <div className="form-row">
          <label>Capacité à mobiliser un apport</label>
          <select name="capacite_apport" defaultValue={initial?.capacite_apport ?? "Oui, sans difficulté"}>
            <option>Oui, sans difficulté</option>
            <option>Oui, avec effort</option>
            <option>Non, financement 110%</option>
          </select>
        </div>
        <div className="form-row">
          <label>Épargne de précaution souhaitée</label>
          <input
            name="epargne_precaution"
            defaultValue={initial?.epargne_precaution_cents ? (initial.epargne_precaution_cents / 100).toString() : ""}
            placeholder="5000"
          />
        </div>
        {initial?.epargne_precaution_cents ? (
          <div className="chart-caption">Actuellement : {formatEuros(initial.epargne_precaution_cents)}</div>
        ) : null}
        <div style={{ marginTop: 12 }}>
          <button
            type="submit"
            disabled={pending}
            style={{ background: "var(--ink)", color: "#fff", border: "none", padding: "8px 18px", borderRadius: 20, fontSize: 12, cursor: "pointer", fontFamily: "inherit" }}
          >
            {pending ? "..." : state.success ? "Enregistré ✓" : "Enregistrer"}
          </button>
        </div>
      </form>
    </div>
  );
}
