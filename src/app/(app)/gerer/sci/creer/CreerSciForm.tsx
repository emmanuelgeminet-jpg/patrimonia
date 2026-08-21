"use client";

import { useActionState } from "react";
import { creerSci, type SaveState } from "./actions";

const initialState: SaveState = {};

export default function CreerSciForm() {
  const [state, formAction, pending] = useActionState(creerSci, initialState);

  return (
    <div className="card">
      <h2>Créer ta SCI</h2>
      <div className="card-sub">
        Une fois créée, tu pourras ajouter un co-associé (même sans compte pour l&apos;instant — tu génères un lien
        d&apos;invitation à lui envoyer) depuis la page Comptes courants.
      </div>
      <form action={formAction} style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          <input name="nom" required placeholder="Nom de la SCI (ex : SCI Les Ormes)" style={{ minWidth: 240 }} />
          <input name="siren" placeholder="SIREN (optionnel)" style={{ maxWidth: 160 }} />
        </div>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          <input name="capital_social" placeholder="Capital social €" style={{ maxWidth: 160 }} />
          <input type="date" name="date_creation" style={{ maxWidth: 170 }} />
          <select name="regime_fiscal" defaultValue="IS" style={{ maxWidth: 140 }}>
            <option value="IS">IS</option>
            <option value="IR">IR</option>
          </select>
        </div>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center" }}>
          <label style={{ fontSize: 12.5, color: "var(--ink-soft)" }}>Tes parts à toi :</label>
          <input name="mes_parts" defaultValue="100" placeholder="Parts" style={{ maxWidth: 100 }} />
          <input name="mon_pourcentage" defaultValue="100" placeholder="%" style={{ maxWidth: 90 }} />
        </div>
        <div>
          <button
            type="submit"
            disabled={pending}
            style={{ background: "var(--sage)", color: "#fff", border: "none", padding: "8px 18px", borderRadius: 20, fontSize: 12, cursor: "pointer", fontFamily: "inherit" }}
          >
            {pending ? "..." : "Créer la SCI"}
          </button>
        </div>
      </form>
      {state.error && <div style={{ color: "var(--brick)", fontSize: 11, marginTop: 6 }}>{state.error}</div>}
    </div>
  );
}
