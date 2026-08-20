"use client";

import { useActionState } from "react";
import { saveCaracteristiques, type SaveState } from "./actions";

const initialState: SaveState = {};

export default function CaracteristiquesForm({
  bienId,
  prixAcquisitionCents,
  dateAcquisition,
}: {
  bienId: string;
  prixAcquisitionCents: number | null;
  dateAcquisition: string | null;
}) {
  const [state, formAction, pending] = useActionState(saveCaracteristiques, initialState);

  return (
    <div className="card">
      <h2>Prix d&apos;acquisition <span className="tag">nécessaire pour calculer la rentabilité</span></h2>
      <form action={formAction} style={{ display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center" }}>
        <input type="hidden" name="bien_id" value={bienId} />
        <input
          name="prix_acquisition"
          placeholder="Prix d'acquisition €"
          defaultValue={prixAcquisitionCents ? (prixAcquisitionCents / 100).toString() : ""}
          style={{ maxWidth: 160 }}
        />
        <input type="date" name="date_acquisition" defaultValue={dateAcquisition ?? ""} style={{ maxWidth: 150 }} />
        <button
          type="submit"
          disabled={pending}
          style={{ background: "var(--ink)", color: "#fff", border: "none", padding: "6px 14px", borderRadius: 20, fontSize: 11.5, cursor: "pointer", fontFamily: "inherit" }}
        >
          Enregistrer
        </button>
      </form>
      {state.error && <div style={{ color: "var(--brick)", fontSize: 11, marginTop: 4 }}>{state.error}</div>}
    </div>
  );
}
