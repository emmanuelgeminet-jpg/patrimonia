"use client";

import { useActionState } from "react";
import { saveFinancement, type SaveState } from "./actions";

const initialState: SaveState = {};

export default function FinancementForm({
  bienId,
  prixAcquisitionCents,
  dateAcquisition,
  creditMensualiteCents,
  assuranceMensuelleCents,
  chargesCoproAnnuellesCents,
}: {
  bienId: string;
  prixAcquisitionCents: number | null;
  dateAcquisition: string | null;
  creditMensualiteCents: number | null;
  assuranceMensuelleCents: number | null;
  chargesCoproAnnuellesCents: number | null;
}) {
  const [state, formAction, pending] = useActionState(saveFinancement, initialState);

  return (
    <div className="card">
      <h2>Financement &amp; charges <span className="tag">saisie manuelle</span></h2>
      <form action={formAction} style={{ display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center" }}>
        <input type="hidden" name="bien_id" value={bienId} />
        <input
          name="prix_acquisition"
          placeholder="Prix d'acquisition €"
          defaultValue={prixAcquisitionCents ? (prixAcquisitionCents / 100).toString() : ""}
          style={{ maxWidth: 150 }}
        />
        <input type="date" name="date_acquisition" defaultValue={dateAcquisition ?? ""} style={{ maxWidth: 140 }} />
        <input
          name="credit_mensualite"
          placeholder="Mensualité crédit €"
          defaultValue={creditMensualiteCents ? (creditMensualiteCents / 100).toString() : ""}
          style={{ maxWidth: 140 }}
        />
        <input
          name="assurance_mensuelle"
          placeholder="Assurance €/mois"
          defaultValue={assuranceMensuelleCents ? (assuranceMensuelleCents / 100).toString() : ""}
          style={{ maxWidth: 130 }}
        />
        <input
          name="charges_copro_annuelles"
          placeholder="Charges copro €/an"
          defaultValue={chargesCoproAnnuellesCents ? (chargesCoproAnnuellesCents / 100).toString() : ""}
          style={{ maxWidth: 150 }}
        />
        <button
          type="submit"
          disabled={pending}
          style={{ background: "var(--ink)", color: "#fff", border: "none", padding: "6px 14px", borderRadius: 20, fontSize: 11.5, cursor: "pointer", fontFamily: "inherit" }}
        >
          Enregistrer
        </button>
      </form>
      <div className="placeholder-note" style={{ marginTop: 8 }}>
        Laisse &quot;Charges copro €/an&quot; à 0 si le bien n&apos;est pas en copropriété (maison individuelle).
      </div>
      {state.error && <div style={{ color: "var(--brick)", fontSize: 11, marginTop: 4 }}>{state.error}</div>}
    </div>
  );
}
