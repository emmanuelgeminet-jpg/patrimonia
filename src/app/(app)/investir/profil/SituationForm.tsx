"use client";

import { useActionState } from "react";
import { saveSituation, type SaveState } from "./actions";

const initialState: SaveState = {};

export type Situation = {
  composition_foyer: string | null;
  regime_matrimonial: string | null;
  donation_entre_epoux: boolean | null;
  nb_enfants: number | null;
  ages_conjoints: string | null;
  situation_professionnelle: string | null;
};

export default function SituationForm({ initial }: { initial: Situation | null }) {
  const [state, formAction, pending] = useActionState(saveSituation, initialState);

  return (
    <div className="card">
      <h2>1. Situation du foyer</h2>
      {state.error && <div className="auth-error">{state.error}</div>}
      <form action={formAction}>
        <div className="form-row">
          <label>Composition du foyer</label>
          <select name="composition_foyer" defaultValue={initial?.composition_foyer ?? "Couple marié"}>
            <option>Couple marié</option>
            <option>Couple pacsé</option>
            <option>Concubinage</option>
            <option>Personne seule</option>
          </select>
        </div>
        <div className="form-row">
          <label>Régime matrimonial</label>
          <select name="regime_matrimonial" defaultValue={initial?.regime_matrimonial ?? "Communauté d'acquêts"}>
            <option>Communauté d&apos;acquêts</option>
            <option>Séparation de biens</option>
            <option>Communauté universelle</option>
            <option>Participation aux acquêts</option>
          </select>
        </div>
        <div className="form-row">
          <label>Donation entre époux</label>
          <select name="donation_entre_epoux" defaultValue={initial?.donation_entre_epoux ? "Oui" : "Non"}>
            <option>Oui</option>
            <option>Non</option>
          </select>
        </div>
        <div className="form-row">
          <label>Nombre d&apos;enfants à charge</label>
          <input name="nb_enfants" type="number" min={0} defaultValue={initial?.nb_enfants ?? ""} placeholder="0" />
        </div>
        <div className="form-row">
          <label>Âge des deux conjoints</label>
          <input name="ages_conjoints" defaultValue={initial?.ages_conjoints ?? ""} placeholder="32 ans / 29 ans" />
        </div>
        <div className="form-row">
          <label>Situation professionnelle</label>
          <input
            name="situation_professionnelle"
            defaultValue={initial?.situation_professionnelle ?? ""}
            placeholder="Gendarme / Secrétaire"
          />
        </div>
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
