"use client";

import { useActionState } from "react";
import { createAnalyse, type SaveState } from "./actions";

const initialState: SaveState = {};

export default function NouvelleAnalyseForm() {
  const [state, formAction, pending] = useActionState(createAnalyse, initialState);

  return (
    <div className="card">
      <h2>+ Nouvelle analyse</h2>
      <form action={formAction} style={{ display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap" }}>
        <input name="adresse" placeholder="Adresse du bien à l'étude" required style={{ maxWidth: 320 }} />
        <button
          type="submit"
          disabled={pending}
          style={{ background: "var(--sage)", color: "#fff", border: "none", padding: "6px 14px", borderRadius: 20, fontSize: 11.5, cursor: "pointer", fontFamily: "inherit" }}
        >
          {pending ? "..." : "Créer"}
        </button>
      </form>
      {state.error && <div style={{ color: "var(--brick)", fontSize: 11, marginTop: 4 }}>{state.error}</div>}
    </div>
  );
}
