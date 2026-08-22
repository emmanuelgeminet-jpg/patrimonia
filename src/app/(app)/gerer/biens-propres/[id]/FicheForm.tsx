"use client";

import { useActionState } from "react";
import { saveFiche, type SaveState } from "./actions";

const initialState: SaveState = {};

export type Fiche = {
  bienId: string;
  dpeClasse: string | null;
  dpeDate: string | null;
  monopropriete: boolean;
  numeroImmatriculation: string | null;
  assuranceCompagnie: string | null;
  assurancePolice: string | null;
  notes: string | null;
  cleRepartitionDefaut: string;
};

export default function FicheForm({ fiche }: { fiche: Fiche }) {
  const [state, formAction, pending] = useActionState(saveFiche, initialState);

  return (
    <div className="card">
      <h2>Fiche du bien</h2>
      <div className="card-sub">DPE, régime de propriété, assurance — les informations qu&apos;un notaire ou une agence demanderont en premier</div>
      <form action={formAction} style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        <input type="hidden" name="bien_id" value={fiche.bienId} />

        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center" }}>
          <label style={{ fontSize: 12 }}>DPE :</label>
          <select name="dpe_classe" defaultValue={fiche.dpeClasse ?? ""} style={{ maxWidth: 90 }}>
            <option value="">—</option>
            {["A", "B", "C", "D", "E", "F", "G"].map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
          <input type="date" name="dpe_date" defaultValue={fiche.dpeDate ?? ""} style={{ maxWidth: 150 }} />
          <span style={{ fontSize: 10.5, color: "var(--ink-soft)" }}>(validité 10 ans — audit énergétique obligatoire si F ou G)</span>
        </div>

        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center" }}>
          <label style={{ fontSize: 12 }}>Régime :</label>
          <select name="monopropriete" defaultValue={fiche.monopropriete ? "oui" : "non"} style={{ maxWidth: 160 }}>
            <option value="oui">Monopropriété</option>
            <option value="non">Copropriété</option>
          </select>
          <input name="numero_immatriculation" defaultValue={fiche.numeroImmatriculation ?? ""} placeholder="N° immatriculation copropriété (si copro)" style={{ maxWidth: 260 }} />
        </div>

        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center" }}>
          <label style={{ fontSize: 12 }}>Assurance PNO :</label>
          <input name="assurance_compagnie" defaultValue={fiche.assuranceCompagnie ?? ""} placeholder="Compagnie" style={{ maxWidth: 160 }} />
          <input name="assurance_police" defaultValue={fiche.assurancePolice ?? ""} placeholder="N° de police" style={{ maxWidth: 160 }} />
        </div>

        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center" }}>
          <label style={{ fontSize: 12 }}>Répartition des charges entre logements :</label>
          <select name="cle_repartition_defaut" defaultValue={fiche.cleRepartitionDefaut} style={{ maxWidth: 220 }}>
            <option value="surface">Selon la surface</option>
            <option value="egale">Également entre les logements</option>
            <option value="tantiemes">Selon les tantièmes de copropriété</option>
          </select>
        </div>

        <textarea
          name="notes"
          defaultValue={fiche.notes ?? ""}
          placeholder="Notes libres (historique de travaux, particularités, points de vigilance...)"
          rows={3}
          style={{ width: "100%", fontFamily: "inherit", fontSize: 12.5, padding: 8 }}
        />

        <div>
          <button
            type="submit"
            disabled={pending}
            style={{ background: "var(--ink)", color: "#fff", border: "none", padding: "8px 18px", borderRadius: 20, fontSize: 12, cursor: "pointer", fontFamily: "inherit" }}
          >
            {pending ? "..." : "Enregistrer"}
          </button>
        </div>
      </form>
      {state.error && <div style={{ color: "var(--brick)", fontSize: 11, marginTop: 6 }}>{state.error}</div>}
    </div>
  );
}
