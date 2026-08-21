"use client";

import { useActionState } from "react";
import { renameHousehold, type RenameHouseholdState } from "./actions";

const initialState: RenameHouseholdState = {};

export default function HouseholdNameForm({ currentName, currentAdresse }: { currentName: string; currentAdresse?: string | null }) {
  const [state, formAction, pending] = useActionState(renameHousehold, initialState);

  return (
    <form action={formAction} style={{ display: "flex", gap: 6, alignItems: "center", marginTop: 10, flexWrap: "wrap" }}>
      <input name="name" defaultValue={currentName} required style={{ maxWidth: 220 }} />
      <input name="adresse" defaultValue={currentAdresse ?? ""} placeholder="Adresse du foyer (bailleur pour un bien en nom propre)" style={{ maxWidth: 300 }} />
      <button
        type="submit"
        disabled={pending}
        style={{ background: "var(--ink)", color: "#fff", border: "none", padding: "6px 14px", borderRadius: 20, fontSize: 11.5, cursor: "pointer", fontFamily: "inherit" }}
      >
        {pending ? "..." : state.success ? "Enregistré ✓" : "Renommer"}
      </button>
      {state.error && <span style={{ color: "var(--brick)", fontSize: 11 }}>{state.error}</span>}
    </form>
  );
}
