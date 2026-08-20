"use client";

import { useActionState } from "react";
import { saveLoyerVise, type SaveState } from "./actions";

const initialState: SaveState = {};

export default function LoyerViseForm({ loyerViseCents }: { loyerViseCents: number | null }) {
  const [state, formAction, pending] = useActionState(saveLoyerVise, initialState);

  return (
    <form action={formAction} style={{ display: "flex", gap: 6, alignItems: "center", marginTop: 6 }}>
      <input
        name="loyer_vise"
        defaultValue={loyerViseCents ? (loyerViseCents / 100).toString() : ""}
        placeholder="700"
        style={{ maxWidth: 64, fontSize: 11 }}
      />
      <span style={{ fontSize: 10.5, color: "var(--ink-soft)" }}>€/mois visés</span>
      <button
        type="submit"
        disabled={pending}
        style={{ background: "var(--ink)", color: "#fff", border: "none", padding: "3px 10px", borderRadius: 20, fontSize: 10.5, cursor: "pointer", fontFamily: "inherit" }}
      >
        {pending ? "..." : "OK"}
      </button>
      {state.error && <span style={{ color: "var(--brick)", fontSize: 10.5 }}>{state.error}</span>}
    </form>
  );
}
