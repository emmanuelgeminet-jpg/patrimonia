"use client";

import { useActionState } from "react";
import { renameHousehold, type RenameHouseholdState } from "./actions";

const initialState: RenameHouseholdState = {};

export default function HouseholdNameForm({ currentName }: { currentName: string }) {
  const [state, formAction, pending] = useActionState(renameHousehold, initialState);

  return (
    <form action={formAction} style={{ display: "flex", gap: 6, alignItems: "center", marginTop: 10 }}>
      <input name="name" defaultValue={currentName} required style={{ maxWidth: 220 }} />
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
