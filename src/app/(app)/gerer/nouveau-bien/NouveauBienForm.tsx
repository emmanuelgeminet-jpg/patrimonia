"use client";

import { useActionState } from "react";
import { creerBien, type SaveState } from "./actions";

const initialState: SaveState = {};

export default function NouveauBienForm() {
  const [state, formAction, pending] = useActionState(creerBien, initialState);

  return (
    <div className="card">
      {state.success && (
        <div className="placeholder-note" style={{ background: "var(--sage-soft)", color: "var(--sage)", marginBottom: 12 }}>
          Bien enregistré ✓ — retrouve-le dans &quot;Par immeuble&quot; (SCI) ou dans la fiche de ton foyer selon le
          mode de détention choisi. Tu peux en ajouter un autre ci-dessous.
        </div>
      )}
      {state.error && <div className="auth-error">{state.error}</div>}
      <form action={formAction} key={state.success ? "done" : "form"}>
        <div className="form-row"><label>Type de bien</label>
          <select name="type" defaultValue="Immeuble">
            <option>Immeuble</option><option>Maison</option><option>Appartement isolé</option><option>Garage</option><option>Local commercial</option>
          </select>
        </div>
        <div className="form-row"><label>Adresse</label><input name="adresse" placeholder="13 rue des Cordeliers" required /></div>
        <div className="form-row"><label>Date d&apos;acquisition</label><input type="date" name="date_acquisition" /></div>
        <div className="form-row"><label>Prix d&apos;acquisition</label><input name="prix_acquisition" placeholder="€" /></div>
        <div className="form-row"><label>Nombre de lots</label><input name="nombre_lots" placeholder="3" /></div>
        <div className="form-row"><label>Mode de détention</label>
          <select name="mode_detention" defaultValue="Bien propre (nom propre)">
            <option>Bien propre (nom propre)</option><option>Nue-propriété / usufruit</option><option>SCI à l&apos;IR</option><option>SCI à l&apos;IS</option>
          </select>
        </div>
        <div className="form-row"><label>Mode de location</label>
          <select name="mode_location" defaultValue="Location nue">
            <option>Location nue</option><option>Location meublée</option>
          </select>
        </div>
        <div className="form-row"><label>Régime fiscal</label>
          <select name="regime_fiscal" defaultValue="Micro-foncier">
            <option>Micro-foncier</option><option>Réel foncier (formulaire 2044)</option><option>Micro-BIC (LMNP)</option><option>Réel BIC (LMNP/LMP)</option><option>Imposition à l&apos;IS (SCI)</option>
          </select>
        </div>
        <div style={{ marginTop: 12 }}>
          <button
            type="submit"
            disabled={pending}
            style={{ background: "var(--ink)", color: "#fff", border: "none", padding: "8px 18px", borderRadius: 20, fontSize: 12, cursor: "pointer", fontFamily: "inherit" }}
          >
            {pending ? "..." : "Enregistrer ce bien"}
          </button>
        </div>
      </form>
    </div>
  );
}
