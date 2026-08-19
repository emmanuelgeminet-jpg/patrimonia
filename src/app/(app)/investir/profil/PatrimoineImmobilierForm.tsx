"use client";

import { useActionState } from "react";
import { savePatrimoineImmobilier, type SaveState } from "./actions";

const initialState: SaveState = {};

export type PatrimoineImmobilier = {
  residence_principale_valeur_cents: number | null;
  residence_secondaire_valeur_cents: number | null;
  biens_locatifs_valeur_cents: number | null;
  scpi_valeur_cents: number | null;
};

function euros(cents: number | null | undefined): string {
  return cents ? (cents / 100).toString() : "";
}

export default function PatrimoineImmobilierForm({ initial }: { initial: PatrimoineImmobilier | null }) {
  const [state, formAction, pending] = useActionState(savePatrimoineImmobilier, initialState);

  return (
    <div className="card">
      <h2>5. Patrimoine immobilier</h2>
      <div className="card-sub">Valeurs estimées — les biens gérés dans &quot;Gestion immobilière&quot; (SCI, biens propres) n&apos;ont pas besoin d&apos;être resaisis ici, ils seront intégrés automatiquement à terme</div>
      {state.error && <div className="auth-error">{state.error}</div>}
      <form action={formAction}>
        <div className="form-row">
          <label>Résidence principale — valeur estimée</label>
          <input name="residence_principale" defaultValue={euros(initial?.residence_principale_valeur_cents)} placeholder="285000" />
        </div>
        <div className="form-row">
          <label>Résidence secondaire — valeur estimée</label>
          <input name="residence_secondaire" defaultValue={euros(initial?.residence_secondaire_valeur_cents)} placeholder="0" />
        </div>
        <div className="form-row">
          <label>Autres biens locatifs en nom propre — valeur</label>
          <input name="biens_locatifs" defaultValue={euros(initial?.biens_locatifs_valeur_cents)} placeholder="0" />
        </div>
        <div className="form-row">
          <label>SCPI — valeur estimée</label>
          <input name="scpi" defaultValue={euros(initial?.scpi_valeur_cents)} placeholder="0" />
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
